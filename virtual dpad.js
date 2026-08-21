here(async function () {
    "use strict";

    const ORIGINAL_SCRIPT =
        "https://raw.githubusercontent.com/VixelDevelopment/HaxballMobile/main/old.min.js";

    // ============================================================
    // LOAD HAXBALL MOBILE ORIGINAL
    // ============================================================

    try {
        const response = await fetch(ORIGINAL_SCRIPT);

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil old.min.js: HTTP " +
                response.status
            );
        }

        const originalCode = await response.text();

        const originalScript =
            document.createElement("script");

        originalScript.textContent = originalCode;

        document.documentElement.appendChild(
            originalScript
        );

        originalScript.remove();

    } catch (error) {

        console.error(
            "HaxBall D-Pad:",
            error
        );

        alert(
            "HaxBall Mobile gagal dimuat.\n\n" +
            error.message
        );

        return;
    }


    // ============================================================
    // TUNGGU KONTROL ASLI
    // ============================================================

    function waitForControls() {

        const timer = setInterval(function () {

            const joystick =
                document.querySelector("#joystick");

            const kick =
                document.querySelector("#kick");

            if (joystick && kick) {

                clearInterval(timer);

                createDPad(
                    joystick,
                    kick
                );
            }

        }, 100);
    }


    // ============================================================
    // BUAT D-PAD
    // ============================================================

    function createDPad(
        originalJoystick,
        kickButton
    ) {

        if (
            document.querySelector("#haxball-dpad")
        ) {
            return;
        }


        // ========================================================
        // CARI GAME FRAME
        // ========================================================

        let gameFrame;

        try {

            const frame =
                document.querySelector(
                    ".gameframe"
                );

            if (!frame) {
                throw new Error(
                    "gameframe tidak ditemukan"
                );
            }

            gameFrame =
                frame.contentWindow;

        } catch (error) {

            console.error(
                "HaxBall D-Pad:",
                error
            );

            return;
        }


        // ========================================================
        // CSS
        // ========================================================

        const style =
            document.createElement("style");

        style.id =
            "haxball-dpad-style";

        style.textContent = `

            /* ===================================================
               HILANGKAN JOYSTICK ANALOG ASLI
               =================================================== */

            #joystick {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;

                pointer-events: none !important;

                width: 0 !important;
                height: 0 !important;

                min-width: 0 !important;
                min-height: 0 !important;

                max-width: 0 !important;
                max-height: 0 !important;

                overflow: hidden !important;

                transform: scale(0) !important;
            }


            #joystick #thumb {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;

                pointer-events: none !important;

                width: 0 !important;
                height: 0 !important;
            }


            /* ===================================================
               D-PAD
               =================================================== */

            #haxball-dpad {

                position: absolute;

                z-index: 99999;

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                grid-template-rows:
                    repeat(3, 1fr);

                gap: 8px;

                box-sizing: border-box;

                touch-action: none;

                user-select: none;

                -webkit-user-select: none;

                -webkit-touch-callout: none;

                -webkit-tap-highlight-color:
                    transparent;
            }


            /* ===================================================
               TOMBOL
               =================================================== */

            .hbd-button {

                display: flex;

                justify-content: center;

                align-items: center;

                box-sizing: border-box;

                width: 100%;
                height: 100%;

                background:
                    rgba(194,194,194,0.33);

                color:
                    rgba(236,240,243,0.90);

                border-radius: 18px;

                font-size: 1.45rem;

                font-weight: bold;

                box-shadow:
                    6px 6px 10px
                    rgba(165,171,177,0.20),

                    -5px -5px 9px
                    rgba(165,171,177,0.20);

                touch-action: none;

                user-select: none;

                -webkit-user-select: none;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .hbd-button:active {

                transform:
                    scale(0.92);

                background:
                    rgba(194,194,194,0.55);
            }


            /* ===================================================
               POSISI D-PAD

                       ▲

                   ◀       ▶

                       ▼
               =================================================== */

            #hbd-up {

                grid-column: 2;

                grid-row: 1;
            }


            #hbd-left {

                grid-column: 1;

                grid-row: 2;
            }


            #hbd-right {

                grid-column: 3;

                grid-row: 2;
            }


            #hbd-down {

                grid-column: 2;

                grid-row: 3;
            }

        `;

        document.head.appendChild(style);


        // ========================================================
        // CONTAINER D-PAD
        // ========================================================

        const dpad =
            document.createElement("div");

        dpad.id =
            "haxball-dpad";

        dpad.setAttribute(
            "view",
            "hidden"
        );

        document.body.appendChild(dpad);


        // ========================================================
        // SETTING KONTROL
        // ========================================================

        function getSettings() {

            let settings = [
                20,
                5,
                1
            ];

            try {

                const saved =
                    JSON.parse(
                        localStorage.getItem(
                            "controls"
                        )
                    );

                if (
                    Array.isArray(saved) &&
                    saved.length >= 3
                ) {

                    settings = saved;
                }

            } catch (error) {}

            return {

                size:
                    Number(settings[0]) || 20,

                margin:
                    Number(settings[1]) || 5,

                opacity:
                    Number(settings[2]) || 1
            };
        }


        // ========================================================
        // POSISI D-PAD
        // ========================================================

        function updateDPadStyle() {

            const settings =
                getSettings();

            /*
             * 1.5x ukuran joystick lama
             * agar tombol tetap mudah ditekan.
             */

            const size =
                settings.size * 1.5;

            dpad.style.width =
                size + "%";

            dpad.style.height =
                size + "%";

            dpad.style.left =
                settings.margin + "%";

            dpad.style.bottom =
                settings.margin + "vw";

            dpad.style.opacity =
                settings.opacity;
        }


        updateDPadStyle();


        // ========================================================
        // INPUT HAXBALL
        // ========================================================

        const pressed =
            new Set();


        function sendKey(
            code,
            type
        ) {

            try {

                gameFrame.document.dispatchEvent(

                    new KeyboardEvent(
                        type,
                        {
                            key:
                                code === "KeyW"
                                    ? "w"
                                    : code === "KeyA"
                                    ? "a"
                                    : code === "KeyS"
                                    ? "s"
                                    : "d",

                            code: code,

                            bubbles: true,

                            cancelable: true
                        }
                    )
                );

            } catch (error) {}
        }


        function updateKeys() {

            const keyCodes = {

                w: "KeyW",

                a: "KeyA",

                s: "KeyS",

                d: "KeyD"
            };


            for (
                const key in keyCodes
            ) {

                const code =
                    keyCodes[key];

                if (
                    pressed.has(key)
                ) {

                    sendKey(
                        code,
                        "keydown"
                    );

                } else {

                    sendKey(
                        code,
                        "keyup"
                    );
                }
            }
        }


        // ========================================================
        // RESET INPUT
        // ========================================================

        function resetKeys() {

            pressed.clear();

            updateKeys();
        }


        // ========================================================
        // BUAT TOMBOL D-PAD
        // ========================================================

        function createButton(
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


                /*
                 * Menjaga tombol tetap aktif
                 * ketika jari masih menyentuhnya.
                 */

                if (
                    event.pointerId !==
                        undefined &&
                    button.setPointerCapture
                ) {

                    try {

                        button.setPointerCapture(
                            event.pointerId
                        );

                    } catch (error) {}
                }
            }


            function release(event) {

                event.preventDefault();

                event.stopPropagation();

                pressed.delete(key);

                updateKeys();
            }


            button.addEventListener(
                "pointerdown",
                press,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointerup",
                release,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointercancel",
                release,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointerleave",
                release,
                {
                    passive: false
                }
            );


            return button;
        }


        // ========================================================
        // MASUKKAN 4 TOMBOL
        // ========================================================

        dpad.appendChild(

            createButton(
                "hbd-up",
                "▲",
                "w"
            )
        );


        dpad.appendChild(

            createButton(
                "hbd-left",
                "◀",
                "a"
            )
        );


        dpad.appendChild(

            createButton(
                "hbd-right",
                "▶",
                "d"
            )
        );


        dpad.appendChild(

            createButton(
                "hbd-down",
                "▼",
                "s"
            )
        );


        // ========================================================
        // SINKRONISASI DENGAN OLD.MIN.JS
        // ========================================================

        function updateVisibility() {

            /*
             * Joystick asli tetap dipakai sebagai
             * indikator kapan kontrol harus aktif,
             * tetapi tidak boleh terlihat.
             */

            originalJoystick.style.setProperty(
                "display",
                "none",
                "important"
            );

            originalJoystick.style.setProperty(
                "visibility",
                "hidden",
                "important"
            );

            originalJoystick.style.setProperty(
                "opacity",
                "0",
                "important"
            );

            originalJoystick.style.setProperty(
                "pointer-events",
                "none",
                "important"
            );


            const state =
                originalJoystick.getAttribute(
                    "view"
                );


            if (
                state === "visible"
            ) {

                dpad.style.display =
                    "grid";

                dpad.setAttribute(
                    "view",
                    "visible"
                );

            } else {

                dpad.style.display =
                    "none";

                dpad.setAttribute(
                    "view",
                    "hidden"
                );

                resetKeys();
            }
        }


        updateVisibility();


        // ========================================================
        // PANTAU JOYSTICK LAMA
        // ========================================================

        const observer =
            new MutationObserver(
                function () {

                    /*
                     * Paksa analog tetap hilang
                     */

                    originalJoystick.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );

                    originalJoystick.style.setProperty(
                        "visibility",
                        "hidden",
                        "important"
                    );

                    originalJoystick.style.setProperty(
                        "opacity",
                        "0",
                        "important"
                    );

                    originalJoystick.style.setProperty(
                        "pointer-events",
                        "none",
                        "important"
                    );


                    updateVisibility();

                    updateDPadStyle();
                }
            );


        observer.observe(
            originalJoystick,
            {
                attributes: true,

                attributeFilter: [
                    "view",
                    "style",
                    "class"
                ]
            }
        );


        // ========================================================
        // RESET SAAT KELUAR DARI GAME
        // ========================================================

        window.addEventListener(
            "blur",
            resetKeys
        );


        document.addEventListener(
            "visibilitychange",
            function () {

                if (
                    document.hidden
                ) {

                    resetKeys();
                }
            }
        );


        // ========================================================
        // SELESAI
        // ========================================================

        console.log(
            "%cHaxBall Mobile D-Pad aktif!",
            "color:#00ff88;font-weight:bold"
        );
    }


    // ============================================================
    // START
    // ============================================================

    waitForControls();

})();
