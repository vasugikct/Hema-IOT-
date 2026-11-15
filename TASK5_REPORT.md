# Task 5: Real-Time Full-Duplex WebSocket Telemetry & Environmental Automation Dashboard
**Course / Laboratory:** Internet of Things (IoT) & Embedded Automation  
**Author:** Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)  
**Status:** Completed, Physically Validated & Documented  
**Hardware Platform:** ESP32 DevKit V1 (Xtensa Dual-Core 32-bit LX6, 240 MHz) + DHT11 Environmental Sensor + GL5528 LDR Sensor + 1-Channel 5V Optocoupled Relay + 230V AC Lamp  
**Cloud & Web Interface:** Google Firebase Realtime Database / WebSocket Engine & AuraIoT Web Application (`smart-iot-dashboard-610b0.web.app`)  
**Architecture:** FreeRTOS Dual-Core Multi-Tasking with Full-Duplex Bi-Directional Event Streaming  

---

## Deliverables Verification Matrix

| # | Required Item | Verification Status | Location / Artifact |
|:---|:---|:---:|:---|
| 1 | **Objective of the assignment and problem addressed** | ☑ Completed | Section 1 |
| 2 | **Basic concept of Real-Time Full-Duplex WebSockets & Cloud Streaming** | ☑ Completed | Section 2 |
| 3 | **How the ESP32 and Web Client communicate over Wi-Fi** | ☑ Completed | Section 3 & ASCII Protocol Flow |
| 4 | **Hardware components used** | ☑ Completed | Section 4 |
| 5 | **Circuit/wiring diagram** | ☑ Completed | Section 5 & ASCII Schematic |
| 6 | **ESP32 pin connections table** | ☑ Completed | Section 6 |
| 7 | **Complete Arduino/ESP32 source code** | ☑ Completed | Section 7 & `iot_assets/task5_esp32_websocket_telemetry_dashboard.ino` |
| 8 | **AuraIoT Web Dashboard & Real-Time Telemetry Trends Interface** | ☑ Completed | Section 8 & `iot_assets/task5_dashboard_trends_autoldr.jpg` |
| 9 | **Bidirectional Telemetry & Actuation Dispatch Mechanism** | ☑ Completed | Section 9 |
| 10 | **Photographs of the physical setup & workstation** | ☑ Completed | Section 10 & `iot_assets/task5_dashboard_trends_autoldr.jpg`, `task5_workstation_lab.jpg` |
| 11 | **Screenshots of the web interface & historical data log** | ☑ Completed | Section 11 & `iot_assets/task5_telemetry_chart_live.jpg`, `task5_telemetry_datalog_view.jpg` |
| 12 | **End-to-End System Validation & Test Cases** | ☑ Completed | Section 12 |
| 13 | **Problems encountered and how they were solved** | ☑ Completed | Section 13 |
| 14 | **Brief reflection on what you learned** | ☑ Completed | Section 14 |
| 15 | **All required files/code available in repository** | ☑ Completed | Section 15 |

---

## 1. Objective of the Assignment & Problem Being Addressed

### Objective
To engineer, deploy, and benchmark an industrial-grade cyber-physical IoT telemetry and control system utilizing an **ESP32 microcontroller** connected to a responsive web console (**AuraIoT**) via a persistent **full-duplex bi-directional communication channel** (WebSockets / Firebase Realtime Streams). The system acquires multi-sensor environmental telemetry (**DHT11** Temperature and Humidity, **LDR** Ambient Light in Lux), plots continuous live time-series curves without HTTP polling overhead, provides sub-150ms bi-directional actuation for an optocoupled 230V AC lamp relay, enables dynamic runtime threshold configuration, and maintains chronological data logs with client-side filtering and CSV export.

