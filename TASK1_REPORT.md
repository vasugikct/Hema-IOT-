# Task 1: ESP32 Web Server & HTML LED Control
**Course / Laboratory:** Internet of Things (IoT) & Embedded Automation  
**Author:** Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)  
**Status:** Completed, Physically Validated & Packaged  
**Hardware Platform:** ESP32 DevKit V1 (Tensilica Xtensa Dual-Core 32-bit LX6)  

---

## Deliverables Verification Matrix

| # | Required Item | Verification Status | Location / Artifact |
|:---|:---|:---:|:---|
| 1 | **Objective of the assignment and problem addressed** | ☑ Completed | Section 1 |
| 2 | **Basic concept of an ESP32 Web Server** | ☑ Completed | Section 2 |
| 3 | **How the ESP32 and browser communicate over Wi-Fi** | ☑ Completed | Section 3 |
| 4 | **Hardware components used** | ☑ Completed | Section 4 |
| 5 | **Circuit/wiring diagram** | ☑ Completed | Section 5 & `images/` |
| 6 | **ESP32 pin connections** | ☑ Completed | Section 6 |
| 7 | **Complete Arduino/ESP32 source code** | ☑ Completed | Section 7 & `code/task1_esp32_webserver_led.ino` |
| 8 | **HTML interface developed for controlling the LED** | ☑ Completed | Section 8 |
| 9 | **How the webpage sends a command to the ESP32** | ☑ Completed | Section 9 |
| 10 | **Photographs of the physical setup** | ☑ Completed | Section 10 & `images/` |
| 11 | **Screenshots of the web interface** | ☑ Completed | Section 11 & `images/` |
| 12 | **Video demonstrating LED ON/OFF control** | ☑ Completed | Section 12 & `video/task1_video.mp4` |
| 13 | **Problems encountered and how they were solved** | ☑ Completed | Section 13 |
| 14 | **Brief reflection on what you learned** | ☑ Completed | Section 14 |
| 15 | **All required files/code available in repository** | ☑ Completed | Section 15 & `IoT_Task1_ESP32_WebServer/` |

---

## 1. Objective of the Assignment & Problem Addressed

### 1.1 Objective
To develop, flash, and physically validate an embedded standalone HTTP web server executing on an **ESP32 DevKit V1** microcontroller connected to a local Wi-Fi intranet (IEEE 802.11b/g/n). The web server serves a custom, lightweight, responsive HTML user interface allowing any network-authenticated browser client (laptop or mobile smartphone) to send HTTP GET commands to actuate a physical Light Emitting Diode (LED) on and off in real time with instantaneous visual feedback.

### 1.2 Problem Being Addressed
- **Hardwired Actuation Bottlenecks:** Conventional mechatronic controls rely heavily on physical toggle switches and manual operators, which increases wiring harness mass, limits accessibility in hazardous/enclosed setups, and precludes automated oversight.
- **Third-Party Cloud Dependencies:** Typical modern commercial smart plugs and IoT devices rely on external public cloud brokers (AWS IoT, Adafruit IO, Blynk, Tuya). This introduces high round-trip latency, internet bandwidth consumption, recurring subscription costs, and severe security/privacy vulnerabilities if external network connectivity fails.
- **The Edge Solution:** Operating a self-contained local web server directly on the ESP32 microcontroller establishes a zero-cloud, intranet-isolated cyber-physical link that functions completely offline within the local Wi-Fi subnet.

---

## 2. Basic Concept of an ESP32 Web Server

The ESP32 is equipped with a high-performance **Tensilica Xtensa dual-core 32-bit LX6 microprocessor** operating at clock frequencies up to 240 MHz, accompanied by 520 KB internal SRAM and integrated 2.4 GHz Wi-Fi radio baseband.

1. **Station (STA) Networking Mode:**
   Using the `WiFi.h` library, the ESP32 initializes its radio in Station mode (`WIFI_STA`), authenticates against an Access Point (AP) using WPA2-PSK credentials, and requests an IPv4 lease via Dynamic Host Configuration Protocol (DHCP).
2. **TCP Socket Server on Port 80:**
   The `WiFiServer server(80);` instance binds a listening socket to standard HTTP TCP port 80.
3. **Event Loop & Socket Handling:**
   In the main `loop()`, `server.available()` polls the underlying lwIP (Lightweight IP) network stack. When an incoming TCP SYN packet arrives from a client browser, a connection is accepted.
