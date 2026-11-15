/* =====================================================
   Vasugi D Portfolio — script.js
   Unified interactions, robust media lightbox, and IoT tools
   ===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    /* --- Sticky nav shadow on scroll --- */
    var navbar = document.querySelector(".navbar");
    function onScroll() {
      if (!navbar) return;
      navbar.classList.toggle("scrolled", window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* --- Mobile menu toggle --- */
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("open");
        toggle.classList.toggle("open");
        toggle.setAttribute("aria-expanded", links.classList.contains("open"));
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          links.classList.remove("open");
          toggle.classList.remove("open");
        }
      });
    }

    /* --- Highlight the current page link --- */
    var page = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      if (a.getAttribute("href") === page) a.classList.add("active");
    });

    /* --- Scroll reveal --- */
    var targets = document.querySelectorAll(
      ".reveal, .card, .week-card, .timeline-item, .stat, .skill"
    );
    targets.forEach(function (el) {
      // Do not hide cards inside task panels so deep links don't get stuck at opacity 0
      if (!el.closest(".task-panel-content")) {
        el.classList.add("reveal");
      }
    });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry, i) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            setTimeout(function () {
              el.classList.add("visible");
              var bar = el.querySelector(".bar i");
              if (bar && bar.dataset.level) bar.style.width = bar.dataset.level + "%";
            }, Math.min(i * 80, 320));
            io.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      targets.forEach(function (el) {
        if (!el.closest(".task-panel-content")) {
          io.observe(el);
        } else {
          el.classList.add("visible");
        }
      });
    } else {
      targets.forEach(function (el) {
        el.classList.add("visible");
        var bar = el.querySelector(".bar i");
        if (bar && bar.dataset.level) bar.style.width = bar.dataset.level + "%";
      });
    }

    /* --- Pointer glow on cards --- */
    document.querySelectorAll(".card, .week-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });

    /* --- Count-up stats --- */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || "";
      var decimals = (el.dataset.count.split(".")[1] || "").length;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1200, 1);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });

    /* --- Contact form mailto --- */
    var form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = document.getElementById("form-note");
        var name = form.name.value.trim();
        var email = form.email.value.trim();
        var message = form.message.value.trim();
        if (!name || !email || !message) {
          if (note) note.textContent = "Please fill in every field.";
          return;
        }
        var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
        var subject = encodeURIComponent("Portfolio enquiry from " + name);
        window.location.href =
          "mailto:vasugi.23mc@kct.ac.in?subject=" + subject + "&body=" + body;
        if (note) note.textContent = "Opening your email app…";
        form.reset();
      });
    }

    /* --- Footer year --- */
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    /* =====================================================
       Code Box Copy Button
       ===================================================== */
    document.querySelectorAll(".code-copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var codeBox = btn.closest(".code-box");
        if (!codeBox) return;
        var codeEl = codeBox.querySelector(".code-content");
        if (!codeEl) return;
        var text = codeEl.innerText || codeEl.textContent;
        navigator.clipboard.writeText(text).then(function () {
          var originalText = btn.textContent;
          btn.textContent = "✓ Copied!";
          btn.style.borderColor = "var(--green)";
          btn.style.color = "var(--green)";
          setTimeout(function () {
            btn.textContent = originalText;
            btn.style.borderColor = "";
            btn.style.color = "";
          }, 2000);
        }).catch(function () {
          btn.textContent = "Selected";
        });
      });
    });

    /* =====================================================
       Task 1: Interactive Live LED Simulation Widget
       ===================================================== */
    var simIndicator = document.getElementById("sim-indicator");
    var simText = document.getElementById("sim-state-text");
    var simLog = document.getElementById("sim-http-log");
    var btnOn = document.getElementById("sim-btn-on");
    var btnOff = document.getElementById("sim-btn-off");

    if (simIndicator && simText) {
      if (btnOn) {
        btnOn.addEventListener("click", function () {
          simIndicator.className = "sim-indicator on";
          simText.textContent = "ON (HIGH — 3.3V)";
          simText.style.color = "#3dcc8e";
          if (simLog) {
            simLog.textContent = "HTTP/1.1 GET /H -> Status 200 OK -> ESP32 GPIO 2 SET HIGH";
            simLog.style.color = "#3dcc8e";
          }
        });
      }
      if (btnOff) {
        btnOff.addEventListener("click", function () {
          simIndicator.className = "sim-indicator off";
          simText.textContent = "OFF (LOW — 0V)";
          simText.style.color = "#e85a5a";
          if (simLog) {
            simLog.textContent = "HTTP/1.1 GET /L -> Status 200 OK -> ESP32 GPIO 2 SET LOW";
            simLog.style.color = "#e85a5a";
          }
        });
      }
    }

    /* =====================================================
       Task 2: Interactive Live Relay & Bulb Simulation Widget
       ===================================================== */
    var sim2Indicator = document.getElementById("sim2-bulb-indicator");
    var sim2Text = document.getElementById("sim2-bulb-state");
    var sim2Log = document.getElementById("sim2-mqtt-log");
    var btn2On = document.getElementById("sim2-btn-on");
    var btn2Off = document.getElementById("sim2-btn-off");

    if (sim2Indicator && sim2Text) {
      if (btn2On) {
        btn2On.addEventListener("click", function () {
          sim2Indicator.className = "sim-indicator on";
          sim2Text.textContent = "ON (230V AC Mains Energized)";
          sim2Text.style.color = "#3dcc8e";
          if (sim2Log) {
            sim2Log.textContent = "Adafruit IO MQTT Publish -> feed 'bulb-control'='ON' -> ESP32 GPIO 5 SET LOW (Relay Closed)";
            sim2Log.style.color = "#3dcc8e";
          }
        });
      }
      if (btn2Off) {
        btn2Off.addEventListener("click", function () {
          sim2Indicator.className = "sim-indicator off";
          sim2Text.textContent = "OFF (Mains Open)";
          sim2Text.style.color = "#e85a5a";
          if (sim2Log) {
            sim2Log.textContent = "Adafruit IO MQTT Publish -> feed 'bulb-control'='OFF' -> ESP32 GPIO 5 SET HIGH (Relay Open)";
            sim2Log.style.color = "#e85a5a";
          }
        });
      }
    }

    /* =====================================================
       IoT Task Tabs Navigation (Task 1 to Task 5)
       ===================================================== */
    var taskButtons = document.querySelectorAll(".task-tab-btn");
    var taskPanels = document.querySelectorAll(".task-panel-content");
    if (taskButtons.length > 0 && taskPanels.length > 0) {
      function activateTab(cleanTarget) {
        if (!cleanTarget) return;
        cleanTarget = cleanTarget.replace("panel-", "").replace("#", "");

        taskButtons.forEach(function (b) {
          var tId = (b.getAttribute("data-target") || b.getAttribute("href") || "")
            .replace("panel-", "")
            .replace("#", "");
          if (tId === cleanTarget) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });

        taskPanels.forEach(function (panel) {
          var cleanPanelId = panel.id.replace("panel-", "");
          if (cleanPanelId === cleanTarget) {
            panel.style.display = "block";
            panel.classList.add("visible");
            panel.querySelectorAll(".card, .glass").forEach(function (c) {
              c.classList.add("visible");
              c.style.opacity = "1";
            });
            // Smooth scroll into view
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            panel.style.display = "none";
          }
        });
      }

      taskButtons.forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          var targetId = btn.getAttribute("data-target") || "";
          var href = btn.getAttribute("href") || "";
          var cleanTarget = targetId.replace("panel-", "").replace("#", "") || href.replace("#", "");
          if (!cleanTarget) return;
          e.preventDefault();
          activateTab(cleanTarget);
          if (history.replaceState) {
            history.replaceState(null, null, "#panel-" + cleanTarget);
          }
        });
      });

      // Handle deep linking from URL hash (e.g. iot.html#task-1 or #panel-task-2)
      if (window.location.hash) {
        var initialHash = window.location.hash.substring(1);
        setTimeout(function () {
          activateTab(initialHash);
        }, 120);
      }
    }

    /* =====================================================
       UNIFIED FULLSCREEN LIGHTBOX (Photos & Videos)
       ===================================================== */
    var unifiedModal = document.getElementById("unified-media-modal");
    if (!unifiedModal) {
      unifiedModal = document.createElement("div");
      unifiedModal.id = "unified-media-modal";
      unifiedModal.className = "lightbox-modal";
      unifiedModal.innerHTML =
        '<button class="lightbox-close" aria-label="Close viewer">&times;</button>' +
        '<div class="lightbox-content">' +
          '<div id="unified-media-body" style="display:flex; justify-content:center; align-items:center; width:100%; max-height:76vh;"></div>' +
          '<div id="unified-media-caption" class="lightbox-caption"></div>' +
          '<div id="unified-media-actions" style="margin-top:0.8rem; display:flex; gap:0.6rem; flex-wrap:wrap; justify-content:center;"></div>' +
        '</div>';
      document.body.appendChild(unifiedModal);
    }

    var modalBody = document.getElementById("unified-media-body");
    var modalCaption = document.getElementById("unified-media-caption");
    var modalActions = document.getElementById("unified-media-actions");
    var modalClose = unifiedModal.querySelector(".lightbox-close");

    function openMediaModal(type, src, caption, downloadName) {
      if (!modalBody) return;
      modalBody.innerHTML = "";
      modalCaption.textContent = caption || "";
      modalActions.innerHTML = "";

      if (type === "video") {
        var videoEl = document.createElement("video");
        videoEl.className = "lightbox-media";
        videoEl.controls = true;
        videoEl.autoplay = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.src = src;
        videoEl.style.maxHeight = "72vh";
        videoEl.style.maxWidth = "90vw";
        videoEl.style.borderRadius = "12px";
        videoEl.style.boxShadow = "0 20px 60px rgba(0,0,0,0.9)";

        // Handle load error in modal
        videoEl.onerror = function () {
          var fallbackMsg = document.createElement("div");
          fallbackMsg.style.padding = "2rem";
          fallbackMsg.style.textAlign = "center";
          fallbackMsg.style.color = "var(--text)";
          fallbackMsg.innerHTML =
            "<p style='margin-bottom:1rem; font-size:1.1rem; color:var(--red);'>⚠️ Direct browser playback blocked by local security policy.</p>" +
            "<p style='margin-bottom:1.2rem; color:var(--text2);'>You can open or download the native MP4 file directly below:</p>" +
            "<a href='" + src + "' target='_blank' class='btn btn-primary' style='padding:0.6rem 1.4rem; font-size:0.9rem;'>▶ Open MP4 in Dedicated Browser Tab</a>";
          modalBody.innerHTML = "";
          modalBody.appendChild(fallbackMsg);
        };

        modalBody.appendChild(videoEl);

        // Action button in modal
        var dlBtn = document.createElement("a");
        dlBtn.href = src;
        dlBtn.download = downloadName || "iot_video.mp4";
        dlBtn.className = "btn btn-primary";
        dlBtn.style.fontSize = "0.85rem";
        dlBtn.style.padding = "0.45rem 1rem";
        dlBtn.innerHTML = "💾 Download Video (.mp4)";
        modalActions.appendChild(dlBtn);

        var openTabBtn = document.createElement("a");
        openTabBtn.href = src;
        openTabBtn.target = "_blank";
        openTabBtn.className = "btn btn-ghost";
        openTabBtn.style.fontSize = "0.85rem";
        openTabBtn.style.padding = "0.45rem 1rem";
        openTabBtn.innerHTML = "↗ Open in New Tab";
        modalActions.appendChild(openTabBtn);

        // Try playing
        videoEl.play().catch(function () {
          // Autoplay blocked: user can click controls
        });
      } else {
        var imgEl = document.createElement("img");
        imgEl.className = "lightbox-media";
        imgEl.src = src;
        imgEl.alt = caption || "Full Preview";
        imgEl.style.maxHeight = "75vh";
        imgEl.style.maxWidth = "90vw";
        imgEl.style.borderRadius = "12px";
        imgEl.style.boxShadow = "0 20px 60px rgba(0,0,0,0.9)";
        modalBody.appendChild(imgEl);

        var dlImgBtn = document.createElement("a");
        dlImgBtn.href = src;
        dlImgBtn.download = (caption ? caption.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 25) : "photo") + ".jpg";
        dlImgBtn.className = "btn btn-ghost";
        dlImgBtn.style.fontSize = "0.85rem";
        dlImgBtn.style.padding = "0.45rem 1rem";
        dlImgBtn.innerHTML = "💾 Save Photo";
        modalActions.appendChild(dlImgBtn);
      }

      unifiedModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeMediaModal() {
      unifiedModal.classList.remove("active");
      document.body.style.overflow = "";
      if (modalBody) {
        var vid = modalBody.querySelector("video");
        if (vid) {
          vid.pause();
          vid.src = "";
        }
        modalBody.innerHTML = "";
      }
    }

    if (modalClose) modalClose.addEventListener("click", closeMediaModal);
    unifiedModal.addEventListener("click", function (e) {
      if (e.target === unifiedModal || e.target === modalBody) {
        closeMediaModal();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && unifiedModal.classList.contains("active")) {
        closeMediaModal();
      }
    });

    /* --- Bind All Photos for Fullscreen Lightbox Zoom --- */
    var clickableImages = document.querySelectorAll(
      ".iot-gallery-card img, .clickable-photo, .featured-image img, .circuit-svg-container img"
    );
    clickableImages.forEach(function (img) {
      img.style.cursor = "zoom-in";
      img.setAttribute("title", "Click to enlarge full resolution photo");
      img.addEventListener("click", function () {
        var caption = "";
        var card = img.closest(".iot-gallery-card") || img.closest(".glass");
        if (card) {
          var p = card.querySelector("p");
          if (p) caption = p.textContent || p.innerText;
        }
        if (!caption) caption = img.getAttribute("alt") || "Laboratory Setup View";
        openMediaModal("image", img.currentSrc || img.src, caption);
      });
    });

    /* --- Bind Video Modal Buttons --- */
    document.querySelectorAll(".btn-open-video-modal").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var vidSrc = btn.getAttribute("data-video-src") || "iot_assets/task1_video.mp4";
        var caption = btn.getAttribute("data-video-caption") || "Demonstration Video Playback";
        openMediaModal("video", vidSrc, caption);
      });
    });

    /* =====================================================
       Inline Video Error Resilience & Fallback Support
       ===================================================== */
    document.querySelectorAll(".video-player-container video").forEach(function (video) {
      // If error loading video on file:/// or codec failure, display animated WebP fallback
      video.addEventListener("error", function () {
        var fallbackImg = video.querySelector("img");
        if (fallbackImg && fallbackImg.src) {
          var container = video.closest(".video-player-container");
          if (container && !container.querySelector(".fallback-active-img")) {
            fallbackImg.className = "fallback-active-img";
            fallbackImg.style.width = "100%";
            fallbackImg.style.display = "block";
            fallbackImg.style.borderRadius = "14px";
            container.appendChild(fallbackImg);
            video.style.display = "none";
          }
        }
      });

      // Quick play toggle on click
      video.addEventListener("click", function () {
        if (video.paused) {
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    });

    /* --- Video Play/Pause Overlay --- */
    document.querySelectorAll(".video-player-container").forEach(function (container) {
      var video = container.querySelector("video");
      var overlay = container.querySelector(".video-play-overlay");
      if (!video || !overlay) return;

      overlay.addEventListener("click", function () {
        if (video.paused) {
          video.play().catch(function () {});
          overlay.classList.add("playing");
        } else {
          video.pause();
          overlay.classList.remove("playing");
        }
      });

      video.addEventListener("play", function () {
        overlay.classList.add("playing");
      });
      video.addEventListener("pause", function () {
        overlay.classList.remove("playing");
      });
      video.addEventListener("ended", function () {
        overlay.classList.remove("playing");
      });
    });
  });
})();
