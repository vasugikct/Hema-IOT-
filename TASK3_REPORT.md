# Task 3: Google Assistant & IFTTT Voice IoT Relay Control
**Course / Laboratory:** Internet of Things (IoT) & Embedded Automation  
**Author:** Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)  
**Status:** Completed, Verified & Documented  
**Hardware Platform:** ESP32 DevKit V1 + 1-Channel 5V Optocoupled Relay + 230V AC Lamp  
**Cloud Stack:** Google Assistant Scenes + IFTTT Webhook Engine + Adafruit IO MQTT Broker (`io.adafruit.com`)  

---

## Deliverables Verification Matrix

| # | Required Item | Verification Status | Location / Artifact |
|:---|:---|:---:|:---|
| 1 | **Objective of the assignment and problem addressed** | ☑ Completed | Section 1 |
| 2 | **Basic concept of Voice UI & IFTTT Webhook Architecture** | ☑ Completed | Section 2 |
| 3 | **How Google Assistant, IFTTT, and ESP32 communicate** | ☑ Completed | Section 3 |
| 4 | **Hardware components used** | ☑ Completed | Section 4 |
| 5 | **Circuit/wiring diagram** | ☑ Completed | Section 5 & SVG Diagram |
| 6 | **ESP32 pin connections table** | ☑ Completed | Section 6 |
| 7 | **Complete Arduino/ESP32 source code** | ☑ Completed | Section 7 & `iot_assets/task3_esp32_google_assistant_relay.ino` |
| 8 | **Voice Trigger & IFTTT Applet UI Interface** | ☑ Completed | Section 8 & `iot_assets/task3_voice_trigger_on.jpg` |
| 9 | **How the voice command is dispatched to the ESP32** | ☑ Completed | Section 9 |
| 10 | **Google Assistant Scene Configuration Screenshots** | ☑ Completed | Section 10 & `iot_assets/task3_voice_trigger_on.jpg`, `task3_voice_trigger_off.jpg` |
| 11 | **IFTTT Rule Engine & Webhook Action Screenshots** | ☑ Completed | Section 11 & `iot_assets/task3_ifttt_applet_engine.jpg`, `task3_ifttt_pipeline_adafruit.jpg` |
| 12 | **End-to-End Visual Pipeline Verification** | ☑ Completed | Section 12 & Multi-Stage Configuration Walkthrough |
| 13 | **Problems encountered and how they were solved** | ☑ Completed | Section 13 |
| 14 | **Brief reflection on what you learned** | ☑ Completed | Section 14 |
| 15 | **Repository firmware available for download** | ☑ Completed | Section 15 & `iot_assets/task3_esp32_google_assistant_relay.ino` |

---

## 1. Objective of the Assignment & Problem Addressed

### Objective
To engineer and validate an end-to-end voice-activated IoT home automation system enabling hands-free, natural-language control of physical domestic electrical appliances. The architecture connects **Google Assistant Voice Scenes** to an **IFTTT (If This Then That) webhook rule engine**, which pushes state updates to an **Adafruit IO MQTT broker**. An edge **ESP32 microcontroller** listens for these events and actuates a 230V AC lamp via a 5V optoisolated relay module.

### Problem Addressed
- **Physical Touch Friction:** Web and mobile dashboards require screen interaction (unlocking, navigating, tapping), which creates accessibility barriers for elderly, visually impaired, or busy users.
- **Walled-Garden API Barriers:** Directly linking consumer voice assistants (Google Assistant) to custom embedded hardware (ESP32) is complex due to closed ecosystem APIs and strict OAuth2 authentication tokens.
- **Middleware Solution:** Utilizing IFTTT applets and Adafruit IO MQTT establishes a seamless, low-latency, zero-server bridge from spoken human words to physical electrical contacts.

---

## 2. Basic Concept of Voice UI & IFTTT Webhook Cloud Architecture

