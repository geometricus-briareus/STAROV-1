/**
 * RENDERER.JS
 * Handles the frontend UI logic, Gamepad API interactions, 
 * and visual updates based on data received from the main process.
 */

// ==========================================
// 1. DOM ELEMENT SELECTORS
// ==========================================

// Network connection elements
const ip_form = document.getElementById("ip_form");
const ip_input = document.getElementById("ip_input");
const ip_connect = document.getElementById("ip_connect");
const ip_disconnect = document.getElementById("ip_disconnect");

// Developer options elements
const showRawDataCheckbox = document.getElementById("show-raw-data");
const logToConsoleCheckbox = document.getElementById("log-to-console");
const rawDataContent = document.getElementById("raw-data-content");
const rawDataContainer = document.getElementById("raw-data-container");

// Gamepad UI - Joysticks & Triggers
const leftJoystickDot = document.getElementById("left-joystick-dot");
const rightJoystickDot = document.getElementById("right-joystick-dot");
const leftTriggerBar = document.getElementById("left-trigger-bar");
const rightTriggerBar = document.getElementById("right-trigger-bar");
const leftTriggerValue = document.getElementById("left-trigger-value");
const rightTriggerValue = document.getElementById("right-trigger-value");

// Gamepad UI - Axis values
const leftXValue = document.getElementById("left-x-value");
const leftYValue = document.getElementById("left-y-value");
const rightXValue = document.getElementById("right-x-value");
const rightYValue = document.getElementById("right-y-value");

// Gamepad UI - Action Buttons
const buttonA = document.querySelector(".a_btn");
const buttonB = document.querySelector(".b_btn");
const buttonX = document.querySelector(".x_btn");
const buttonY = document.querySelector(".y_btn");

// Gamepad UI - D-Pad
const dpadUp = document.getElementById("dpad-up");
const dpadDown = document.getElementById("dpad-down");
const dpadLeft = document.getElementById("dpad-left");
const dpadRight = document.getElementById("dpad-right");

// Map of button indices to UI elements
const buttonMap = {
    0: buttonA,    // A button
    1: buttonB,    // B button
    2: buttonX,    // X button
    3: buttonY,    // Y button
    12: dpadUp,    // D-pad Up
    13: dpadDown,  // D-pad Down
    14: dpadLeft,  // D-pad Left
    15: dpadRight  // D-pad Right
};


// ==========================================
// 2. NETWORK & UI HANDLERS
// ==========================================

// Handles the visibility of the raw data section
function updateRawDataVisibility() {
    if (this.checked) {
        rawDataContainer.classList.add("visible");
    } else {
        rawDataContainer.classList.remove("visible");
    }
}

// Initialize raw data visibility state and listen for changes
updateRawDataVisibility.call(showRawDataCheckbox);
showRawDataCheckbox.addEventListener("change", updateRawDataVisibility);

// Fullscreen Toggle
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    window.electronAPI.toggleFullscreen(); // Calls function from preload.js
});

// IP Connection Handling
ip_form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    window.electron.ipc.send_ip_connect(ip_input.value); 

    // Security Note: Direct IPC call disabled here to prevent unsafe execution.
    // electron.ipc.send_ip_connect(ip_input.value); 
});

electron.ipc.on_ip_connect((result) => {
    if (result) {
        console.log("Connected");
        // ip_input.disabled = true;
        // ip_connect.disabled = true;
    } else {
        alert("Device Is Not Found\nCheck the IP address and Cable Connections.");
    }
});


// ==========================================
// 3. GAMEPAD API LOGIC
// ==========================================

let gamepad_index = null;
let isGamepadConnected = false;
const gamepad_status = document.getElementById("gamepad_status");

// Listen for Gamepad Connection
window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    gamepad_index = gamepad.index;
    isGamepadConnected = true;
    
    console.log("Gamepad Connected", gamepad);
    gamepad_status.innerText = `Gamepad: ${gamepad.id}`;
    
    const gamepadButtonsInfo = document.getElementById("gamepad-buttons-info");
    gamepadButtonsInfo.innerHTML = `
        <div>Bağlı: ${gamepad.id}</div>
        <div>Butonlar: ${gamepad.buttons.length}</div>
        <div>Eksenler: ${gamepad.axes.length}</div>
    `;
});

// Listen for Gamepad Disconnection
window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Gamepad Disconnected");
    gamepad_status.innerText = "Gamepad: Disconnected";
    gamepad_index = null;
    isGamepadConnected = false;
    
    document.getElementById("gamepad-buttons-info").innerHTML = "<div>Gamepad bağlı değil</div>";
    rawDataContent.textContent = "Gamepad bağlı değil";
    
    resetUIElements();
});

/**
 * Main hardware polling loop.
 * Runs at ~60fps via requestAnimationFrame to constantly read Gamepad states.
 */
