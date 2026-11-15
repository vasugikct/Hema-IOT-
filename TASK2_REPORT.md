# Task 2: Adafruit IO Cloud MQTT & ESP32 Relay AC Lamp Control
**Course / Laboratory:** Internet of Things (IoT) & Embedded Automation  
**Author:** Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)  
**Status:** Completed, Physically Validated & Documented  
**Hardware Platform:** ESP32 DevKit V1 (Tensilica Xtensa Dual-Core 32-bit LX6) + 1-Channel 5V Optocoupled Relay + 230V AC Lamp  
**Cloud IoT Platform:** Adafruit IO (MQTT Broker `io.adafruit.com`)  

---

## Deliverables Verification Matrix

| # | Required Item | Verification Status | Location / Artifact |
|:---|:---|:---:|:---|
| 1 | **Objective of the assignment and problem addressed** | ☑ Completed | Section 1 |
| 2 | **Basic concept of ESP32 Cloud IoT & MQTT Broker** | ☑ Completed | Section 2 |
| 3 | **How the ESP32 and Cloud communicate over Wi-Fi** | ☑ Completed | Section 3 |
| 4 | **Hardware components used** | ☑ Completed | Section 4 |
| 5 | **Circuit/wiring diagram** | ☑ Completed | Section 5 & SVG Diagram |
| 6 | **ESP32 pin connections** | ☑ Completed | Section 6 |
| 7 | **Complete Arduino/ESP32 source code** | ☑ Completed | Section 7 & `iot_assets/task2_esp32_adafruitio_relay.ino` |
| 8 | **Dashboard/HTML interface developed for controlling the AC lamp** | ☑ Completed | Section 8 & `iot_assets/task2_dashboard_adafruit.jpg` |
| 9 | **How the webpage sends a command to the ESP32** | ☑ Completed | Section 9 |
| 10 | **Photographs of the physical setup** | ☑ Completed | Section 10 & `iot_assets/task2_setup_lab1.jpg`, `task2_setup_lab2.jpg` |
| 11 | **Screenshots of the web interface** | ☑ Completed | Section 11 & `iot_assets/task2_dashboard_adafruit.jpg` |
| 12 | **Video demonstrating AC lamp ON/OFF control** | ☑ Completed | Section 12 & `iot_assets/task2_video.mp4` |
| 13 | **Problems encountered and how they were solved** | ☑ Completed | Section 13 |
| 14 | **Brief reflection on what you learned** | ☑ Completed | Section 14 |
| 15 | **All required files/code available in repository** | ☑ Completed | Section 15 |

---

## 1. Objective of the Assignment & Problem Being Addressed

### Objective
To architect, construct, and validate an industrial-grade cloud IoT actuation node utilizing an **ESP32 microcontroller** connected to the **Adafruit IO Cloud** infrastructure over the **MQTT (Message Queuing Telemetry Transport)** protocol. The node safely toggles a high-voltage **230V AC incandescent/LED lamp** via an optically isolated single-channel 5V electromechanical relay board in response to user actuation from an interactive web dashboard.

### Problem Addressed
- **Intranet Confinement:** Standard local HTTP web servers running directly on microcontrollers are locked inside the local Wi-Fi router's subnet (`192.168.x.x`). Accessing them from cellular networks or remote locations necessitates risky port-forwarding, exposing home networks to malicious botnet attacks.
- **Protocol Overhead:** HTTP request-response handshakes introduce substantial header latency and continuous memory allocation overhead that strains microcontrollers.
- **Mains Electrical Hazards:** Interfacing low-voltage 3.3V/5V DC microcontrollers with lethally dangerous 230V AC alternating current requires galvanic isolation to prevent high-voltage transients from destroying digital logic or endangering operators.

---

## 2. Basic Concept of ESP32 Cloud IoT & MQTT Broker

Unlike HTTP, which follows a client-initiated synchronous polling model, **MQTT** follows a decoupled **Publish/Subscribe (Pub/Sub)** architecture:

