/*
 * STAROV-1
 * Copyright (c) 2025-2026 Furkan Karstarlı
 * 
 * This source code is licensed under the MIT License.
 * You may not use this file except in compliance with the License.
 * Please see the LICENSE file in the root directory of this project for full details.
 */

/**
 * PRELOAD.JS
 * Acts as a secure bridge between the main process (Node.js/Electron)
 * and the renderer process (Web/UI). Exposes specific IPC channels
 * to the window object without enabling full Node integration.
 */
const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electron', {

  // Toggle Fullscreen Command
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

  // ==========================================
  // IPC Commands (Gamepad & Network IP)
  // ==========================================
  ipc: {
    send_gamepad_info: (data) => {
      if (data && typeof data === "object") {
        ipcRenderer.send("gamepad-info", data);
      } else {
        console.error("Invalid gamepad data received:", data);
      }
    },

    send_ip_connect: (ip) => {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(ip)) {
        ipcRenderer.send("ip-connect", ip);
      } else {
        console.error("Invalid IP Address:", ip);
      }
    },

    on_ip_connect: (func) => {
      ipcRenderer.removeAllListeners("ip-connect");
      console.log("Listening for connection updates...");
      ipcRenderer.on("ip-connect", (_, result) => { 
        console.log("Connection event received:", result);
        func(result); 
      });
    },

    send_ip_disconnect: () => { 
      ipcRenderer.send("ip-disconnect"); 
    }, 
    
    on_ip_disconnect: (func) => { 
      ipcRenderer.on("ip-disconnect", (_, status) => func(status)); 
    }
  },

  // ==========================================
  // IMU Sensor Data Channel
  // ==========================================
  imu: {
    onData: (callback) => {
      // Remove existing listeners to prevent memory leaks or duplicate calls
      ipcRenderer.removeAllListeners('imu-data');
      ipcRenderer.on('imu-data', (_, data) => callback(data));
    }
  }

});