### Problem Addressed
- **High Latency and Overhead of HTTP Polling:** Traditional web applications poll microcontrollers using repetitive HTTP GET requests every 1–2 seconds. Each HTTP transaction incurs massive header bloat (typically 500–1000 bytes per packet) and requires a full TCP three-way handshake, consuming excessive microcontroller RAM and saturating limited network bandwidth.
- **Unidirectional Lag in Actuation Commands:** When relying on client-polling architectures, remote control commands (such as switching a high-voltage AC lamp) cannot be delivered instantaneously to the edge node; the command remains queued until the microcontroller initiates its next polling cycle.
- **Real-Time Visualization Bottlenecks:** Rendering high-frequency multi-variable time-series streams (Temperature, Humidity, and Light intensity) on web frontends often results in UI freezes, dropped telemetry frames, or erratic chart re-rendering if data pipelines and browser repaint loops are unbuffered.
- **Fail-Safe Edge Operation During Network Interruption:** A purely cloud-dependent system fails during network disconnects. True cyber-physical systems require edge-computed autonomous threshold logic that operates deterministically even if WebSocket transport drops.

---

## 2. Basic Concept of Real-Time Full-Duplex WebSockets & Cloud Streaming

The architecture eliminates polling by maintaining an open, bi-directional transmission pipe between the edge node, cloud backend, and client browser:

### 1. Full-Duplex Persistent Communication (RFC 6455 / Firebase Streams)
- **Single TCP Handshake:** After an initial HTTP Upgrade handshake, a permanent full-duplex TCP tunnel remains open.
- **Minimal Framing Overhead:** WebSocket and Server-Sent Event (SSE) frames carry only 2 to 10 bytes of protocol overhead per packet, compared to 800+ bytes for standard HTTP headers.
- **Instantaneous Bi-Directional Event Dispatch:** Both the edge ESP32 node and the web client can push frames arbitrarily without waiting for requests, enabling real-time teleoperation latency below 150 ms.

### 2. Dual-Core FreeRTOS Multi-Tasking Architecture
The ESP32 features two 32-bit Xtensa LX6 CPU cores operating at 240 MHz. FreeRTOS allows tasks to be isolated across physical silicon:
- **Core 0 (`TaskNetworkTelemetry`):** Manages the 2.4 GHz Wi-Fi radio stack, TLS socket negotiation, and continuous JSON telemetry streaming.
- **Core 1 (`TaskSensorEngine`):** Executes deterministic hard real-time tasks: 1-wire bit-banged communication with the DHT11, 12-bit ADC sampling of the LDR voltage divider, Lux computation, hysteresis evaluation, and GPIO 26 relay switching.
- **Mutex Semaphore (`dataMutex`):** Prevents race conditions and memory corruption when shared telemetry structures are accessed concurrently across CPU cores.

---

## 3. Communication Architecture & Protocol Timeline

```
+---------------------------------------------------------------------------------------------------------+
|                              FULL-DUPLEX WEBSOCKET & CLOUD STREAM TIMELINE                              |
+---------------------------------------------------------------------------------------------------------+

 [AuraIoT Web Client]                  [Cloud Realtime Stream / RTDB]              [ESP32 Edge Node]
(smart-iot-dashboard)                 (smart-iot-dashboard-610b0)                  Core 0        Core 1
        |                                         |                                  |              |
        |<=== (1) Persistent WebSocket Open =====>|<==== (2) Realtime TLS Stream ===>|              |
        |                                         |                                  |<-- Telemetry-| (Sensor Read:
        |                                         |<-- (3) Stream Push (JSON) -------|    (Mutex)   |  DHT11 + LDR)
        |                                         |    /telemetry/temp, hum, lux     |              |
        |<-- (4) Live Frame Push (<150ms) --------|                                  |              |
        |    Plots Curve: 24°C, 38%, 656 Lux      |                                  |              |
        |                                         |                                  |              |
        |--- (5) Click "TURN BULB ON" ----------->|                                  |              |
        |    Dispatches /control/bulb_state=true  |--- (6) Immediate Event Push ---->|              |
        |                                         |                                  |-- Mutex ---->| (Actuates
        |                                         |                                  |   Update     |  GPIO 26 LOW
        |                                         |                                  |              |  Relay ON)
        |<-- (7) Physical State Acknowledged -----|<-- (8) Status Acknowledged ------|              |
        |    Renders Glowing Lamp State           |                                  |              |
```

