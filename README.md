# AquaTrio — Fish Tank Remote Control

AquaTrio is a responsive React dashboard for monitoring and controlling a smart aquarium over **MQTT over secure WebSockets (WSS)** or a built-in simulated mock transport.

## Getting Started

```bash
npm install
npm run dev       # Starts Vite on http://localhost:3000
npm run build     # Production bundle
npm run lint      # Syntax checks + Node unit tests
```

---

## MQTT Broker Setup & Testing Guide

### 1. Create a Free EMQX Cloud or HiveMQ Cloud Cluster

**Option A — EMQX Cloud (Serverless)**
1. Sign up at [EMQX Cloud](https://www.emqx.com/en/cloud) and create a **Serverless** deployment.
2. Open **Overview** to copy the **WSS** endpoint (for example: `wss://<your-cluster>.emqxsl.com:8084/mqtt`).
3. Ensure TLS/SSL WebSockets on port `8084` (`/mqtt` path) are enabled (enabled by default on Serverless clusters).

**Option B — HiveMQ Cloud (Serverless)**
1. Sign up at [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) and create a free **Serverless** cluster.
2. Copy the cluster hostname and use the WebSocket TLS endpoint: `wss://<your-cluster>.s1.eu.hivemq.cloud:8884/mqtt`.

---

### 2. Create a Separate Limited Broker User for the Web App

Never reuse your ESP32/hardware device credentials or admin credentials in browser code. Create a dedicated user (`aquatrio_web`) with strict topic ACLs:

- **Username**: `aquatrio_web`
- **Password**: generate a strong password (store it only in `VITE_MQTT_PASS` as an environment secret)
- **Permissions (ACLs)** for device `tank01`:
  - **Allow Subscribe**: `aquatrio/tank01/status/+` and `aquatrio/tank01/cmd/schedule`
  - **Allow Publish**: `aquatrio/tank01/cmd/#`
  - **Deny** publishing to `aquatrio/tank01/status/#` (only the tank controller publishes telemetry and online status)

Create a separate user (e.g. `aquatrio_device`) for the physical tank controller / MQTTX testing with publish access to `aquatrio/tank01/status/#` and subscribe access to `aquatrio/tank01/cmd/#`.

---

### 3. Configure Environment Variables

Copy `.env.example` to `.env` (or configure secrets in your hosting environment):

```env
VITE_USE_MOCK=false
VITE_MQTT_URL=wss://g12d8801.ala.asia-southeast1.emqxsl.com:8084/mqtt
VITE_MQTT_USER=aquatrio_web
VITE_MQTT_PASS=
VITE_DEVICE_ID=tank01
```

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_USE_MOCK` | Set `"true"` for simulated local data, `"false"` for live MQTT over WSS | `false` |
| `VITE_MQTT_URL` | Full secure WebSocket broker URL including path (`/mqtt`) | `wss://g12d8801.ala.asia-southeast1.emqxsl.com:8084/mqtt` |
| `VITE_MQTT_USER` | Limited web-client MQTT username | `aquatrio_web` |
| `VITE_MQTT_PASS` | Password secret for `VITE_MQTT_USER` (never committed; must be set) | *(none — required)* |
| `VITE_DEVICE_ID` | Device identifier used in `aquatrio/{deviceId}/` topics | `tank01` |

> If `VITE_USE_MOCK=false` and `VITE_MQTT_PASS` is not set, AquaTrio will remain offline and display **"MQTT password not configured"** without crashing.

---

### 4. Testing with MQTTX

1. Open [MQTTX](https://mqttx.app/) and create a connection to your broker over `wss://` (port `8084`, path `/mqtt`) or `mqtts://` (port `8883`) using your device/admin user.
2. **Bring the device online**:
   - Topic: `aquatrio/tank01/status/online`
   - Payload (plain text): `online`
   - **QoS**: `1`, **Retain**: `true`
3. **Publish retained sample telemetry**:
   - Topic: `aquatrio/tank01/status/telemetry`
   - **QoS**: `1`, **Retain**: `true`
   - Payload (JSON):
     ```json
     {
       "waterLevel": "normal",
       "waterClarity": "clear",
       "temperature": 26.5,
       "feedPercent": 65,
       "lastFed": 1731571200,
       "lastFedSource": "schedule",
       "nextFeed": 1731600000,
       "filter": { "running": true, "auto": true },
       "refill": { "active": false, "auto": true, "fault": null },
       "battery": 82,
       "batteryVolts": 12.1,
       "solarCharging": true
     }
     ```
4. **Watch commands sent by the web app**:
   - In MQTTX, add a subscription to `aquatrio/tank01/cmd/#` at **QoS 1**.
   - Click **Feed Now**, **Stop Filter**, or **Refill Now** in the AquaTrio UI — MQTTX will receive the command JSON while the UI button shows a pending spinner until you publish an updated `status/telemetry` payload confirming the change (otherwise the UI times out after 5s with `"Device didn't respond"`).
5. **Publish or test a retained feeding schedule**:
   - Topic: `aquatrio/tank01/cmd/schedule`
   - **QoS**: `1`, **Retain**: `true`
   - Payload (JSON):
     ```json
     {
       "feedTimes": [
         { "time": "08:00", "days": [1, 2, 3, 4, 5, 6, 7], "portions": 1 },
         { "time": "18:00", "days": [1, 3, 5], "portions": 2 }
       ]
     }
     ```
   - Open the **Schedule** tab in AquaTrio to verify the retained schedule loads, and save a new feeding time to see the app publish an updated retained `cmd/schedule` message.

---

### 5. MQTT Topic Reference (`aquatrio/{deviceId}/`)

| Topic | Direction | QoS | Retain | Payload Format |
| --- | --- | --- | --- | --- |
| `aquatrio/{deviceId}/status/telemetry` | Device → App | 1 | Yes | JSON (`waterLevel`, `waterClarity`, `temperature`, `feedPercent`, `lastFed`, `lastFedSource`, `nextFeed`, `filter`, `refill`, `battery`, `batteryVolts`, `solarCharging`) |
| `aquatrio/{deviceId}/status/online` | Device → App | 1 | Yes | Plain string: `"online"` or `"offline"` |
| `aquatrio/{deviceId}/cmd/feed` | App → Device | 1 | No | `{"portions": 1}` |
| `aquatrio/{deviceId}/cmd/filter` | App → Device | 1 | No | `{"action": "start" \| "stop"}` |
| `aquatrio/{deviceId}/cmd/filter/auto` | App → Device | 1 | No | `{"enabled": true \| false}` |
| `aquatrio/{deviceId}/cmd/refill` | App → Device | 1 | No | `{"action": "start" \| "stop"}` |
| `aquatrio/{deviceId}/cmd/refill/auto` | App → Device | 1 | No | `{"enabled": true \| false}` |
| `aquatrio/{deviceId}/cmd/schedule` | App ↔ Device | 1 | Yes | `{"feedTimes": [{"time": "08:00", "days": [1,2,3,4,5,6,7], "portions": 1}]}` (`days`: `1`=Mon … `7`=Sun, UTC+8) |
