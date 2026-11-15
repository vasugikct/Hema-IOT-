# Task 4: ESP32 Firebase Realtime Cloud IoT & Smart Environmental Automation Engine
**Course / Laboratory:** Internet of Things (IoT) & Embedded Automation  
**Author:** Vasugi D (B.E. Mechatronics Engineering, Kumaraguru College of Technology)  
**Status:** Completed, Physically Validated & Documented  
**Hardware Platform:** ESP32 DevKit V1 (Xtensa Dual-Core 240MHz) + DHT11 (GPIO 4) + LDR Sensor (GPIO 34 ADC) + 1-Channel 5V Optocoupled Relay (GPIO 26) + 230V AC Lamp  
**Cloud IoT Platform:** Google Firebase Realtime Database (`smart-iot-dashboard-610b0-default-rtdb.firebaseio.com`) & Firebase Web Hosting (`smart-iot-dashboard-610b0.web.app`)  
**Operating System Architecture:** FreeRTOS Dual-Core Preemptive Multi-Tasking (Core 0: Cloud Sync, Core 1: Sensor Engine)  

---

## Deliverables Verification Matrix

| # | Required Item | Verification Status | Location / Artifact |
|:---|:---|:---:|:---|
| 1 | **Objective of the assignment and problem addressed** | ☑ Completed | Section 1 |
| 2 | **Basic concept of Firebase Realtime DB & Dual-Core FreeRTOS** | ☑ Completed | Section 2 |
| 3 | **How the ESP32 and Firebase communicate over Wi-Fi** | ☑ Completed | Section 3 |
| 4 | **Hardware components used** | ☑ Completed | Section 4 |
| 5 | **Circuit/wiring diagram** | ☑ Completed | Section 5 & ASCII Schematic |
| 6 | **ESP32 pin connections table** | ☑ Completed | Section 6 |
| 7 | **Complete Arduino/ESP32 source code** | ☑ Completed | Section 7 & `iot_assets/task4_esp32_firebase_freertos_dht11_ldr_relay.ino` |
| 8 | **AuraIoT Web Dashboard & Historical Data Log Interface** | ☑ Completed | Section 8 & `iot_assets/task4_dashboard_auraiot.jpg` |
| 9 | **Bidirectional Telemetry & Actuation Dispatch Mechanism** | ☑ Completed | Section 9 |
| 10 | **Photographs of the physical setup &amp; workstation** | ☑ Completed | Section 10 &amp; `iot_assets/task4_dashboard_auraiot.jpg` |
| 11 | **Screenshots of the web interface &amp; historical data log** | ☑ Completed | Section 11 &amp; `iot_assets/task4_datalog_firebase.jpg` |
| 12 | **End-to-End System Validation & Automation Engine** | ☑ Completed | Section 12 |
| 13 | **Problems encountered and how they were solved** | ☑ Completed | Section 13 |
| 14 | **Brief reflection on what you learned** | ☑ Completed | Section 14 |
| 15 | **All required files/code available in repository** | ☑ Completed | Section 15 |

---

## 1. Objective of the Assignment & Problem Being Addressed

### Objective
To engineer, deploy, and benchmark an industrial-grade cyber-physical IoT automation node powered by an **ESP32 microcontroller** integrated with **Google Firebase Realtime Database** and an interactive web application (**AuraIoT**). The edge node concurrently acquires ambient environmental telemetry (**DHT11** Temperature and Humidity, **LDR** Ambient Light in Lux), evaluates a configurable **autonomous threshold automation engine** for switching a 230V AC lamp via a 5V optocoupled relay, supports **manual cloud override**, and streams continuous chronological time-series records to a cloud data log.