4. **Request Ingestion & Parsing:**
   The server reads the client's HTTP request stream character-by-character into a buffer, identifies the Uniform Resource Identifier (URI), triggers the corresponding GPIO logic, and writes back standard HTTP response headers (`HTTP/1.1 200 OK`) alongside the dynamic HTML payload.

---

## 3. How ESP32 and Browser Communicate over Wi-Fi

The communication architecture adheres strictly to the **Client-Server HTTP Request-Response lifecycle** operating on top of the TCP/IP stack over IEEE 802.11 Wi-Fi.

```
+-----------------------------------------------------------------------------------------+
|                                    WLAN ROUTER / AP                                     |
|                               (DHCP Subnet: 192.168.1.0/24)                              |
+-----------------------------------------------------------------------------------------+
             ▲                                                              ▲
             │ Wi-Fi Channel (802.11n)                                      │ Wi-Fi Channel
             ▼                                                              ▼
+-------------------------+                                    +--------------------------+
|      CLIENT BROWSER     |                                    |     ESP32 WEB SERVER     |
| (Laptop / Smartphone)   |                                    |   (IP: 192.168.1.105)    |
|                         |                                    |                          |
| 1. User taps "TURN ON"  | === HTTP GET /H HTTP/1.1 =========>| 2. TCP socket receives   |
|                         |                                    |    string buffer         |
|                         |                                    | 3. header.indexOf("/H")  |
|                         |                                    | 4. digitalWrite(2, HIGH) |
| 6. Browser renders HTML | <== HTTP/1.1 200 OK + HTML Payload | 5. Streams HTML document |
|    with LED State: ON   |                                    |    with state update     |
+-------------------------+                                    +--------------------------+
```

### Detailed Handshake Stages:
1. **TCP Handshake:** Browser issues `SYN` packet to `http://<ESP32_IP>:80`. ESP32 responds with `SYN-ACK`, and client responds with `ACK`.
2. **HTTP Request Transmission:**
   ```http
   GET /H HTTP/1.1
   Host: 192.168.1.105
   User-Agent: Mozilla/5.0 ...
   Connection: keep-alive
   ```
3. **Firmware Route Parsing:** The ESP32 inspects the request line before the blank line `\r\n\r\n`:
   - If URI contains `/H`, GPIO 2 is driven **HIGH (3.3V)**.
   - If URI contains `/L`, GPIO 2 is driven **LOW (0V)**.
4. **HTTP Response Transmission:**
   ```http
   HTTP/1.1 200 OK
   Content-type:text/html
   Connection: close

   <!DOCTYPE html>...[HTML UI Payload]...</html>
   ```
5. **Connection Termination:** Client connection is closed cleanly with `client.stop()`.

---

## 4. Hardware Components Used

| Item | Component Name | Description / Rating | Quantity | Purpose in Experiment |
|:---:|:---|:---|:---:|:---|
| 1 | **ESP32 DevKit V1** | 30-pin, dual-core 240 MHz, 4MB Flash, CP2102 | 1 | Microcontroller & Wi-Fi Web Server |
| 2 | **Light Emitting Diode (LED)** | 5mm Round Diffused, $V_F \approx 2.0\,\text{V}$, $I_F = 10\text{–}20\,\text{mA}$ | 1 | Visual physical output actuator |
| 3 | **Current-Limiting Resistor** | $220\,\Omega$, $1/4\,\text{W}$, Metal film ($\pm 5\%$) | 1 | Current limiting to prevent GPIO burnout |
| 4 | **Solderless Breadboard** | 400 tie-points, power rails | 1 | Prototyping physical interconnections |
| 5 | **DuPont Jumper Wires** | Male-to-Male (20 cm) | 2 | Signal (GPIO 2) and Ground (GND) routing |
| 6 | **Micro-USB Cable** | USB 2.0 Type-A to Micro-B (data + power) | 1 | 5V VBUS power rail and UART Serial Monitor |
| 7 | **Client Host** | PC / Laptop or Smartphone with browser | 1 | Human-Machine Interface (HMI) client |

---

## 5. Circuit & Wiring Diagram

### 5.1 Electrical Schematic
```
                      +-------------------+
                      |   ESP32 DevKit    |
                      |                   |
                      |            GPIO 2 +----[ 220 Ω Resistor ]----+---->|-----+
                      |                   |                               LED    |
                      |               GND +--------------------------------------+
                      |                   |                                 (Cathode)
                      +-------------------+
```

### 5.2 Current-Limiting Resistor Calculation
According to Ohm's Law and Kirchhoff's Voltage Law:
$$V_{\text{GPIO}} = V_F + (I_F \times R)$$
$$R = \frac{V_{\text{GPIO}} - V_F}{I_F}$$