The voice automation pipeline spans four modular tiers:
1. **Google Assistant Natural Language Processing:** Translates acoustic speech utterances into structured scene trigger invocations (`"lights on"`, `"lights off"`).
2. **IFTTT Applet Engine:** Acts as an event-driven webhook bridge linking voice scenes to outbound HTTPS REST calls.
3. **Adafruit IO MQTT Broker:** Translates incoming webhooks into lightweight MQTT messages published across topic `lamp-switch`.
4. **ESP32 Edge Microcontroller:** Maintains a persistent TCP socket over Wi-Fi, parses the command, and drives the optocoupled relay to switch the 230V AC lamp.

---

## 3. Communication Architecture & Protocol Timeline

```
+-------------------------------------------------------------------------------------------------+
|                                 MULTI-CLOUD PROTOCOL TIMELINE                                   |
+-------------------------------------------------------------------------------------------------+

 [User Voice]    [Google Assistant]             [IFTTT Cloud]          [Adafruit IO]      [ESP32 Node]
      |                  |                            |                      |                 |
      |-- (1) "Ok Google,|                            |                      |                 |
      |   activate lights on"                         |                      |                 |
      |                  |-- (2) Scene Match -------->|                      |                 |
      |                  |   Webhook Trigger          |                      |                 |
      |                  |                            |-- (3) HTTPS POST --->|                 |
      |                  |                            |   Payload: "ON"      |                 |
      |                  |                            |                      |-- (4) MQTT ----->|
      |                  |                            |                      |   PUBLISH "ON"  |
      |                  |                            |                      |                 |
      |                  |                            |                      |          (5) GPIO 23 LOW
      |                  |                            |                      |          (6) Relay closes
      |                  |                            |                      |          (7) Lamp turns ON
      |                  |                            |                      |                 |
      |                  |                            |                      |<-- (8) STATUS --|
      |                  |                            |                      |   "TRIGGERED_ON"|
```

---

## 4. Hardware Components Used

| Component | Specification | Role |
|:---|:---|:---|
| **ESP32 DevKit V1** | Dual-Core 240MHz, 520KB SRAM, Wi-Fi | Edge IoT gateway running MQTT client firmware |
| **5V 1-Channel Relay Module** | Songle SRD-05VDC-SL-C, PC817 Optocoupler | Optically isolated switching of 230V AC load |
| **230V AC Lamp & Holder** | Domestic incandescent/LED bulb, B22/E27 | Target physical electrical load |
| **AC Mains Power Cord** | Heavy-duty insulated 2-core cable, 6A plug | Supplies 230V AC alternating current from wall |
| **Android Smartphone** | Google Assistant enabled device | Captures spoken voice commands |
| **DuPont Jumper Wires** | Male-to-Female leads | Signal and power interconnects |
| **Workstation PC** | Lenovo LOQ (Windows 11, Chrome, Arduino IDE) | Serial logging and cloud pipeline configuration |

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
  Project     : Voice-Controlled IoT Home Automation via Google Assistant,
                IFTTT Webhooks & Adafruit IO MQTT (IoT Task 3)
  Author      : Vasugi D (B.E. Mechatronics Engineering, KCT)
  Description : Cloud IoT voice actuation node using ESP32, IFTTT and Adafruit IO.
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

bool lampState = false;

WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, AIO_SERVER, AIO_SERVERPORT, AIO_USERNAME, AIO_KEY);

Adafruit_MQTT_Subscribe voiceFeed = Adafruit_MQTT_Subscribe(&mqtt, AIO_USERNAME "/feeds/lamp-switch");
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

  mqtt.subscribe(&voiceFeed);
}

