/*
 * STAROV-1
 * Copyright (c) 2025-2026 Furkan Karstarlı
 * 
 * This source code is licensed under the MIT License.
 * You may not use this file except in compliance with the License.
 * Please see the LICENSE file in the root directory of this project for full details.
 */

/**
 * SERVER.JS
 * Express microservice that acts as a video streaming bridge.
 * Spawns an FFmpeg child process to capture an RTSP camera stream, 
 * converts it to an MJPEG format, and pipes it to the Electron frontend.
 */

const express = require("express");
const { spawn } = require("child_process");

const app = express();
const PORT = 3000;

// NOTE: In a production environment, sensitive URLs and credentials 
// should ideally be moved to a .env file. Kept here for development.
const RTSP_URL = "rtsp://admin:PasswordOfIPCamera.!@192.168.2.5:554/cam/realmonitor?channel=1&subtype=0";

let ffmpeg = null;

// ==========================================
// 1. VIDEO STREAMING ROUTE
// ==========================================

app.get("/stream", (req, res) => {
    // Setup header for continuous MJPEG stream
    res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");

    // Spawn FFmpeg to transcode RTSP to MJPEG at 25fps / 1080p
    ffmpeg = spawn("ffmpeg", [
        "-rtsp_transport", "tcp",
        "-fflags", "nobuffer",
        "-i", RTSP_URL,
        "-vf", "fps=25,scale=1920:1080",
        "-f", "mjpeg",
        "-q:v", "5",
        "pipe:1"
    ]);

    let buffer = Buffer.alloc(0);

    // Process incoming data chunks from FFmpeg
    ffmpeg.stdout.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        // Find JPEG magic bytes in the buffer:
        // Start of Image (SOI): 0xFF 0xD8
        // End of Image (EOI):   0xFF 0xD9
        let start = buffer.indexOf(Buffer.from([0xff, 0xd8]));
        let end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 1);

        // While complete JPEG frames exist in the buffer, extract and send them
        while (start !== -1 && end !== -1) {
            const jpeg = buffer.slice(start, end + 2);
            
            // Send multipart frame boundaries and the JPEG binary
            res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpeg.length}\r\n\r\n`);
            res.write(jpeg);
            res.write("\r\n");

            // Remove processed frame from buffer and look for the next one
            buffer = buffer.slice(end + 2);
            start = buffer.indexOf(Buffer.from([0xff, 0xd8]));
            end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 1);
        }
    });

    /*
    // OPTIONAL: Uncomment for debugging FFmpeg stream issues
    ffmpeg.stderr.on("data", (data) => {
        console.error("FFmpeg Error/Log:", data.toString());
    });
    */

    // Handle stream closure from the FFmpeg side
    ffmpeg.on("close", () => {
        res.end();
    });

    // Cleanly kill the FFmpeg process if the client (frontend) disconnects
    req.on("close", () => {
        if (ffmpeg && !ffmpeg.killed) {
            ffmpeg.kill();
        }
    }); 
});


// ==========================================
// 2. SERVER INITIALIZATION & LIFECYCLE
// ==========================================

app.listen(PORT, () => {
    console.log(`📡 HTTP Server Started: http://localhost:${PORT}/stream`);
});

// Shutdown route triggered by main.js during application exit
app.get("/shutdown", (req, res) => {
    if (ffmpeg && !ffmpeg.killed) {
        ffmpeg.kill("SIGTERM");
        console.log("FFmpeg process safely terminated via /shutdown.");
    }
    res.send("Shutting down server...");
    process.exit(0);
});