function loop() {
    const gamepads = navigator.getGamepads();
    
    // Fallback: Check if gamepad disconnected without firing event
    if (gamepad_index !== null && (!gamepads[gamepad_index] || !gamepads[gamepad_index].connected)) {
        console.log("Gamepad disconnected but event not fired, resetting state");
        gamepad_index = null;
        isGamepadConnected = false;
        gamepad_status.innerText = "Gamepad: Disconnected";
        resetUIElements();
    }
    
    // Fallback: Check if gamepad connected without firing event
    if (gamepad_index === null) {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
                console.log("Found connected gamepad but event not fired, setting index", gamepads[i]);
                gamepad_index = i;
                isGamepadConnected = true;
                gamepad_status.innerText = `Gamepad: ${gamepads[i].id}`;
                
                document.getElementById("gamepad-buttons-info").innerHTML = `
                    <div>Bağlı: ${gamepads[i].id}</div>
                    <div>Butonlar: ${gamepads[i].buttons.length}</div>
                    <div>Eksenler: ${gamepads[i].axes.length}</div>
                `;
                break;
            }
        }
    }
    
    if (gamepad_index !== null && isGamepadConnected) {
        const gamepad = navigator.getGamepads()[gamepad_index];
        
        if (gamepad && gamepad.connected) {
            let LX = Math.floor(gamepad.axes[0] * 100);
            let LY = Math.floor(gamepad.axes[1] * 100);
            let RX = Math.floor(gamepad.axes[2] * 100);
            let RY = Math.floor(gamepad.axes[3] * 100);
            let BUT1 = 0;
            let BUT2 = 0;

            // Trigger values (Xbox controller: LT is 6, RT is 7)
            const leftTriggerVal = gamepad.buttons[6] ? Math.floor(gamepad.buttons[6].value * 100) : 0;
            const rightTriggerVal = gamepad.buttons[7] ? Math.floor(gamepad.buttons[7].value * 100) : 0;

            updateTriggerBar(leftTriggerBar, leftTriggerValue, leftTriggerVal);
            updateTriggerBar(rightTriggerBar, rightTriggerValue, rightTriggerVal);

            let buttonStates = [];
            
            // First 8 buttons
            for (let i = 0; i < 8; i++) {
                if (i < gamepad.buttons.length) {
                    BUT1 = BUT1 | (gamepad.buttons[i].pressed << i);
                    
                    if (buttonMap[i]) {
                        if (gamepad.buttons[i].pressed) buttonMap[i].classList.add("active");
                        else buttonMap[i].classList.remove("active");
                    }
                    
                    buttonStates.push({ index: i, pressed: gamepad.buttons[i].pressed, value: gamepad.buttons[i].value });
                }
            }
            
            // Next 8 buttons (D-Pad, etc.)
            for (let i = 8; i < 16; i++) {
                if (i < gamepad.buttons.length) {
                    BUT2 = BUT2 | (gamepad.buttons[i].pressed << (i - 8));
                    
                    if (buttonMap[i]) {
                        if (gamepad.buttons[i].pressed) buttonMap[i].classList.add("active");
                        else buttonMap[i].classList.remove("active");
                    }
                    
                    buttonStates.push({ index: i, pressed: gamepad.buttons[i].pressed, value: gamepad.buttons[i].value });
                }
            }

            // Send processed telemetry back to main process
            window.electron.ipc.send_gamepad_info([LX, -1 * LY, RX, -1 * RY, BUT1 | (BUT2 << 8)]);

            if (logToConsoleCheckbox.checked) {
                console.log(`BUT1: ${BUT1}\nBUT2: ${BUT2}`);
            }

            // Update physical UI representations
            updateJoystickDot(leftJoystickDot, LX, LY);
            updateJoystickDot(rightJoystickDot, RX, RY);
            
            leftXValue.textContent = LX;
            leftYValue.textContent = LY;
            rightXValue.textContent = RX;
            rightYValue.textContent = RY;
            
            updateButtonDisplay(BUT1, BUT2, buttonStates);
            updateRawDataDisplay(gamepad);
        }
    }

    sendGamepadData();
    requestAnimationFrame(loop);
}

// Failsafe full data transmission
function sendGamepadData() {
    if (gamepad_index === null) return;

    const gamepad = navigator.getGamepads()[gamepad_index];
    if (!gamepad) return;

    const gamepadData = {
        axes: gamepad.axes,
        buttons: gamepad.buttons
    };

    window.electron.ipc.send_gamepad_info(gamepadData);
}


// ==========================================
// 4. UI UPDATE FUNCTIONS
// ==========================================