void loop() {
  MQTT_connect();

  Adafruit_MQTT_Subscribe *subscription;
  while ((subscription = mqtt.readSubscription(1000))) {
    if (subscription == &voiceFeed) {
      char *payload = (char *)voiceFeed.lastread;
      Serial.print(F("Voice Payload: "));
      Serial.println(payload);

      if (strcmp(payload, "ON") == 0 || strcmp(payload, "1") == 0 || strcasecmp(payload, "lights on") == 0) {
        digitalWrite(RELAY_PIN, RELAY_ON);
        digitalWrite(STATUS_LED, HIGH);
        lampState = true;
        statusFeed.publish("VOICE_TRIGGERED_ON");
      } 
      else if (strcmp(payload, "OFF") == 0 || strcmp(payload, "0") == 0 || strcasecmp(payload, "lights off") == 0) {
        digitalWrite(RELAY_PIN, RELAY_OFF);
        digitalWrite(STATUS_LED, LOW);
        lampState = false;
        statusFeed.publish("VOICE_TRIGGERED_OFF");
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

## 8. Voice Trigger & Cloud Rule Interface Breakdown

- **Voice Trigger (ON):** Google Assistant Scene configured for spoken phrase `"lights on"` (`task3_voice_trigger_on.jpg`).
- **IFTTT Applet Engine:** "If This" conditional event binder linking Google Assistant to webhook actions (`task3_ifttt_applet_engine.jpg`).
- **Voice Trigger (OFF):** Google Assistant Scene configured for spoken phrase `"lights off"` (`task3_voice_trigger_off.jpg`).
- **Then That (Adafruit IO):** Action sending data payload to feed `lamp-switch` (`task3_ifttt_pipeline_adafruit.jpg`).

---

## 9. Speech-to-Actuator Dispatch Mechanism

1. Operator utters: *"Ok Google, activate lights on"*.
2. Google Assistant NLP identifies the Scene and triggers the connected IFTTT webhook.
3. IFTTT issues an HTTPS REST POST request to Adafruit IO.
4. Adafruit IO MQTT broker broadcasts a `PUBLISH` message to topic `lamp-switch`.
5. ESP32 parses the payload, pulls GPIO 23 LOW, and the relay switches the 230V AC lamp in approximately 1.2 seconds.

---

## 10 & 11. Interface Verification: Voice Trigger & Cloud Rule Screenshots

- `iot_assets/task3_voice_trigger_on.jpg`: Google Assistant Scene configured for `"lights on"`
- `iot_assets/task3_ifttt_applet_engine.jpg`: IFTTT Applet Rule Engine configuration
- `iot_assets/task3_voice_trigger_off.jpg`: Google Assistant Scene configured for `"lights off"`
- `iot_assets/task3_ifttt_pipeline_adafruit.jpg`: IFTTT-to-Adafruit IO feed transmission action

---

## 12. End-to-End Pipeline Verification

The 4-stage pipeline is verified by the direct interface configurations:
1. **Scene Recognition:** Google Assistant registers `"lights on"` / `"lights off"`.
2. **Event Binding:** IFTTT captures the voice trigger.
3. **Payload Dispatch:** IFTTT pushes `"ON"` / `"OFF"` to Adafruit IO.
4. **Relay Actuation:** ESP32 switches the 230V AC domestic lamp.

---

## 13. Problems Encountered & Solutions

1. **Google Assistant Utterance Ambiguity:** Phrases like "turn on lights" collided with default smart home routing. Solved by using Google Assistant **Scene Triggers** via `"activate [Scene Name]"`.
2. **Multi-Cloud Latency Jitter:** Latency between Google, IFTTT, and Adafruit IO caused 2–3s delays. Solved by enabling direct feed targeting and persistent MQTT sockets.
3. **Payload String Discrepancies:** Different actions sent `"ON"` vs `"lights on"`. Solved by implementing multi-string matching with `strcasecmp()` in firmware.
4. **Socket Drops on Inactivity:** Broker dropped idle connections after 5 minutes. Solved by adding an automated `mqtt.ping()` heartbeat and `MQTT_connect()` auto-reconnect watchdog.

---

## 14. Reflection on What I Learned

- Gained end-to-end expertise in designing **Voice User Interfaces (VUI)** for cyber-physical IoT automation.
- Mastered chaining multi-cloud architectures (Google Assistant → IFTTT → Adafruit IO → ESP32).
- Realized the importance of hands-free voice accessibility in modern smart assistive living environments.

---

## 15. Repository & Code Availability

- **Arduino Firmware Sketch:** `iot_assets/task3_esp32_google_assistant_relay.ino`
- **Live Interactive Portfolio:** `iot-task3.html`