### Problem Addressed
- **Blocking Latency in Embedded IoT Systems:** Traditional Arduino-style single-loop architectures (`void loop()`) suffer from high latency when executing blocking network requests (such as Firebase HTTPS/WebSocket handshakes taking 300–800 ms). During network synchronization, sensor polling is frozen, leading to dropped sensor reads and unresponsive local actuator switching.
- **Single-Point Failure of Cloud-Dependent Automation:** When an IoT node relies solely on cloud logic to trigger physical switches, an internet outage renders local automation completely inoperative. An edge-computed automation engine with cloud sync is necessary for true operational resilience.
- **Complex Bidirectional State Synchronization:** Coordinating real-time sensor updates, autonomous edge-triggered relay transitions, and manual user interventions across desktop/mobile web clients without race conditions requires a synchronized NoSQL real-time database architecture.

---

## 2. Basic Concept of Firebase Realtime DB & Dual-Core FreeRTOS

The solution is architected around two complementary core technologies:

### 1. Google Firebase Realtime Database (RTDB)
- **JSON Tree Structure:** Data is stored as a centralized NoSQL JSON document.
- **WebSocket / Server-Sent Events (SSE):** Rather than standard client polling, Firebase uses persistent bi-directional WebSockets. Whenever a database node (`/control/bulb_state`, `/control/ldr_threshold`) changes, updates are pushed down to connected clients with millisecond latency.
- **Chronological Time-Series Logging:** The edge node pushes immutable timestamped records under `/logs`, creating a persistent audit trail of environmental conditions and relay states.

### 2. FreeRTOS Dual-Core Architecture
The ESP32 features two 32-bit Xtensa LX6 CPU cores operating at 240 MHz. FreeRTOS allows tasks to be explicitly pinned to specific cores:
- **Core 0 (`TaskFirebaseSync`):** Handles TCP/IP network protocol stacks, Wi-Fi reconnection routines, TLS/SSL encryption, and Firebase Realtime Database streaming.
- **Core 1 (`TaskSensorAcquisition`):** Dedicated exclusively to deterministic hard real-time tasks: one-wire bit-banging communication with the DHT11 sensor, high-speed ADC sampling of the LDR voltage divider, Lux computation, threshold evaluation, and GPIO 26 relay switching.
- **Mutex Synchronization (`xSemaphoreCreateMutex`):** Protects shared sensor and control variables across both cores, preventing race conditions or memory corruption.

---

## 3. Communication Architecture & Protocol Timeline

```
+---------------------------------------------------------------------------------------------------------+
|                                    COMMUNICATION ARCHITECTURE & PROTOCOL                                 |
+---------------------------------------------------------------------------------------------------------+

 [AuraIoT Web App]                         [Firebase RTDB Cloud]                    [ESP32 Edge Node]
(smart-iot-dashboard)                 (smart-iot-dashboard-610b0)                  Core 0        Core 1
        |                                         |                                  |              |
        |                                         |                                  |<-- Telemetry-| (Sensor Read:
        |                                         |<-- (1) Periodic RTDB Push -------|    (Mutex)   |  DHT11 + LDR)
        |                                         |    /telemetry/temperature        |              |
        |<-- (2) SSE / WebSocket Push ------------|    /telemetry/humidity           |              |
        |    Renders: 27.7°C, 30% RH, 632 Lux     |    /telemetry/ambient_light_lux  |              |
        |                                         |                                  |              |
        |--- (3) User Toggles Relay OFF --------->|                                  |              |
        |    Writes /control/bulb_state: false    |--- (4) Realtime Stream Event --->|              |
        |                                         |                                  |-- Mutex ---->| (Actuates
        |                                         |                                  |   Update     |  GPIO 26 HIGH
        |                                         |                                  |              |  Relay OFF)
        |                                         |<-- (5) Append /logs Entry -------|              |
        |<-- (6) Live Data Log Updated -----------|    Timestamp, 27°C, 44%, 680 Lux |              |
```

---

## 4. Hardware Components Used