function resetUIElements() {
    leftJoystickDot.style.left = "50%";
    leftJoystickDot.style.top = "50%";
    rightJoystickDot.style.left = "50%";
    rightJoystickDot.style.top = "50%";
    
    leftTriggerBar.style.width = "0%";
    rightTriggerBar.style.width = "0%";
    leftTriggerValue.textContent = "0";
    rightTriggerValue.textContent = "0";
    
    leftXValue.textContent = "0";
    leftYValue.textContent = "0";
    rightXValue.textContent = "0";
    rightYValue.textContent = "0";
    
    buttonA.classList.remove("active");
    buttonB.classList.remove("active");
    buttonX.classList.remove("active");
    buttonY.classList.remove("active");
    
    dpadUp.classList.remove("active");
    dpadDown.classList.remove("active");
    dpadLeft.classList.remove("active");
    dpadRight.classList.remove("active");
    
    const buttonDisplay = document.getElementById("button_display");
    if (buttonDisplay) {
        buttonDisplay.innerHTML = `
            <div class="button-values">
                <div>Butonlar 1-8: 00000000</div>
                <div>Butonlar 9-16: 00000000</div>
            </div>
        `;
    }
}

function updateRawDataDisplay(gamepad) {
    if (!showRawDataCheckbox.checked) return;
    
    let rawDataText = `Gamepad ID: ${gamepad.id}\nTimestamp: ${gamepad.timestamp}\n\nAXES:\n`;
    
    gamepad.axes.forEach((axis, index) => {
        rawDataText += `Axis ${index}: ${axis.toFixed(4)}\n`;
    });
    
    rawDataText += "\nBUTTONS:\n";
    gamepad.buttons.forEach((button, index) => {
        rawDataText += `Button ${index}: pressed=${button.pressed}, value=${button.value.toFixed(4)}\n`;
    });
    
    rawDataText += `\nMapping: ${gamepad.mapping}\nConnected: ${gamepad.connected}\n`;
    rawDataContent.textContent = rawDataText;
}

function updateTriggerBar(barElement, valueElement, value) {
    barElement.style.width = `${value}%`;
    valueElement.textContent = value;
}

function updateJoystickDot(dotElement, xValue, yValue) {
    // Convert -100 to 100 range to percentage (0-100%)
    const xPercent = ((xValue / 100) * 40) + 50; 
    const yPercent = ((yValue / 100) * 40) + 50; 
    
    dotElement.style.left = `${xPercent}%`;
    dotElement.style.top = `${yPercent}%`;
}

function updateButtonDisplay(but1, but2, buttonStates) {
    let buttonDisplay = document.getElementById("button_display");
    if (!buttonDisplay) {
        buttonDisplay = document.createElement("div");
        buttonDisplay.id = "button_display";
        document.getElementById("gamepad_div").appendChild(buttonDisplay);
    }
    
    buttonDisplay.innerHTML = `
        <div class="button-values">
            <div>Butonlar 1-8: ${but1.toString(2).padStart(8, '0')}</div>
            <div>Butonlar 9-16: ${but2.toString(2).padStart(8, '0')}</div>
        </div>
    `;
    
    if (buttonStates && buttonStates.length > 0) {
        const gamepadButtonsInfo = document.getElementById("gamepad-buttons-info");
        let pressedButtons = buttonStates.filter(b => b.pressed).map(b => b.index);
        
        let infoHTML = `
            <div>Aktif Butonlar: ${pressedButtons.length > 0 ? pressedButtons.join(', ') : 'Yok'}</div>
            <div class="button-states">`;
            
        // First 8 buttons
        infoHTML += '<div class="button-row">';
        for (let i = 0; i < Math.min(8, buttonStates.length); i++) {
            infoHTML += `<div class="button-indicator ${buttonStates[i].pressed ? 'active' : ''}">${i}</div>`;
        }
        infoHTML += '</div>';
        
        // Next 8 buttons
        if (buttonStates.length > 8) {
            infoHTML += '<div class="button-row">';
            for (let i = 8; i < Math.min(16, buttonStates.length); i++) {
                infoHTML += `<div class="button-indicator ${buttonStates[i].pressed ? 'active' : ''}">${i}</div>`;
            }
            infoHTML += '</div>';
        }
        
        infoHTML += '</div>';
        gamepadButtonsInfo.innerHTML = infoHTML;
    }
}


// ==========================================
// 5. IPC TELEMETRY LISTENERS & INIT
// ==========================================

// Initialize UI to default state on page load
resetUIElements();

// Start the hardware polling loop
loop();

// Update UI on IMU Data reception
window.electron.imu.onData(({ roll, pitch, yaw, ax, ay, az }) => {
    // Roll / Pitch / Yaw Mapping
    ['roll', 'pitch', 'yaw'].forEach((key) => {
        const angle = { roll, pitch, yaw }[key];
        const el = document.getElementById(`${key}_value`);
        if (el) {
            el.textContent = `${angle.toFixed(1)}°`;
            el.style.width = `${((angle + 180) / 360) * 100}%`;
        }
    });

    // Acceleration X / Y / Z Mapping
    [['x', ax], ['y', ay], ['z', az]].forEach(([axis, val]) => {
        const el = document.getElementById(`accel_${axis}_value`);
        if (el) {
            el.textContent = `${val.toFixed(2)} m/s²`;
            el.style.width = `${Math.min(Math.abs(val) * 10, 100)}%`;
        }
    });
});