1. **Centralized Cloud Broker (`io.adafruit.com`):** Manages message distribution between clients.
2. **Topics / Feeds:** Hierarchical message channels (e.g., `vasug/feeds/lamp-switch` for actuation, `vasug/feeds/lamp-status` for feedback).
3. **Subscribers:** The ESP32 maintains an open, lightweight TCP socket to the broker and subscribes to `lamp-switch`.
4. **Publishers:** The web dashboard publishes payload strings (`"ON"` or `"OFF"`) when the user clicks the switch.
5. **QoS (Quality of Service):** Ensures guaranteed message delivery without packet loss across intermittent Wi-Fi links.

---

## 3. How the ESP32 and Cloud Communicate over Wi-Fi

```
+-----------------------------------------------------------------------------------+
|                            COMMUNICATION ARCHITECTURE                             |
+-----------------------------------------------------------------------------------+

 [User Browser]                              [Adafruit IO Cloud]               [ESP32 Edge Node]
        |                                             |                                 |
        |--- (1) User clicks Toggle Switch ---------->|                                 |
        |    (WebSocket / REST POST)                  |                                 |
        |                                             |--- (2) MQTT PUBLISH ----------->|
        |                                             |    Topic: feeds/lamp-switch     |
        |                                             |    Payload: "ON"                |
        |                                             |                                 |
        |                                             |                          (3) Pulls GPIO 23 LOW
        |                                             |                          (4) Optocoupler fires
        |                                             |                          (5) Relay contacts close
        |                                             |                          (6) 230V AC Lamp turns ON
        |                                             |                                 |
        |                                             |<-- (7) MQTT PUBLISH ------------|
        |                                             |    Topic: feeds/lamp-status     |
        |                                             |    Payload: "BULB_ACTIVE"       |
        |<-- (8) Dashboard UI reflects feedback ------|                                 |
```

---

## 4. Hardware Components Used

| Component | Quantity | Specification / Details | Function |
|:---|:---:|:---|:---|
| **ESP32 DevKit V1** | 1 | Dual-Core 240MHz, 520KB SRAM, Wi-Fi 802.11 b/g/n | Edge gateway running MQTT client firmware |
| **5V Single-Channel Relay Module** | 1 | Songle SRD-05VDC-SL-C (10A 250V AC), PC817 Optocoupler | Galvanic isolation and electromechanical AC switching |
| **230V AC Light Bulb & Holder** | 1 | 15W / 40W domestic bulb, B22 / E27 socket | High-voltage physical electrical load |
| **AC Mains Power Cord** | 1 | 2-Core heavy insulated cable with 6A 230V plug | Mains electrical supply line |
| **DuPont Jumper Wires** | 3 | Male-to-Female leads | Power (+5V, GND) and signal (GPIO 23) connections |
| **Laptop Workstation** | 1 | Lenovo LOQ (Windows 11, Chrome, Arduino IDE) | Web dashboard interaction and USB serial telemetry |

---

## 5. Circuit / Wiring Diagram

```
       +--------------------+
       |   ESP32 DevKit V1  |
       |                    |
       |            GPIO 23 |-----[ Green Wire ]-----> IN   +------------------------+
       |                VIN |-----[ Orange Wire ]----> VCC  | 5V Relay Module (Opto) |
       |                GND |-----[ Brown Wire ]-----> GND  |                        |
       +--------------------+                               |   COM              NO  |
                                                            +----+----------------+--+
                                                                 |                |
                                                          [ Live Phase ]    [ Switched Live ]
                                                                 |                |
                                     +---------------------------+                v
                                     |                                     +--------------+
                              [ 230V AC Wall Plug ]                        | 230V AC Lamp |
                                     |                                     +--------------+
                                     +-------------------[ Neutral ]------------->|
```

---

## 6. ESP32 Pin Connections Table