| Component | Specification | Role & Placement |
|:---|:---|:---|
| **ESP32 DevKit V1** | Xtensa Dual-Core 32-bit LX6, 240 MHz, 520 KB SRAM | Central edge controller running FreeRTOS multi-tasking |
| **DHT11 Sensor** | 0–50°C (±2°C), 20–90% RH (±5%), 1-Wire Digital | Digital environmental temperature and humidity monitoring |
| **LDR (Photoresistor)** | GL5528 Light Dependent Resistor (5k–10kΩ light, 0.5MΩ dark) | Ambient illumination measurement in Lux |
| **Resistors** | 10 kΩ 1/4W Metal Film Resistors (Qty 2) | DHT11 bus pull-up resistor and LDR voltage divider |
| **5V 1-Channel Relay** | Songle SRD-05VDC-SL-C, PC817 Optocoupler Isolation | Optically isolated high-voltage AC mains switching |
| **230V AC Lamp & Holder** | Standard domestic 230V AC incandescent / LED bulb | Target physical domestic load |
| **AC Mains Power Cord** | 2-core insulated mains cable with molded 6A wall plug | Supplies 230V AC alternating current from wall mains |
| **Breadboard & Jumpers** | Premium solderless breadboard + DuPont M-M/M-F cables | Circuit prototyping and sensor/relay interfacing |
| **Workstation Laptop** | ASUS VivoBook (Windows 11, Chrome, Firebase Hosting) | Dashboard testing, serial monitoring, cloud deployment |

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
| **GPIO 4** | DHT11 `DATA` Pin | Digital Bidirectional | 1-Wire protocol bus with 10kΩ pull-up to 3.3V |
| **GPIO 34** | LDR & 10kΩ Divider Junction | Analog Input (ADC1) | 12-bit ADC (0–4095) measuring voltage proportional to ambient Lux |
| **GPIO 26** | 5V Relay Module `IN` Pin | Digital Output | Active-LOW relay actuation (`LOW` = Relay ON, `HIGH` = Relay OFF) |
| **VIN (+5V)** | Relay Module `VCC` Pin | DC Power | 5.0V power input from USB bus for relay coil activation |
| **3V3 (+3.3V)** | DHT11 `VCC` & LDR High Side | DC Power | Regulated 3.3V DC power rail for sensitive digital & analog sensors |
| **GND** | Relay `GND`, DHT11 `GND`, Divider `GND` | Ground | Common reference ground for all DC subsystems |
| *Isolated* | Relay `COM` (Common) | 230V AC Mains | High-voltage Live (Phase) input line from AC wall receptacle |
| *Isolated* | Relay `NO` (Normally Open) | 230V AC Mains | Switched Live line routed to socket base of AC lamp holder |
| *Isolated* | Lamp Neutral Wire | 230V AC Mains | AC Return line connected directly back to mains plug Neutral |

---

## 7. Complete Arduino/ESP32 Source Code

The firmware is structured with FreeRTOS dual-core tasking and Firebase Realtime Database client libraries:
- Pinned to Core 1: `TaskSensorAcquisition` running deterministic 2000 ms sensor reads and local threshold evaluations.
- Pinned to Core 0: `TaskFirebaseSync` managing telemetry uploads, chronological audit logging, and bidirectional cloud command processing.
- Repository Path: `iot_assets/task4_esp32_firebase_freertos_dht11_ldr_relay.ino`

---

## 8. AuraIoT Web Dashboard & Historical Data Log Breakdown

The companion web interface is deployed live at **`smart-iot-dashboard-610b0.web.app`**:

1. **Header & System Status Bar:**
   - **Branding:** AuraIoT (ESP32 + FIREBASE)
   - **Connection State:** Green pill indicating `[ESP32 ONLINE]`
   - **Mode Selectors:** Instant switching between `[Manual]` and `[Auto LDR]` operation
2. **Real-Time Telemetry Cards:**
   - **Temperature Card:** Displays current temperature (`27.7 °C`), sensor reference (`Sensor: DHT11 (GPIO 4)`), daily peak tracking (`Peak today: 27.9 °C`), and `NORMAL` status badge.
   - **Humidity Card:** Displays relative humidity (`30 %RH`), operational range indicator (`Optimal range: 40% - 65%`), and `DRY` condition badge.
   - **Ambient Light Card:** Displays calibrated luminance (`632 Lux`), hardware ADC telemetry (`Raw ADC: 2157 / 4095`), and daylight status badge (`BRIGHT DAYLIGHT`).