Given:
- ESP32 Logic Output High Voltage ($V_{\text{GPIO}}$) = $3.3\,\text{V}$
- Red LED Forward Voltage ($V_F$) $\approx 2.0\,\text{V}$
- Target Forward Current ($I_F$) $\approx 6\,\text{mA}$ (well below the ESP32 GPIO 12 mA safe threshold)

$$R = \frac{3.3\,\text{V} - 2.0\,\text{V}}{0.006\,\text{A}} = \frac{1.3\,\text{V}}{0.006\,\text{A}} \approx 216.7\,\Omega \implies \mathbf{220\,\Omega\text{ (Standard E12 Value)}}$$

Calculated Forward Current:
$$I_F = \frac{3.3\,\text{V} - 2.0\,\text{V}}{220\,\Omega} = \mathbf{5.91\,\text{mA}}$$

---

## 6. ESP32 Pin Connections Table

| ESP32 Pin Header | Microcontroller GPIO | Connection Target | Direction | Signal Type | Electrical Purpose |
|:---|:---|:---|:---:|:---:|:---|
| **Pin D2** | `GPIO 2` | 220 Ω Resistor $\to$ LED Anode (+) | Output | Digital (3.3V / 0V) | Actuator driver pin. Also wired to onboard blue indicator LED on DevKit boards. |
| **GND** | `GND (Common Rail)` | LED Cathode (-) flat side | Return | 0V Reference | Common return path closing the power loop. |
| **Micro-USB** | `VBUS / GND / D+ / D-` | Host Computer USB Port | Power/Data | 5V DC + UART | Powers the onboard 3.3V Low-Dropout regulator and provides 115200 baud UART logging. |

---

## 7. Complete Arduino/ESP32 Source Code

The complete source code is stored at [`code/task1_esp32_webserver_led.ino`](code/task1_esp32_webserver_led.ino):

