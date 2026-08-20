(async function () {
    "use strict";

    const ORIGINAL_SCRIPT =
        "https://raw.githubusercontent.com/VixelDevelopment/HaxballMobile/main/old.min.js";

    // ============================================================
    // LOAD OLD.MIN.JS
    // ============================================================

    try {
        const response = await fetch(ORIGINAL_SCRIPT);

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil old.min.js: HTTP " +
                response.status
            );
        }

        const code = await response.text();

        const script = document.createElement("script");
        script.textContent = code;

        document.documentElement.appendChild(script);
        script.remove();

    } catch (error) {
        console.error(
            "HaxBall D-Pad gagal:",
            error
        );

        alert(
            "HaxBall Mobile gagal dimuat.\n\n" +
            error.message
        );

        return;
    }


    // ============================================================
    // TUNGGU SAMPAI OLD.MIN.JS SELESAI MEMBUAT KONTROL
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

        // Jangan dibuat dua kali
        if (
            document.querySelector("#haxball-dpad")
        ) {
            return;
        }


        // ========================================================
        // GAME FRAME
        // ========================================================

        let gameFrame = null;

        try {

            gameFrame =
                document.querySelector(
                    ".gameframe"
                ).contentWindow;

        } catch (e) {

            console.error(
                "Game frame tidak ditemukan."
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

            #haxball-dpad {

                position: absolute;

                z-index: 9999;

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                grid-template-rows:
                    repeat(3, 1fr);

                gap: 4px;

                box-sizing: border-box;

                touch-action: none;

                user-select: none;

                -webkit-user-select: none;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .hbd-button {

                display: flex;

                justify-content: center;

                align-items: center;

                box-sizing: border-box;

                background:
                    rgba(194,194,194,.33);

                color:
                    rgba(236,240,243,.90);

                border-radius: 18%;

                font-size: 1.4rem;

                font-weight: bold;

                box-shadow:
                    6px 6px 10px
                    rgba(165,171,177,.20),

                    -5px -5px 9px
                    rgba(165,171,177,.20);

                touch-action: none;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .hbd-button:active {

                transform: scale(.92);

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


        // ========================================================
        // BUAT CONTAINER D-PAD
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
        // BACA SETTING KONTROL LAMA
        // Size / Margin / Opacity
        // ========================================================

        function getControlsSettings() {

            let values = [20, 5, 1];

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

                    values = saved;
                }

            } catch (e) {}

            return {

                size:
                    Number(values[0]) || 20,

                margin:
                    Number(values[1]) || 5,

                opacity:
                    Number(values[2]) || 1

            };
        }


        // ========================================================
        // POSISI D-PAD
        // ========================================================

        function updateDPadStyle() {

            const settings =
                getControlsSettings();


            // Sedikit lebih besar dari joystick lama
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
        // INPUT KEYBOARD HAXBALL
        // Menggunakan sistem yang sama dengan old.min.js
        // ========================================================

        const pressed =
            new Set();


        function sendKeyboard(
            code,
            type
        ) {

            try {

                gameFrame.document.dispatchEvent(

                    new KeyboardEvent(
                        type,
                        {
                            code: code,

                            bubbles: true,

                            cancelable: true
                        }
                    )

                );

            } catch (e) {}
        }


        function updateKeys() {

            const keyCodes = {

                w: "KeyW",

                a: "KeyA",

                s: "KeyS",

                d: "KeyD"

            };


            // Kirim status setiap tombol
            for (
                const key in keyCodes
            ) {

                if (
                    pressed.has(key)
                ) {

                    sendKeyboard(
                        keyCodes[key],
                        "keydown"
                    );

                } else {

                    sendKeyboard(
                        keyCodes[key],
                        "keyup"
                    );
                }
            }
        }


        // ========================================================
        // RESET
        // ========================================================

        function resetKeys() {

            pressed.clear();

            updateKeys();
        }


        // ========================================================
        // BUAT TOMBOL D-PAD
        // ========================================================

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


            function press(e) {

                e.preventDefault();

                e.stopPropagation();


                pressed.add(key);

                updateKeys();


                // Support multi-touch
                if (
                    e.pointerId !== undefined &&
                    button.setPointerCapture
                ) {

                    try {

                        button.setPointerCapture(
                            e.pointerId
                        );

                    } catch (error) {}
                }
            }


            function release(e) {

                e.preventDefault();

                e.stopPropagation();


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


        // ========================================================
        // IKUTI STATUS JOYSTICK ASLI
        // old.min.js menggunakan:
        // view="visible"
        // view="hidden"
        // ========================================================

        function updateVisibility() {

            const state =
                originalJoystick.getAttribute(
                    "view"
                );


            if (
                state === "visible"
            ) {

                dpad.setAttribute(
                    "view",
                    "visible"
                );

                dpad.style.display =
                    "grid";

            } else {

                dpad.setAttribute(
                    "view",
                    "hidden"
                );

                dpad.style.display =
                    "none";

                resetKeys();
            }
        }


        updateVisibility();


        // ========================================================
        // PANTAU PERUBAHAN VIEW DARI OLD.MIN.JS
        // ========================================================

        const observer =
            new MutationObserver(
                function () {

                    updateVisibility();

                    updateDPadStyle();

                }
            );


        observer.observe(
            originalJoystick,
            {
                attributes: true,

                attributeFilter: [
                    "view"
                ]
            }
        );


        // ========================================================
        // PANTAU LOCAL STORAGE
        // UNTUK SIZE / MARGIN / OPACITY
        // ========================================================

        window.addEventListener(
            "storage",
            function () {

                updateDPadStyle();

            }
        );


        // ========================================================
        // RESET SAAT HALAMAN KEHILANGAN FOCUS
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


        console.log(
            "%cHaxBall D-Pad berhasil dipasang!",
            "color:#00ff88;font-weight:bold"
        );

    }


    waitForControls();

})();