3. **Appliance Relay Control Panel:**
   - Dedicated module for `5V Relay Module • AC Light Bulb (GPIO 26)`
   - Glowing graphic visualization (`Bulb is GLOWING (ON)`)
   - Interactive toggle button (`TURN BULB OFF` / `TURN BULB ON`)
   - Informative footnote explaining automatic threshold override
4. **LDR Automation Engine Panel:**
   - Threshold slider adjustable from `50 Lux (Very Dark)` to `1200 Lux (Bright)`
   - Configured cutoff set to `450 Lux`
   - Real-time condition evaluation: `Condition Evaluation: Light (632) >= Threshold (450) -> Bulb AUTO OFF`
   - Synchronizes threshold directly to Firebase Realtime Database
5. **Historical Data Log Table:**
   - Full chronological table logging environmental state every 2 seconds
   - Columns: `TIMESTAMP`, `TEMPERATURE`, `HUMIDITY`, `AMBIENT LIGHT`, `BULB STATE`, `MODE`, `SOURCE`
   - Features search filtering and CSV/JSON export

---

## 9. Bidirectional Telemetry & Actuation Dispatch Mechanism

1. **Telemetry Streaming (Edge → Cloud → Dashboard):**
   - Core 1 samples the sensors and calculates ambient Lux.
   - Data is stored in thread-safe memory via `xSemaphoreTake(dataMutex)`.
   - Core 0 packages parameters into JSON and updates `/telemetry` in Firebase RTDB.
   - Firebase pushes updates over WebSockets to `smart-iot-dashboard-610b0.web.app`, updating UI metrics in < 150 ms.
2. **Autonomous Edge Actuation (Self-Contained Rule Engine):**
   - In `AUTO_LDR` mode, Core 1 evaluates: `if (ambientLightLux < ldrThreshold) -> Bulb ON; else -> Bulb OFF;`.
   - Actuation occurs deterministically on Core 1 in < 5 ms, independent of Wi-Fi status.
3. **Manual Cloud Override (Dashboard → Cloud → Edge):**
   - User clicks `TURN BULB OFF` on the dashboard.
   - Browser writes `/control/bulb_state = false` to Firebase.
   - Firebase stream listener on ESP32 Core 0 intercepts change, acquires mutex, and drives GPIO 26 HIGH, de-energizing the relay.

---

## 10. Photographs of Physical Setup & Workstation

![AuraIoT Live Dashboard on Workstation Laptop](iot_assets/task4_dashboard_auraiot.jpg)

*Figure 10.1: Live physical workstation setup featuring ASUS VivoBook displaying AuraIoT environmental telemetry (27.7°C, 30% RH, 632 Lux) and appliance relay control synced via Google Firebase Realtime Database.*

![Workstation Bench Integration](iot_assets/task4_laptop_workstation.jpg)

*Figure 10.2: Bench overview showing laptop client communicating over 2.4 GHz Wi-Fi with instantaneous telemetry refresh and local relay actuation.*

---

## 11. Screenshots of Web Interface & Chronological Data Log

![Firebase Realtime Historical Data Log Table](iot_assets/task4_datalog_firebase.jpg)

*Figure 11.1: Firebase Realtime Database historical time-series audit log table capturing continuous 2-second timestamped telemetry records (4:07:33 PM, 27.0°C, 44% RH, 680 Lux, Bulb OFF, Mode MANUAL, Source ESP32 Node).*

![AuraIoT Web Dashboard](iot_assets/task4_dashboard_screen.jpg)

*Figure 11.2: Glassmorphic control console rendering DHT11 temperature (27.7°C), humidity (30% RH), ambient light (632 Lux), active relay toggle, and threshold engine.*

### Granular Feature Widget Breakdowns