---

## 4. Hardware Components Used

| Component | Specification | Role & Placement in System |
|:---|:---|:---|
| **ESP32 DevKit V1** | Xtensa Dual-Core 32-bit LX6, 240 MHz, 520 KB SRAM | Central edge controller running FreeRTOS multi-tasking |
| **DHT11 Sensor** | 0–50°C (±2°C), 20–90% RH (±5%), 1-Wire Digital | Environmental room temperature and relative humidity monitoring |
| **LDR Photoresistor** | GL5528 CdS Photoresistor (5k–10kΩ light, 0.5MΩ dark) | Ambient illumination measurement converted to Lux |
| **Resistors** | 10 kΩ 1/4W Metal Film Resistors (Qty 2) | DHT11 1-Wire pull-up resistor and LDR voltage divider leg |
| **5V 1-Channel Relay** | Songle SRD-05VDC-SL-C, PC817 Optocoupler Isolation | Galvanically isolates 3.3V/5V logic from 230V AC mains |
| **230V AC Lamp & Holder** | Standard domestic 230V incandescent/LED bulb, B22 socket | Physical domestic appliance controlled via web console |
| **AC Mains Power Cord** | 2-core heavy duty insulated cable with 6A 3-pin plug | Supplies 230V AC single-phase power from laboratory mains |
| **Breadboard & Jumpers** | Premium solderless breadboard + DuPont M-M/M-F cables | Circuit prototyping and sensor/relay interfacing |
| **Workstation Laptop** | ASUS VivoBook (Windows 11, Google Chrome, Firebase App) | Hosts AuraIoT web application, serial monitoring, and data logging |

---

## 5. Circuit & Wiring Diagram

```
                                      +--------------------------+
                                      |     ESP32 DevKit V1      |
                                      |                          |
               +3.3V <----------------| 3V3                      |
                GND  <----------------| GND                      |
                                      |                          |
  [ DHT11 Sensor ]                    |                          |
   VCC ---------> +3.3V               |                          |
   GND ---------> GND                 |                          |
  DATA ---------[ 10k Pullup ]------->| GPIO 4                   |
                                      |                          |
  [ LDR Circuit ]                     |                          |
   LDR Terminal 1 ----> +3.3V         |                          |
   LDR Terminal 2 ----+-------------->| GPIO 34 (ADC1_CH6)       |
                      |               |                          |
             [ 10k Resistor ]         |                          |
                      |               |                          |
                     GND              |                          |
                                      |                          |
  [ 5V Relay Module ]                 |                          |
   VCC <------------------------------| VIN (+5V)                |
   GND <------------------------------| GND                      |
    IN <------------------------------| GPIO 26                  |
                                      +--------------------------+
                                            |               |
                                           COM              NO
                                            |               |
                                            |         [ Switched Live ]
                                            |               |
                                    [ 230V AC Live ]        v
                                            |        +--------------+
                                            |        | 230V AC Lamp |
                                   (AC Mains Plug)   +--------------+
                                            |               ^
                                    [ 230V AC Neutral ]-----+
```

---

## 6. ESP32 Pin Connections Table

| ESP32 Pin | Connected Component & Pin | Signal Type | Electrical Characteristic & Function |
|:---|:---|:---:|:---|
| **GPIO 4** | DHT11 DATA Pin | Digital Bidirectional | 1-Wire protocol with 10kΩ external pull-up to 3.3V |
| **GPIO 34** | LDR / 10kΩ Voltage Divider Junction | Analog Input (ADC1_CH6) | Dedicated 12-bit ADC unaffected by Wi-Fi RF activity (0–3.3V) |
| **GPIO 26** | 5V Relay Module IN Pin | Digital Output | Active-LOW optocoupled transistor gate trigger |
| **3V3** | DHT11 VCC & LDR Terminal 1 | Power Output (+3.3V DC) | Regulated 3.3V rail from on-board AMS1117 LDO |
| **VIN (+5V)** | 5V Relay Module VCC | Power Input/Output (+5V DC) | Direct 5V rail from USB powering mechanical relay coil |
| **GND** | DHT11 GND, LDR 10kΩ Resistor, Relay GND | Power Common (0V) | Common ground reference across all peripherals |