| ESP32 Pin | Connected Component & Pin | Signal Level | Role & Logic State |
|:---|:---|:---:|:---|
| **GPIO 23** | Relay Module `IN` Pin | 3.3V CMOS | Active-LOW control trigger (`LOW` = Relay ON, `HIGH` = Relay OFF) |
| **VIN** | Relay Module `VCC` Pin | +5.0V DC | Powers the electromagnetic coil and optocoupler anode |
| **GND** | Relay Module `GND` Pin | 0V DC | Common ground return path |
| *Isolated* | Relay `COM` Terminal | 230V AC | Connected to incoming Live (Phase) wire from mains supply |
| *Isolated* | Relay `NO` Terminal | 230V AC | Connected to primary terminal of AC lamp holder |
| *Isolated* | Lamp Neutral Terminal | 230V AC | Return line connected directly to mains Neutral |

---

## 7. Complete Arduino/ESP32 Source Code

```cpp
/*
  =============================================================================
  Project     : ESP32 & Adafruit IO Cloud MQTT Relay AC Lamp Control (IoT Task 2)
  Author      : Vasugi D (B.E. Mechatronics Engineering, KCT)
  Description : Cloud IoT actuation node using ESP32 and Adafruit IO MQTT.
  =============================================================================
*/

#include <WiFi.h>
#include "Adafruit_MQTT.h"
#include "Adafruit_MQTT_Client.h"

#define WLAN_SSID       "YOUR_WIFI_SSID"
#define WLAN_PASS       "YOUR_WIFI_PASSWORD"

#define AIO_SERVER      "io.adafruit.com"
#define AIO_SERVERPORT  1883
#define AIO_USERNAME    "YOUR_AIO_USERNAME"
#define AIO_KEY         "YOUR_AIO_KEY"

const int RELAY_PIN    = 23;
const int STATUS_LED   = 2;

#define RELAY_ON   LOW
#define RELAY_OFF  HIGH

WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, AIO_SERVER, AIO_SERVERPORT, AIO_USERNAME, AIO_KEY);

Adafruit_MQTT_Subscribe lampFeed = Adafruit_MQTT_Subscribe(&mqtt, AIO_USERNAME "/feeds/lamp-switch");
Adafruit_MQTT_Publish statusFeed = Adafruit_MQTT_Publish(&mqtt, AIO_USERNAME "/feeds/lamp-status");

void MQTT_connect();

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);

  digitalWrite(RELAY_PIN, RELAY_OFF);
  digitalWrite(STATUS_LED, LOW);

  Serial.print(F("Connecting to Wi-Fi... "));
  WiFi.begin(WLAN_SSID, WLAN_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println(F("\nWi-Fi Connected! IP: ") + WiFi.localIP().toString());

  mqtt.subscribe(&lampFeed);
}

void loop() {
  MQTT_connect();

  Adafruit_MQTT_Subscribe *subscription;
  while ((subscription = mqtt.readSubscription(1000))) {
    if (subscription == &lampFeed) {
      char *command = (char *)lampFeed.lastread;
      Serial.print(F("Received Command: "));
      Serial.println(command);

      if (strcmp(command, "ON") == 0 || strcmp(command, "1") == 0) {
        digitalWrite(RELAY_PIN, RELAY_ON);
        digitalWrite(STATUS_LED, HIGH);
        statusFeed.publish("BULB_ACTIVE");
      } else if (strcmp(command, "OFF") == 0 || strcmp(command, "0") == 0) {
        digitalWrite(RELAY_PIN, RELAY_OFF);
        digitalWrite(STATUS_LED, LOW);
        statusFeed.publish("BULB_INACTIVE");
      }
    }
  }

  if (!mqtt.ping()) {
    mqtt.disconnect();
  }
}

void MQTT_connect() {
  int8_t ret;
  if (mqtt.connected()) return;

  Serial.print(F("Connecting to MQTT... "));
  uint8_t retries = 5;
  while ((ret = mqtt.connect()) != 0) {
    Serial.println(mqtt.connectErrorString(ret));
    mqtt.disconnect();
    delay(5000);
    retries--;
    if (retries == 0) return;
  }
  Serial.println(F("MQTT Connected!"));
}
```

