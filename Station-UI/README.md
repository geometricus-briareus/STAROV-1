<div align="center">

# STAROV-1 Ground Control Station (GCS)

**A high-performance, low-latency desktop interface built to pilot and monitor the STAROV-1 underwater vehicle.**

[![Watch the Demo](https://img.shields.io/badge/YouTube-Watch_Live_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](YOUR_UNLISTED_YOUTUBE_LINK_HERE)

![STAROV-1 Interface Demo](./assets/images/interface-demo.gif)  
*Real-time interface capturing Gamepad input, IMU telemetry, and MJPEG video streaming.*

</div>

---

## 📌 Overview
This directory contains the complete source code for the **STAROV-1 Ground Control Station**. Designed for operational reliability, this Electron-based desktop application serves as the central hub between the human operator and the STM32-based embedded systems on the ROV.

It handles three critical concurrent tasks without blocking the main thread:
1. **Real-time 60fps hardware polling** via the HTML5 Gamepad API.
2. **High-frequency UDP bidirectional telemetry** to and from the STM32 microcontroller.
3. **Live video transcoding and streaming** bridging an RTSP camera feed to an HTML-compatible MJPEG stream.

---

## 🏗️ System Architecture & Data Flow

To ensure zero-latency piloting, the application is structured into decoupled micro-processes:

* **The UI Thread (Renderer Process):** Pure Vanilla JavaScript, HTML, and CSS. Chosen specifically to avoid the overhead of frontend frameworks (React/Vue) and guarantee frame-perfect UI updates and Gamepad polling via `requestAnimationFrame`.
* **The IPC Bridge (`preload.js`):** Implements strict Context Isolation. The frontend cannot access Node.js directly; it communicates via a heavily restricted, custom API surface for security.
* **The Hardware Thread (Main Process):** Manages raw Node.js `dgram` UDP sockets. It listens for IMU/Sensor data on Port `25011` and broadcasts Gamepad state to the STM32 on Port `25010` at 50Hz.
* **The Video Microservice (`server.js`):** A standalone Express.js server spawned as a child process. Since browsers cannot natively render RTSP streams, this microservice uses **FFmpeg** to capture the ROV's camera feed, transcode it into a continuous MJPEG boundary stream, and pipe it locally to the frontend.

---

## 💻 Tech Stack
* **Framework:** Electron (Node.js + Chromium)
* **Frontend:** Vanilla JS, HTML5, CSS3
* **Backend:** Express.js, FFmpeg (Child Process management)
* **Networking:** UDP (`dgram`), IPC (Inter-Process Communication)
* **Hardware Interfacing:** HTML5 Gamepad API

---

## 🚀 Key Engineering Features

### 🎮 Custom Controller Mapping
Built a robust polling loop that maps raw X/Y axis data and bitwise-encoded button arrays into a standardized 8-byte UDP packet, ensuring lightweight and instantaneous transmission to the embedded logic.

### 📊 Real-Time Telemetry Dashboard
Dynamic visual rendering of real-time sensor data, including:
* 6-Axis IMU visualization (Roll, Pitch, Yaw, Acceleration)
* Depth (Pressure) and Humidity mapping
* Battery lifecycle tracking

### 🛡️ Process Lifecycle Management
Implemented fail-safes to ensure that when the Electron app is closed, all child processes (like the Express video server and FFmpeg transcoder) and UDP sockets are gracefully killed and unreferenced to prevent memory leaks or zombie processes.

---

## 🛠️ Local Setup & Development

If you wish to run this interface locally:

**1. Install Dependencies**
```bash
npm install
```
**2. Ensure FFmpeg is installed**

This application requires FFmpeg to be installed and accessible in your system's PATH for the video streaming microservice to function.

**3. Start the Application**
```bash
npm start
```