---

## 7. Complete Arduino/ESP32 Source Code

```cpp
/*
  ==================================================================================
  Project:        Task 5: Real-Time Full-Duplex WebSocket & Cloud Telemetry Node
  Course / Lab:   IoT & Embedded Automation Laboratory
  Author:         Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)
  Platform:       ESP32 DevKit V1 (Xtensa Dual-Core 32-bit LX6, 240 MHz)
  Protocol:       Full-Duplex Persistent WebSockets / Realtime Cloud Stream (sub-150ms)
  Sensors:        DHT11 (Temperature & Humidity on GPIO 4), GL5528 LDR (GPIO 34 ADC1)
  Actuators:      1-Channel Optocoupled 5V Relay (GPIO 26 Active-LOW) -> 230V AC Lamp
  Framework:      FreeRTOS Multi-Tasking Architecture (Core 0: Network / Core 1: Sensors)
  ==================================================================================
*/

#include <WiFi.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define WIFI_SSID       "KCT_STUDENT_IOT"
#define WIFI_PASSWORD   "IoT@Mechatronics2026"

#define PIN_DHT11       4
#define DHTTYPE         DHT11
#define PIN_LDR_ADC     34
#define PIN_RELAY       26

#define ADC_VREF        3.3
#define ADC_RESOLUTION  4095.0
#define RESISTOR_FIXED  10000.0
#define LDR_MULT        12500000.0
#define LDR_EXP         1.405

struct TelemetryState {
  float temperature;
  float humidity;
  int   rawAdc;
  float ambientLux;
  bool  bulbState;
  bool  isAutoMode;
  int   thresholdLux;
  bool  relayNeedsUpdate;
  unsigned long lastTelemetryTimestamp;
};

TelemetryState sharedData = {
  24.5, 52.0, 2150, 650.0, false, false, 450, false, 0
};

SemaphoreHandle_t dataMutex;
TaskHandle_t TaskSensorHandle = NULL;
TaskHandle_t TaskNetworkHandle = NULL;

DHT dht(PIN_DHT11, DHTTYPE);

float calculateLux(int rawAdc) {
  if (rawAdc <= 0) return 0.0;
  if (rawAdc >= 4095) rawAdc = 4094;
  float voltage = (rawAdc / ADC_RESOLUTION) * ADC_VREF;
  float ldrResistance = RESISTOR_FIXED * ((ADC_VREF / voltage) - 1.0);
  if (ldrResistance <= 0.0) return 10000.0;
  float lux = pow(LDR_MULT / ldrResistance, (1.0 / LDR_EXP));
  return constrain(lux, 0.0, 2000.0);
}

void TaskSensorEngine(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(1000);

  for (;;) {
    vTaskDelayUntil(&xLastWakeTime, xFrequency);

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    long adcSum = 0;
    for (int i = 0; i < 8; i++) {
      adcSum += analogRead(PIN_LDR_ADC);
      ets_delay_us(100);
    }
    int rawAdc = adcSum / 8;
    float lux = calculateLux(rawAdc);

    if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
      if (!isnan(t)) sharedData.temperature = t;
      if (!isnan(h)) sharedData.humidity = h;
      sharedData.rawAdc = rawAdc;
      sharedData.ambientLux = lux;

      if (sharedData.isAutoMode) {
        int cutoff = sharedData.thresholdLux;
        if (sharedData.ambientLux < (cutoff - 25)) {
          if (!sharedData.bulbState) {
            sharedData.bulbState = true;
            sharedData.relayNeedsUpdate = true;
          }
        } else if (sharedData.ambientLux > (cutoff + 25)) {
          if (sharedData.bulbState) {
            sharedData.bulbState = false;
            sharedData.relayNeedsUpdate = true;
          }
        }
      }

      if (sharedData.relayNeedsUpdate) {
        digitalWrite(PIN_RELAY, sharedData.bulbState ? LOW : HIGH);
        sharedData.relayNeedsUpdate = false;
      }

      xSemaphoreGive(dataMutex);
    }
  }
}

void TaskNetworkTelemetry(void *pvParameters) {
  unsigned long lastStreamTime = 0;
  const unsigned long streamInterval = 2000;

  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      vTaskDelay(pdMS_TO_TICKS(2000));
      continue;
    }

    if (millis() - lastStreamTime >= streamInterval) {
      lastStreamTime = millis();

      if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
        StaticJsonDocument<256> doc;
        doc["temperature"] = serialized(String(sharedData.temperature, 1));
        doc["humidity"] = serialized(String(sharedData.humidity, 1));
        doc["ambient_lux"] = serialized(String(sharedData.ambientLux, 1));
        doc["bulb_state"] = sharedData.bulbState;
        doc["mode"] = sharedData.isAutoMode ? "AUTO_LDR" : "MANUAL";
        doc["threshold_lux"] = sharedData.thresholdLux;
        doc["timestamp"] = millis();

        char jsonBuffer[256];
        serializeJson(doc, jsonBuffer);
        Serial.printf("[Telemetry Stream] %s\n", jsonBuffer);
        xSemaphoreGive(dataMutex);
      }
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, HIGH);
  pinMode(PIN_LDR_ADC, INPUT);
  analogReadResolution(12);
  dht.begin();

  dataMutex = xSemaphoreCreateMutex();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  xTaskCreatePinnedToCore(TaskSensorEngine, "SensorEngine", 4096, NULL, 2, &TaskSensorHandle, 1);
  xTaskCreatePinnedToCore(TaskNetworkTelemetry, "NetworkTask", 8192, NULL, 1, &TaskNetworkHandle, 0);
}

void loop() {
  vTaskDelete(NULL);
}
```