---

## 8. Dashboard Interface Developed for Controlling the AC Lamp

The Adafruit IO Cloud dashboard is configured with:
1. **Toggle Switch Widget:** Mapped to feed `lamp-switch`. Displays a prominent red **"ON"** toggle switch state indicator when actuated.
2. **Text Block Widget:** Embedded inspirational text: *"I see little of more importance to the future of our country & our civilization than full recognition of the place of the artist" — John F. Kennedy*.
3. **Feed History Logging:** Every switch event is stored in the cloud timeseries database.

---

## 9. How the Webpage Sends Commands to the ESP32

1. Operator clicks Toggle Switch on Adafruit IO web UI.
2. Web UI triggers an HTTPS/WebSocket message to `io.adafruit.com`.
3. Adafruit IO MQTT broker publishes an MQTT packet to topic `lamp-switch`.
4. ESP32 receives payload via established TCP socket in `mqtt.readSubscription()`.
5. Firmware parses command and drives GPIO 23 LOW to energize the relay.
6. Relay armature pulls in, closing contacts between COM and NO to illuminate the 230V AC lamp.

---

## 10. Photographs of Physical Setup

- **Lab Setup Overview:** `iot_assets/task2_setup_lab1.jpg` (Vasugi D & partner operating the Adafruit IO dashboard, relay, and illuminated 230V AC lamp).
- **Secondary Angle:** `iot_assets/task2_setup_lab2.jpg` (Bench overview with laptop UI, DuPont wiring, and lamp holder).
- **Hardware Actuator Detail:** `iot_assets/task2_hardware_relay_lamp.jpg` (Close-up of optoisolated relay module and mains connections).

---

## 11. Screenshots of the Web Interface

- **Adafruit IO Dashboard:** `iot_assets/task2_dashboard_adafruit.jpg` (Showing ON toggle state and JFK quote).
- **Video Capture Frames:** `iot_assets/task2_video_frame_early.jpg` and `iot_assets/task2_video_frame_late.jpg`.

---

## 12. Video Demonstrating AC Appliance Control

- **Raw Recorded Video:** `iot_assets/task2_video.mp4`
- **Re-encoded H.264 Video:** `iot_assets/task2_video_h264.mp4`
- **Instant Animated Preview:** `iot_assets/task2_demo_animated.webp`

---

## 13. Problems Encountered & How They Were Solved

1. **Active-LOW Logic Inversion:** The relay triggered when GPIO was LOW. Solved by defining `#define RELAY_ON LOW` and `#define RELAY_OFF HIGH`.
2. **MQTT Socket Timeout Drops:** Idle connections were dropped by the broker. Solved by introducing `mqtt.ping()` and a non-blocking `MQTT_connect()` watchdog.
3. **AC Inductive Transients:** Switching 230V mains induced electromagnetic interference. Solved by using an optoisolated relay with flyback diode protection.
4. **Bootloader Pin Strapping Conflicts:** GPIO 0/12 prevented flashing. Solved by assigning relay actuation strictly to non-strapping **GPIO 23**.

---

## 14. Reflection on What I Learned

- Gained deep hands-on mastery over the **MQTT Pub/Sub protocol** and cloud IoT platforms.
- Acquired vital electrical safety practices for controlling lethal **230V AC mains loads** through galvanic optoelectronic isolation.
- Integrated cloud dashboards, broker queues, embedded firmware, and physical actuators into a unified cyber-physical system.

---

## 15. Repository & Code Availability

- **Arduino Firmware Sketch:** `iot_assets/task2_esp32_adafruitio_relay.ino`
- **Demonstration Video:** `iot_assets/task2_video.mp4`
- **Live Interactive Portfolio:** `iot-task2.html`