```cpp
/*
  =============================================================================
  Project     : ESP32 Web Server & HTML LED Control (IoT Task 1)
  Author      : Vasugi D (B.E. Mechatronics Engineering, KCT)
  Description : Standalone HTTP Web Server running on ESP32 to remotely control
                an LED actuator over a local Wi-Fi intranet.
  Hardware    : ESP32 DevKit V1, 5mm LED, 220 Ohm Resistor, Breadboard
  Pin Wiring  : GPIO 2 -> 220 Ohm Resistor -> LED Anode (+) | LED Cathode (-) -> GND
  =============================================================================
*/

#include <WiFi.h>

// ---------- Wi-Fi Credentials ----------
const char* ssid     = "YOUR_WIFI_SSID";     // Replace with local Wi-Fi SSID
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with local Wi-Fi Password

// ---------- Web Server Configuration ----------
WiFiServer server(80); // Bind server to standard HTTP port 80

// ---------- Hardware Pin Definitions ----------
const int ledPin = 2;  // GPIO 2 (Connected to external LED + Onboard Blue LED)

// State Variables
String ledState = "OFF";
String header;

// Non-blocking timeout parameters
unsigned long currentTime = millis();
unsigned long previousTime = 0;
const long timeoutTime = 2000; // 2000 ms client inactivity limit

void setup() {
  Serial.begin(115200);
  delay(100);

  // Initialize GPIO 2 as digital output and set default to LOW (OFF)
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Initiate Wi-Fi Connection in Station (STA) Mode
  Serial.println();
  Serial.print("[Wi-Fi] Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Print DHCP IP Address
  Serial.println("");
  Serial.println("[Wi-Fi] Connected successfully!");
  Serial.print("[Wi-Fi] Server URL: http://");
  Serial.println(WiFi.localIP());

  // Start HTTP Daemon
  server.begin();
  Serial.println("[Server] HTTP Server listening on port 80.");
}

void loop() {
  // Listen for incoming TCP client requests
  WiFiClient client = server.available();

  if (client) {
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("[Client] Inbound connection accepted.");
    String currentLine = "";

    while (client.connected() && currentTime - previousTime <= timeoutTime) {
      currentTime = millis();
      if (client.available()) {
        char c = client.read();
        Serial.write(c);
        header += c;

        if (c == '\n') {
          // If the line is empty, two newline chars indicate the end of HTTP request
          if (currentLine.length() == 0) {
            // Send standard HTTP response status code
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println("Connection: close");
            client.println();

            // Command parsing logic
            if (header.indexOf("GET /H") >= 0) {
              Serial.println("[Command] Turning LED ON (GPIO 2 -> HIGH)");
              ledState = "ON";
              digitalWrite(ledPin, HIGH);
            } else if (header.indexOf("GET /L") >= 0) {
              Serial.println("[Command] Turning LED OFF (GPIO 2 -> LOW)");
              ledState = "OFF";
              digitalWrite(ledPin, LOW);
            }

            // Stream responsive HTML UI payload
            client.println("<!DOCTYPE html><html>");
            client.println("<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
            client.println("<link rel=\"icon\" href=\"data:,\">");
            client.println("<style>");
            client.println("html { font-family: sans-serif; text-align: center; background: #070e17; color: #e8eef4; }");
            client.println("body { margin: 0; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; }");
            client.println(".card { background: #0e1b29; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2.2rem; max-width: 420px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }");
            client.println("h1 { font-size: 1.8rem; margin: 0 0 0.5rem; color: #4a9ee8; }");
            client.println(".status-box { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 1rem; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.06); }");
            client.println(".status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }");
            client.println(".state-on { color: #3dcc8e; font-weight: bold; font-size: 1.3rem; }");
            client.println(".state-off { color: #e85a5a; font-weight: bold; font-size: 1.3rem; }");
            client.println(".btn { display: inline-block; width: 100%; box-sizing: border-box; text-decoration: none; padding: 16px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; margin-bottom: 12px; }");
            client.println(".btn-on { background: #3dcc8e; color: #04121a; }");
            client.println(".btn-off { background: #e85a5a; color: #fff; }");
            client.println("</style></head>");
            
            client.println("<body>");
            client.println("<div class=\"card\">");
            client.println("<h1>ESP32 LED Controller</h1>");
            client.println("<p style=\"color:#93a5b5; margin-bottom:1.5rem;\">Vasugi D &middot; IoT Task 1</p>");
            
            client.println("<div class=\"status-box\">");
            client.print("<p style=\"margin:0 0 6px; font-size: 0.85rem; color: #93a5b5;\">CURRENT LED STATE</p>");
            if (ledState == "ON") {
              client.println("<span class=\"status-indicator\" style=\"background:#3dcc8e; box-shadow:0 0 10px #3dcc8e;\"></span>");
              client.println("<span class=\"state-on\">ON</span>");
            } else {
              client.println("<span class=\"status-indicator\" style=\"background:#e85a5a;\"></span>");
              client.println("<span class=\"state-off\">OFF</span>");
            }
            client.println("</div>");

            client.println("<a href=\"/H\" class=\"btn btn-on\">TURN ON LED</a>");
            client.println("<a href=\"/L\" class=\"btn btn-off\">TURN OFF LED</a>");
            client.println("</div></body></html>");

            client.println();
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }

    header = "";
    client.stop();
    Serial.println("[Client] Connection terminated cleanly.\n");
  }
}
```

---

## 8. HTML Interface Developed for Controlling the LED

The embedded HTML document features:
- **Mobile-First Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1">` ensures dynamic scaling on smartphone browsers.
- **Embedded Inline CSS:** Zero external CSS/font HTTP requests are made, preventing connection stalls on air-gapped intranets.
- **Dynamic State Pill:** Renders an emerald green glowing dot when `ledState == "ON"`, and a red dot when `ledState == "OFF"`.
- **Large Tactile Touch Buttons:** Sized at 100% card width with 16px padding for effortless fingertip operation on touchscreen mobile devices.

---

## 9. How the Webpage Sends a Command to the ESP32

1. **User Interaction:** The operator clicks the hyperlink `<a href="/H" class="btn btn-on">TURN ON LED</a>`.
2. **HTTP Request Generation:** The browser builds and sends an HTTP `GET` request packet:
   ```http
   GET /H HTTP/1.1
   Host: 192.168.1.105
   ```
3. **Firmware Ingestion:** The ESP32's `client.read()` appends incoming bytes to `header`.
4. **Sub-string Evaluation:**
   ```cpp
   if (header.indexOf("GET /H") >= 0) {
     digitalWrite(ledPin, HIGH);
     ledState = "ON";
   }
   ```
5. **Actuator Execution:** The ESP32 register sets the GPIO 2 output latch HIGH, driving 3.3V into the resistor-LED network.
6. **HTTP Response:** The ESP32 outputs the HTTP header `HTTP/1.1 200 OK` followed by the rebuilt HTML webpage with the indicator now displaying **ON**.

---

## 10. Photographs of the Physical Setup