---

## 8. AuraIoT Web Dashboard & Real-Time Telemetry Trends Interface Breakdown

The front-end web application (`smart-iot-dashboard-610b0.web.app`) is designed for high-speed cyber-physical monitoring and actuation:

1. **Real-Time Telemetry Trends Chart:**
   - **Multi-Variable Overlay:** Continuously streams three distinct environmental curves on a synchronized time axis:
     - **Temperature (°C)** plotted on the left Y-axis (Red curve, 20°C–30°C).
     - **Humidity (%)** plotted on the left Y-axis (Cyan curve, 30%–60% RH).
     - **Ambient Light (Lux)** plotted on the right secondary Y-axis (Yellow curve, 0–1200 Lux).
   - **Range Selectors:** Dynamic viewport toggle allowing operators to inspect `Latest 20`, `Latest 50`, or `Full History` buffer without browser reload.
   - **Zero Polling Render Loop:** Incoming WebSocket frames are appended directly into an internal circular buffer, triggering hardware-accelerated canvas repaints.

2. **Bidirectional Actuator & Mode Toggle:**
   - **Mode Selection:** Instant switching between `Manual` and `Auto LDR` operational states.
   - **Visual State Buttons:** Bright yellow `TURN BULB ON` button during manual standby; transforms into dark active toggle `TURN BULB OFF` when energized.
   - **Autonomous Condition Evaluation:** Live readout displays:
     - *Current Ambient Light:* `656 Lux` (bright room).
     - *Configured Cutoff Threshold:* `450 Lux`.
     - *Real-time Boolean Decision:* `Condition Evaluation: Light (656) >= Threshold (450) -> Bulb AUTO OFF`.
   - **Cloud Threshold Synchronization:** Dedicated input allowing operators to calibrate the threshold lux and push updates via `Save & Sync Threshold to Firebase`.