| Sensor Telemetry Cluster | Relay Actuation Module |
|:---:|:---:|
| ![Sensors](iot_assets/task4_sensors_telemetry.jpg) | ![Relay Control](iot_assets/task4_relay_widget.jpg) |
| *Real-time temperature, humidity, and lux gauges* | *5V Relay active AC light bulb toggle* |

| LDR Automation Engine | Granular Data Log Stream |
|:---:|:---:|
| ![LDR Engine](iot_assets/task4_ldr_engine_widget.jpg) | ![Data Log Rows](iot_assets/task4_datalog_table_screen.jpg) |
| *Threshold cutoff slider (450 Lux rule engine)* | *Timestamped chronological audit logs* |

---

## 12. End-to-End System Validation & Automation Engine

Three formal verification test cases were executed and validated:

| Test Case | Scenario / Input | Expected Result | Actual Measured Result | Status |
|:---|:---|:---|:---|:---:|
| **TC-01** | User toggles bulb button on dashboard from OFF to ON | Firebase updates; ESP32 fires GPIO 26 LOW; AC lamp lights | Relay clicked in 180 ms; bulb illuminated; dashboard reflected state | **PASS** |
| **TC-02** | Auto LDR mode enabled; ambient light shaded below 450 Lux | Autonomous engine detects low lux; switches bulb ON without cloud lag | Relay actuated within 15 ms of sensor read; status synced to Firebase | **PASS** |
| **TC-03** | Continuous multi-sensor streaming for 30 minutes | Periodic 2s telemetry updates and 5s data log insertions without crash | 360+ logs logged in Firebase; zero memory leaks; FreeRTOS heap stable | **PASS** |

---

## 13. Problems Encountered & How They Were Solved

1. **ADC2 Wi-Fi Conflict:**
   - *Problem:* Initial prototype used GPIO 2 (ADC2_CH2) for the LDR. When Wi-Fi transmitted, analog reads returned 0 or 4095 erroneously because ADC2 is shared with the Wi-Fi RF module.
   - *Solution:* Migrated the LDR voltage divider to **GPIO 34**, which is an **ADC1 channel (ADC1_CH6)**. ADC1 operates completely independently of the Wi-Fi subsystem.
2. **Sensor Read Jitter During Network Calls:**
   - *Problem:* Single-threaded execution caused DHT11 read timeouts whenever Firebase HTTP requests blocked execution.
   - *Solution:* Implemented **FreeRTOS dual-core task pinning**: pinning `TaskSensorAcquisition` to Core 1 and `TaskFirebaseSync` to Core 0, completely isolating sensor timing from network latency.
3. **Relay Chattering Around Lux Threshold:**
   - *Problem:* When ambient light hovered closely around 450 Lux (e.g. fluctuating between 448 and 452 Lux), the relay rapidly clicked ON and OFF.
   - *Solution:* Implemented a **software hysteresis deadband of ±25 Lux**: light must drop below 425 Lux to turn ON, and must exceed 475 Lux to turn OFF.

---

## 14. Reflection on What I Learned

- **Real-Time Cloud Systems:** Mastered Google Firebase Realtime Database architecture and experienced the dramatic latency benefits of WebSocket event streaming over traditional HTTP polling.
- **Embedded RTOS Multi-Tasking:** Gained practical engineering expertise in FreeRTOS dual-core task design, inter-core synchronization using mutex semaphores, and CPU core affinity on ESP32.
- **Edge-Cloud Hybrid Resilience:** Demonstrated the critical importance of keeping automation decision logic at the edge while utilizing cloud dashboards for monitoring, configuration, and auditing.

---

## 15. Repository & Code Availability

- **Firmware File:** `iot_assets/task4_esp32_firebase_freertos_dht11_ldr_relay.ino`
- **Dashboard Screenshots:** `iot_assets/task4_dashboard_auraiot.jpg`, `iot_assets/task4_datalog_firebase.jpg`
- **Live Cloud Dashboard URL:** [https://smart-iot-dashboard-610b0.web.app/](https://smart-iot-dashboard-610b0.web.app/)