Photographs captured from the physical laboratory validation:
- [`images/setup_overview.jpg`](images/setup_overview.jpg): ESP32 DevKit mounted on breadboard with USB serial umbilical and DuPont jumper wires.
- [`images/led_state_active.jpg`](images/led_state_active.jpg): Physical LED forward-biased (illuminated) upon receiving `GET /H`.
- [`images/led_state_idle.jpg`](images/led_state_idle.jpg): Physical LED in unpowered state upon receiving `GET /L`.
- [`images/crop_hardware.jpg`](images/crop_hardware.jpg): Close-up detail of GPIO 2 pin header, 220 Ω resistor, and diode alignment.

---

## 11. Screenshots of the Web Interface

- [`images/web_interface.jpg`](images/web_interface.jpg): Browser client displaying the active control portal with live status pill and tactile button controls.
- [`images/web_interface_crop.jpg`](images/web_interface_crop.jpg): Close-up of the responsive status card and dynamic state feedback.

---

## 12. Video Demonstrating LED ON/OFF Control

The video recording demonstrating physical control from the web page is preserved at:
- **Video File:** [`video/task1_video.mp4`](video/task1_video.mp4)
- **Format:** H.264 / MP4 Video (19.45 seconds)
- **Description:** Real-time demonstration showing the web interface on laptop and phone, clicking "TURN ON" to illuminate the LED, and clicking "TURN OFF" to deactivate it with zero perceptible latency.

---

## 13. Problems Encountered and How They Were Solved

### 13.1 DHCP Dynamic IP Drift
- **Problem:** When power-cycling the ESP32 or reconnecting to the router, the DHCP server allocated varying IP addresses (e.g., `192.168.1.105` shifting to `192.168.1.114`), breaking browser bookmarks.
- **Solution:** Integrated Serial Monitor reporting at 115200 baud to instantly log `WiFi.localIP()` upon connection, and prepared `WiFi.config()` static IP parameters for industrial deployments.

### 13.2 Browser Favicon & Pre-fetch Request Corruption
- **Problem:** Modern browsers (Chrome/Safari) automatically fire asynchronous background requests for `/favicon.ico` or pre-fetch link targets. This resulted in false command parsing or duplicate executions.
- **Solution:** Added `<link rel="icon" href="data:,">` to the HTML `<head>` to immediately notify the browser that no favicon exists, suppressing unneeded HTTP queries.

### 13.3 TCP Socket Hang on Client Inactivity
- **Problem:** If a mobile browser went to sleep or was closed abruptly without terminating the socket connection, the ESP32 remained stuck inside `while (client.connected())`, blocking future incoming client requests.
- **Solution:** Implemented a non-blocking timeout counter using `millis()` with a 2000 ms limit (`timeoutTime = 2000;`). If no data is received within this window, `client.stop()` is forcefully executed to free the socket.

### 13.4 GPIO Bootloader Strapping Pin Conflicts
- **Problem:** Initially attempting to use certain pins (such as GPIO 0, 12, or 15) caused the ESP32 to fail flashing or enter perpetual boot loops due to internal strapping pin requirements during power-on reset.
- **Solution:** Selected standard general-purpose **GPIO 2**, which has safe default pull-down behavior and does not interfere with the SPI boot sequence.

---

## 14. Reflection on What I Learned

1. **Foundations of IoT Networking:**
   Developing an embedded web server without high-level abstraction frameworks (like Express or Django) offered invaluable insight into the raw mechanics of the HTTP application layer, TCP socket buffering, and request line parsing.
2. **Resource-Constrained Embedded Design:**
   Unlike desktop programming with abundant gigabytes of RAM, embedded web development demands rigorous memory management, keeping HTML/CSS footprints under 2 KB and enforcing non-blocking socket timeouts to prevent microcontroller watchdog resets.
3. **Mechatronic Cyber-Physical Integration:**
   As a Mechatronics Engineering student, this experiment is the foundational cornerstone for wireless teleoperation. The same software architecture that toggles an LED can be scaled to trigger motor driver H-bridges, pneumatic solenoid valves, and industrial relays over local SCADA networks.

---

## 15. Repository & Code Availability

All project source code, diagrams, documentation reports, and video assets are packaged and archived in:
- Directory: `C:\Users\vasug\Documents\IoT_Task1_ESP32_WebServer`
- Archive: `IoT_Task1_ESP32_WebServer.zip`
- Source Code: `code/task1_esp32_webserver_led.ino`
- Video Demonstration: `video/task1_video.mp4`
- Portfolio Page: `iot.html`