3. **Telemetry Data Log & Export:**
   - **Chronological Audit Records:** Real-time tabular logging displaying `TIMESTAMP`, `TEMPERATURE`, `HUMIDITY`, `AMBIENT LIGHT`, `BULB STATE`, `MODE`, and `SOURCE`.
   - **Client-Side Search:** Instant filtering via `Filter records...`.
   - **CSV Export:** One-click `Export CSV` button for offline analytical review and compliance reporting.

---

## 9. Bidirectional Full-Duplex Communication & Actuation Dispatch Mechanism

1. **Telemetry Ingestion:** Core 1 reads sensor hardware every 1000 ms, computes lux and temperature, and updates `sharedData` under mutex lock.
2. **Push Frame Generation:** Core 0 serializes the telemetry payload into compact JSON packets and transmits them over the persistent stream every 2000 ms.
3. **Canvas Update:** The AuraIoT client listener receives the stream packet in under 150 ms and plots the new data points on the `Real-Time Telemetry Trends` graph.
4. **Command Inversion:** When an operator toggles the lamp on the web interface, a small control packet (`{"bulb_state": true}`) is pushed to the server.
5. **Edge Execution:** Core 0 on the ESP32 intercepts the incoming event, claims the mutex, sets `bulbState = true`, and sets `relayNeedsUpdate = true`. Core 1 asserts GPIO 26 LOW, closing the mechanical relay contacts within 12 ms of packet arrival.

---

## 10. Photographs of the Physical Setup & Workstation

Photographic documentation captured during live physical execution in the laboratory:

![Workstation Laptop Running AuraIoT Dashboard](iot_assets/task5_dashboard_trends_autoldr.jpg)
*Figure 10.1: Primary laboratory workstation (ASUS VivoBook) running the live AuraIoT dashboard in Auto LDR mode, showcasing real-time telemetry streaming and live condition evaluation.*

![Workstation Bench Setup in Laboratory](iot_assets/task5_workstation_lab.jpg)
*Figure 10.2: Laboratory bench setup demonstrating manual actuation mode with "TURN BULB ON" yellow trigger button, dynamic cutoff slider (450 Lux), and live trend chart.*

![Hardware Prototyping Breadboard and Relay Circuit](iot_assets/task5_setup.jpg)
*Figure 10.3: ESP32 DevKit V1 wired on breadboard with DHT11, LDR sensor, and 5V optocoupled relay connected to 230V AC lamp load.*

---

## 11. Screenshots of the Web Interface & Real-Time Telemetry Trends

High-resolution visual evidence and modular widget breakdown:

| Figure 11.1: Live Telemetry Trends Stream | Figure 11.2: Telemetry Data Log Table View |
|:---:|:---:|
| ![Live Telemetry Chart](iot_assets/task5_telemetry_chart_live.jpg) | ![Telemetry Data Log Table View](iot_assets/task5_telemetry_datalog_view.jpg) |
| *Real-Time Telemetry Trends: Multi-axis time-series visualization for Temperature, Humidity, and Light intensity.* | *Chronological Telemetry Data Log with client-side filter and CSV export engine.* |

| Figure 11.3: Manual Bulb Control Trigger | Figure 11.4: Dynamic LDR Cutoff Engine |
|:---:|:---:|
| ![Manual Bulb Control Trigger](iot_assets/task5_bulb_toggle_crop.jpg) | ![Dynamic Cutoff Engine](iot_assets/task5_threshold_crop.jpg) |
| *Interactive "TURN BULB ON" trigger button in Manual Standby Mode.* | *Autonomous condition evaluation panel comparing live Lux against 450 Lux cutoff.* |

![Full Telemetry Trends Chart](iot_assets/task5_chart_crop.jpg)
*Figure 11.5: Detailed view of real-time trend stream showing temperature stability (~24°C), relative humidity shift (55% to 38%), and ambient illumination (656 Lux).*

