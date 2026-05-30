/**
 * MAIN.JS
 * Electron Main Process
 * Handles window creation, IPC communication, child processes (server.js), 
 * and UDP telemetry/gamepad data exchange with the STM32 microcontroller.
 */

// ==========================================
// 1. MODULES & CONFIGURATION
// ==========================================
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const dgram = require("dgram");
const http = require("http");
const { fork } = require("child_process");
const net = require("net");

// Electron-reload for development (watches __dirname for changes)
try {
  require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
  });
} catch (err) {
  console.error('electron-reload yüklenemedi:', err);
}

// Global variable declarations
let mainWindow = null;
let serverProcess = null;
let tcp_sock;

// ==========================================
// 2. WINDOW CREATION & APP LIFECYCLE
// ==========================================

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // webSecurity: false // Temporarily disabled if needed for local RTSP streams
    }
  });

  mainWindow.loadFile('index.html');
  return mainWindow;
};

app.whenReady().then(() => {
  // Launch server.js (FFmpeg RTSP server) as a separate child process
  const serverPath = path.join(__dirname, "server.js");
  serverProcess = fork(serverPath);
  
  // Create the main GUI window
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  console.log("Quitting application...");

  // 1. Attempt to close TCP socket cleanly and unref it so it doesn't block exit
  if (tcp_sock) {
    tcp_sock.removeAllListeners();
    await new Promise((resolve) => {
      try {
        tcp_sock.close(() => {
          console.log("TCP socket closed.");
          resolve();
        });
        tcp_sock.unref();
      } catch (err) {
        console.error("TCP close error:", err);
        resolve();
      }
    });
  }

  // 2. Shut down the local express/FFmpeg server cleanly
  await new Promise((resolve) => {
    http.get("http://localhost:3000/shutdown", () => {
      console.log("Shutdown request sent to server.js");
      resolve();
    }).on("error", (err) => {
      console.error("Shutdown request failed:", err.message);
      resolve();
    });
  });

  // 3. Quit Electron application
  app.quit();
});


// ==========================================
// 3. IPC (INTER-PROCESS COMMUNICATION)
// ==========================================

// Toggle Fullscreen
ipcMain.on('toggle-fullscreen', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    const isFull = win.isFullScreen();
    win.setFullScreen(!isFull);
  }
});

// IP Connect Button handler
ipcMain.on("ip-connect", (e, ip) => {
  console.log(`Connect to: ${ip}:${STM32_PORT}`);
  STM32_IP = ip;

  // *NOTE:* 'win' is referenced here, but the global variable is 'mainWindow'.
  // Kept as-is to prevent functional changes, but consider checking this!
  if (win) {
    win.webContents.send("ip-connect", true);
  }
});

// IP Disconnect Button handler
ipcMain.on("ip-disconnect", (e) => {
  console.log("Disconnecting...");
  STM32_IP = null;

  // *NOTE:* Same as above regarding the 'win' variable.
  if (win) {
    win.webContents.send("ip-disconnect", true);
  } else {
    console.warn("Attempted to send disconnect event, but window does not exist.");
  }
});


// ==========================================
// 4. LEGACY TCP CODE (KEPT FOR REFERENCE)
// ==========================================
/*
const STM32_PORT = 25010;
let STM32_IP = "192.168.2.3";
// let STM32_IP = "127.0.0.1";
const tcp_sock = new net.Socket()
tcp_sock.connect(STM32_PORT, STM32_IP, () => {
  console.log("Connected")
});

tcp_sock.on("error", (err) => {
  console.error(`TCP Socket Error, destroying: ${err.message}`);
  // tcp_sock.destroy()
});

// Gamepad Info Listener
latest_data = null;
send = Buffer.alloc(8); // analoglari gonderecek olursan bufferi buyut
ipcMain.on("gamepad-info", (e, data) => { ... })
setInterval(() => { ... }, 200)
*/


// ==========================================
// 5. UDP COMMUNICATION (STM32 TELEMETRY)
// ==========================================

// --- IMU DATA RECEIVER ---
const imuSock = dgram.createSocket("udp4");
const IMU_PORT = 25011;

imuSock.bind(IMU_PORT, () => {
  console.log(`Listening for IMU data on UDP port ${IMU_PORT}`);
});

imuSock.on('message', (msg) => {
  // Unpack 24-byte float data (Roll, Pitch, Yaw, Ax, Ay, Az)
  if (msg.length >= 24) {
    const roll  = msg.readFloatLE(0);
    const pitch = msg.readFloatLE(4);
    const yaw   = msg.readFloatLE(8);
    const ax    = msg.readFloatLE(12);
    const ay    = msg.readFloatLE(16);
    const az    = msg.readFloatLE(20);
    
    if (mainWindow) {
      mainWindow.webContents.send('imu-data', { roll, pitch, yaw, ax, ay, az });
    }
  }
});

// --- GAMEPAD DATA SENDER ---
const udp_sock = dgram.createSocket("udp4");
const STM32_PORT = 25010;
let STM32_IP = "192.168.2.3";
// let STM32_IP = "127.0.0.1"; // Localhost testing

let latest_data = null;
let send = Buffer.alloc(8); // Buffer sized for 8 bytes. Adjust if analog triggers are added.

// Listen for Gamepad state from the Renderer process
ipcMain.on("gamepad-info", (e, data) => {
  latest_data = data;
  
  // Pack data into Buffer (8 Bytes)
  send.writeInt8(13, 0);                 // Header / Flag
  send.writeInt8(latest_data[0], 1);     // Left Stick X
  send.writeInt8(latest_data[1], 2);     // Left Stick Y
  send.writeInt8(latest_data[2], 3);     // Right Stick X
  send.writeInt8(latest_data[3], 4);     // Right Stick Y
  send.writeUInt16LE(latest_data[4], 5); // Buttons state: X, B, Y, A, LB, RB
  send.writeUInt8(10, 7);                // Dummy / Flag
  
  // send.writeUInt8(data[6], 6); // LT (Analog) placeholder
  // send.writeUInt8(data[7], 7); // RT (Analog) placeholder
});

// Send gamepad data via UDP every 20ms (50Hz)
setInterval(() => {
  if (latest_data) {
    udp_sock.send(send, 0, send.length, STM32_PORT, STM32_IP, (error) => {
      if (error) {
        console.error("UDP send error:", error.message);
      }
    });
    latest_data = null; // Clear to prevent resending old frames
  }
}, 20);