(async function () {
    "use strict";

    /*
     * HaxBall Mobile - D-Pad Edition
     * Based on VixelDevelopment/HaxballMobile old.min.js
     *
     * Controls:
     *   ▲ = W
     *   ▼ = S
     *   ◀ = A
     *   ▶ = D
     *   KICK = X (original button is preserved)
     */

    const ORIGINAL_SCRIPT =
        "https://raw.githubusercontent.com/VixelDevelopment/HaxballMobile/main/old.min.js";

    // ------------------------------------------------------------
    // Load original HaxBall Mobile script
    // ------------------------------------------------------------

    try {
        const response = await fetch(ORIGINAL_SCRIPT);

        if (!response.ok) {
            throw new Error(
                "Tidak dapat mengambil old.min.js (" +
                response.status +
                ")"
            );
        }

        const originalCode = await response.text();

        const script = document.createElement("script");
        script.textContent = originalCode;

        document.documentElement.appendChild(script);
        script.remove();

    } catch (error) {
        console.error("HaxBall D-Pad:", error);

        alert(
            "HaxBall Mobile gagal dimuat.\n\n" +
            error.message
        );

        return;
    }

    // ------------------------------------------------------------
    // Wait until original controls exist
    // ------------------------------------------------------------

    function waitForControls(callback) {

        let attempts = 0;

        const timer = setInterval(function () {

            attempts++;

            const originalJoystick =
                document.querySelector("#joystick");

            const kick =
                document.querySelector("#kick");

            const gameFrame =
                document.querySelector(".gameframe");

            if (
                originalJoystick &&
                kick &&
                gameFrame &&
                gameFrame.contentWindow
            ) {
                clearInterval(timer);
                callback(
                    originalJoystick,
                    kick,
                    gameFrame.contentWindow
                );
            }

            // Stop after approximately 30 seconds
            if (attempts > 300) {
                clearInterval(timer);

                console.error(
                    "HaxBall D-Pad: controls tidak ditemukan."
                );
            }

        }, 100);
    }

    // ------------------------------------------------------------
    // Create D-Pad
    // ------------------------------------------------------------

    function createDPad(originalJoystick, kick, gameWindow) {

        // Don't create twice
        if (document.querySelector("#haxball-dpad")) {
            return;
        }

        // Hide the original analog joystick
        originalJoystick.style.display = "none";

        // --------------------------------------------------------
        // CSS
        // --------------------------------------------------------

        const style = document.createElement("style");

        style.id = "haxball-dpad-style";

        style.textContent = `
            #haxball-dpad {
                position: absolute;
                z-index: 99999;

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                grid-template-rows:
                    repeat(3, 1fr);

                gap: 4px;

                touch-action: none;
                user-select: none;
                -webkit-user-select: none;

                box-sizing: border-box;
            }

            .hbd-button {
                display: flex;

                justify-content: center;
                align-items: center;

                box-sizing: border-box;

                background: rgba(194,194,194,.33);

                border-radius: 18px;

                color: rgba(236,240,243,.85);

                font-size: 1.4rem;
                font-weight: bold;

                box-shadow:
                    6px 6px 10px rgba(165,171,177,.20),
                    -5px -5px 9px rgba(165,171,177,.20);

                touch-action: none;

                -webkit-tap-highlight-color:
                    transparent;
            }

            .hbd-button:active {
                transform: scale(.93);

                background:
                    rgba(194,194,194,.50);
            }

            #hbd-up {
                grid-column: 2;
                grid-row: 1;
            }

            #hbd-left {
                grid-column: 1;
                grid-row: 2;
            }

            #hbd-down {
                grid-column: 2;
                grid-row: 2;
            }

            #hbd-right {
                grid-column: 3;
                grid-row: 2;
            }
        `;

        document.head.appendChild(style);

        // --------------------------------------------------------
        // D-Pad container
        // --------------------------------------------------------

        const dpad = document.createElement("div");

        dpad.id = "haxball-dpad";

        dpad.setAttribute("view", "hidden");

        document.body.appendChild(dpad);

        // --------------------------------------------------------
        // Read original HaxBall Mobile settings
        // --------------------------------------------------------

        function getSettings() {

            let settings = [20, 5, 1];

            try {

                const saved =
                    JSON.parse(
                        localStorage.getItem("controls")
                    );

                if (
                    Array.isArray(saved) &&
                    saved.length >= 3
                ) {
                    settings = saved;
                }

            } catch {}

            return settings;
        }

        // --------------------------------------------------------
        // Position / size
        // --------------------------------------------------------

        function updateDPadStyle() {

            const settings = getSettings();

            const width = Number(settings[0]) || 20;
            const margin = Number(settings[1]) || 5;
            const opacity = Number(settings[2]) || 1;

            dpad.style.width =
                (width * 1.5) + "%";

            dpad.style.height =
                (width * 1.5) + "%";

            dpad.style.left =
                margin + "%";

            dpad.style.bottom =
                margin + "vw";

            dpad.style.opacity =
                opacity;
        }

        updateDPadStyle();

        // --------------------------------------------------------
        // Keyboard input
        // --------------------------------------------------------

        const pressed = new Set();

        function sendKey(code, type) {

            try {

                gameWindow.document.dispatchEvent(
                    new KeyboardEvent(type, {
                        code: code,
                        bubbles: true,
                        cancelable: true
                    })
                );

            } catch (error) {

                console.error(
                    "HaxBall D-Pad keyboard error:",
                    error
                );
            }
        }

        function updateKeys() {

            const keys = {
                w: "KeyW",
                a: "KeyA",
                s: "KeyS",
                d: "KeyD"
            };

            for (const key in keys) {

                const isPressed =
                    pressed.has(key);

                sendKey(
                    keys[key],
                    isPressed
                        ? "keydown"
                        : "keyup"
                );
            }
        }

        // --------------------------------------------------------
        // Button creation
        // --------------------------------------------------------

        function makeButton(
            id,
            symbol,
            key
        ) {

            const button =
                document.createElement("div");

            button.id = id;

            button.className =
                "hbd-button";

            button.textContent =
                symbol;

            function press(event) {

                event.preventDefault();
                event.stopPropagation();

                pressed.add(key);

                updateKeys();

                // Prevent the browser from scrolling
                if (
                    event.pointerId !== undefined &&
                    button.setPointerCapture
                ) {
                    try {
                        button.setPointerCapture(
                            event.pointerId
                        );
                    } catch {}
                }
            }

            function release(event) {

                event.preventDefault();
                event.stopPropagation();

                pressed.delete(key);

                updateKeys();
            }

            // Modern Android touch/pointer support
            button.addEventListener(
                "pointerdown",
                press,
                { passive: false }
            );

            button.addEventListener(
                "pointerup",
                release,
                { passive: false }
            );

            button.addEventListener(
                "pointercancel",
                release,
                { passive: false }
            );

            button.addEventListener(
                "pointerleave",
                release,
                { passive: false }
            );

            return button;
        }

        // --------------------------------------------------------
        // Add buttons
        // --------------------------------------------------------

        dpad.appendChild(
            makeButton(
                "hbd-up",
                "▲",
                "w"
            )
        );

        dpad.appendChild(
            makeButton(
                "hbd-left",
                "◀",
                "a"
            )
        );

        dpad.appendChild(
            makeButton(
                "hbd-down",
                "▼",
                "s"
            )
        );

        dpad.appendChild(
            makeButton(
                "hbd-right",
                "▶",
                "d"
            )
        );

        // --------------------------------------------------------
        // Show / hide depending on game state
        // --------------------------------------------------------

        function updateVisibility() {

            const original =
                document.querySelector("#joystick");

            const game =
                document.querySelector(
                    ".game-view"
                );

            const room =
                document.querySelector(
                    ".room-view"
                );

            if (
                game &&
                !room
            ) {

                dpad.style.display =
                    "grid";

                if (original) {
                    original.style.display =
                        "none";
                }

            } else {

                dpad.style.display =
                    "none";

                pressed.clear();

                updateKeys();
            }
        }

        updateVisibility();

        // --------------------------------------------------------
        // Watch HaxBall page changes
        // --------------------------------------------------------

        const observer =
            new MutationObserver(function () {

                updateVisibility();
                updateDPadStyle();

                const original =
                    document.querySelector(
                        "#joystick"
                    );

                if (original) {
                    original.style.display =
                        "none";
                }
            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        // --------------------------------------------------------
        // Reset when page loses focus
        // --------------------------------------------------------

        window.addEventListener(
            "blur",
            function () {

                pressed.clear();

                updateKeys();
            }
        );

        document.addEventListener(
            "visibilitychange",
            function () {

                if (document.hidden) {

                    pressed.clear();

                    updateKeys();
                }
            }
        );

        console.log(
            "%cHaxBall Mobile D-Pad loaded!",
            "color:#00ff88;font-weight:bold"
        );

    }

    // ------------------------------------------------------------
    // Start
    // ------------------------------------------------------------

    waitForControls(
        createDPad
    );

})();