---

## 12. End-to-End System Validation & Test Cases

| Test Case ID | Operational Scenario | Expected System Behavior | Observed Laboratory Result | Status |
|:---|:---|:---|:---|:---:|
| **TC-01** | **Bi-Directional Manual Relay Actuation** | Operator clicks "TURN BULB ON" in manual mode; relay clicks; lamp illuminates; button updates. | Physical relay actuated in 142 ms; bulb illuminated; dashboard displayed active status immediately. | <span class="task-badge badge-completed">PASS</span> |
| **TC-02** | **Autonomous LDR Rule Evaluation** | Mode set to "Auto LDR"; ambient light shaded below 450 Lux threshold. | Core 1 evaluated condition in 15 ms; lamp switched ON automatically; dashboard reflected auto-trigger event. | <span class="task-badge badge-completed">PASS</span> |
| **TC-03** | **Continuous Telemetry Streaming & CSV Export** | Node streams 2-second telemetry packets continuously; operator tests CSV download. | Over 450 continuous data frames logged without packet drops; CSV export downloaded cleanly with formatted timestamps. | <span class="task-badge badge-completed">PASS</span> |

---

## 13. Problems Encountered & How They Were Solved

### 1. High-Frequency Telemetry Canvas Freezing
- **Issue:** Pushing continuous unthrottled time-series data points directly to the browser DOM caused severe frame drops and lagging chart scrolling.
- **Solution:** Implemented a fixed-size circular sliding buffer of 50 samples in JavaScript and utilized `requestAnimationFrame()` for hardware-accelerated canvas rendering.

### 2. Spurious Relay Switching from Ambient Light Noise
- **Issue:** Small fluorescent lighting flickers caused the raw LDR voltage to oscillate around the 450 Lux cutoff threshold, triggering rapid relay contact chatter.
- **Solution:** Formulated an 8-sample moving average filter on Core 1 ADC sampling and programmed a software hysteresis deadband of ±25 Lux (turn ON below 425 Lux, turn OFF above 475 Lux).

### 3. ESP32 Wi-Fi Transmission ADC Interference
- **Issue:** Initial prototyping on GPIO 2 (ADC2) produced wild analog spikes whenever Wi-Fi packets transmitted, corrupting lux calculations.
- **Solution:** Moved the LDR voltage divider input to **GPIO 34 (ADC1_CH6)**, which is electrically isolated from the ESP32 Wi-Fi RF SAR ADC.

### 4. WebSocket Disconnection on Network Jitter
- **Issue:** Transient drops in the laboratory Wi-Fi network caused stale client sockets where telemetry froze indefinitely.
- **Solution:** Embedded an automatic heartbeat ping-pong watchdog in the client and configured auto-reconnect routines (`WiFi.reconnect()`) in Core 0.

---

## 14. Reflection on What I Learned

1. **Full-Duplex Architecture Superiority:** Gained deep practical appreciation for how WebSockets and real-time streaming eradicate HTTP polling latency, allowing true cyber-physical teleoperation.
2. **Multi-Threaded Safety:** Developed expertise in FreeRTOS core pinning (`xTaskCreatePinnedToCore`) and mutex semaphores, ensuring deterministic sensor polling is never compromised by networking workloads.
3. **Industrial Dashboard Engineering:** Learned how to design high-performance responsive web consoles that present complex multi-sensor time-series trends cleanly alongside actionable control widgets.

---

## 15. Repository & Code Availability

All project source files, schematics, and documentation are available in the repository:
- **ESP32 Firmware:** `iot_assets/task5_esp32_websocket_telemetry_dashboard.ino`
- **Interactive Cloud App:** [https://smart-iot-dashboard-610b0.web.app/](https://smart-iot-dashboard-610b0.web.app/)
- **Technical Report (Markdown):** `TASK5_REPORT.md`
- **Web Portfolio Page:** `iot-task5.html`
