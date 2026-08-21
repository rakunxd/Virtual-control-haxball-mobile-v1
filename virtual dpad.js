here(async function () {
    "use strict";

    const ORIGINAL_SCRIPT =
        "https://raw.githubusercontent.com/VixelDevelopment/HaxballMobile/main/old.min.js";

    // ============================================================
    // LOAD ORIGINAL HAXBALL MOBILE
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

        console.error(error);

        alert(
            "HaxBall Mobile gagal dimuat:\n\n" +
            error.message
        );

        return;
    }


    // ============================================================
    // TUNGGU JOYSTICK ASLI
    // ============================================================

    const wait = setInterval(function () {

        const joystick =
            document.querySelector("#joystick");

        if (!joystick) {
            return;
        }

        clearInterval(wait);

        installDPad(joystick);

    }, 100);


    // ============================================================
    // INSTALL D-PAD
    // ============================================================

    function installDPad(originalJoystick) {

        if (
            document.querySelector("#haxball-dpad")
        ) {
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

            /* ==============================================
               HILANGKAN JOYSTICK ANALOG
               ============================================== */

            #joystick {

                display: none !important;

                visibility: hidden !important;

                opacity: 0 !important;

                pointer-events: none !important;

                width: 0 !important;

                height: 0 !important;

                min-width: 0 !important;

                min-height: 0 !important;

                overflow: hidden !important;
            }


            #joystick #thumb {

                display: none !important;

                visibility: hidden !important;

                opacity: 0 !important;

                pointer-events: none !important;
            }


            /* ==============================================
               D-PAD
               ============================================== */

            #haxball-dpad {

                position: absolute;

                z-index: 999999;

                display: none;

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


            /* ==============================================
               TOMBOL
               ============================================== */

            .hbd-button {

                display: flex;

                align-items: center;

                justify-content: center;

                width: 100%;

                height: 100%;

                box-sizing: border-box;

                background:
                    rgba(194,194,194,.33);

                color:
                    rgba(236,240,243,.90);

                border-radius: 18px;

                font-size: 1.45rem;

                font-weight: bold;

                box-shadow:
                    6px 6px 10px
                    rgba(165,171,177,.20),

                    -5px -5px 9px
                    rgba(165,171,177,.20);

                touch-action: none;

                user-select: none;

                -webkit-user-select: none;

                -webkit-tap-highlight-color:
                    transparent;
            }


            .hbd-button:active {

                transform:
                    scale(.92);

                background:
                    rgba(194,194,194,.55);
            }


            /* ==============================================
               POSISI

                         ▲

                     ◀       ▶

                         ▼
               ============================================== */

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
        // CONTAINER
        // ========================================================

        const dpad =
            document.createElement("div");

        dpad.id =
            "haxball-dpad";

        document.body.appendChild(dpad);


        // ========================================================
        // GAME FRAME
        // ========================================================

        let gameFrame;

        try {

            gameFrame =
                document.querySelector(
                    ".gameframe"
                ).contentWindow;

        } catch (error) {

            console.error(
                "Game frame tidak ditemukan."
            );

            return;
        }


        // ========================================================
        // SETTING LAMA
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
        // UKURAN DAN POSISI
        // ========================================================

        function updateStyle() {

            const settings =
                getSettings();

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


        updateStyle();


        // ========================================================
        // INPUT
        // ========================================================

        const pressed =
            new Set();


        function emulateKeys(str) {

            const keys = {

                w: "keyup",

                a: "keyup",

                s: "keyup",

                d: "keyup"
            };


            for (
                let i = 0;
                i < str.length;
                i++
            ) {

                keys[str[i]] =
                    "keydown";
            }


            try {

                gameFrame.document.dispatchEvent(
                    new KeyboardEvent(
                        keys.w,
                        {
                            code: "KeyW"
                        }
                    )
                );


                gameFrame.document.dispatchEvent(
                    new KeyboardEvent(
                        keys.a,
                        {
                            code: "KeyA"
                        }
                    )
                );


                gameFrame.document.dispatchEvent(
                    new KeyboardEvent(
                        keys.s,
                        {
                            code: "KeyS"
                        }
                    )
                );


                gameFrame.document.dispatchEvent(
                    new KeyboardEvent(
                        keys.d,
                        {
                            code: "KeyD"
                        }
                    )
                );

            } catch (error) {}
        }


        function updateKeys() {

            let result = "";

            if (
                pressed.has("w")
            ) {
                result += "w";
            }

            if (
                pressed.has("a")
            ) {
                result += "a";
            }

            if (
                pressed.has("s")
            ) {
                result += "s";
            }

            if (
                pressed.has("d")
            ) {
                result += "d";
            }

            emulateKeys(result);
        }


        function resetKeys() {

            pressed.clear();

            emulateKeys("");
        }


        // ========================================================
        // BUAT TOMBOL
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


            function down(event) {

                event.preventDefault();

                event.stopPropagation();

                pressed.add(key);

                updateKeys();


                if (
                    event.pointerId !==
                        undefined
                ) {

                    try {

                        button.setPointerCapture(
                            event.pointerId
                        );

                    } catch (error) {}
                }
            }


            function up(event) {

                event.preventDefault();

                event.stopPropagation();

                pressed.delete(key);

                updateKeys();
            }


            button.addEventListener(
                "pointerdown",
                down,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointerup",
                up,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointercancel",
                up,
                {
                    passive: false
                }
            );


            button.addEventListener(
                "pointerleave",
                up,
                {
                    passive: false
                }
            );


            return button;
        }


        // ========================================================
        // 4 TOMBOL
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
        // TAMPIL / SEMBUNYI
        // ========================================================

        function updateVisibility() {

            /*
             * old.min.js sendiri menggunakan:
             *
             * view="visible"
             * view="hidden"
             *
             * untuk kontrol.
             */

            const visible =
                originalJoystick.getAttribute(
                    "view"
                ) === "visible";


            if (visible) {

                dpad.style.display =
                    "grid";

            } else {

                dpad.style.display =
                    "none";

                resetKeys();
            }


            updateStyle();
        }


        updateVisibility();


        // ========================================================
        // PANTAU PERUBAHAN OLD.MIN.JS
        // ========================================================

        const observer =
            new MutationObserver(
                function () {

                    updateVisibility();

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
        // PAKSA ANALOG TETAP HILANG
        // ========================================================

        setInterval(function () {

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

        }, 100);


        // ========================================================
        // RESET SAAT KELUAR
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
            "%cHaxBall D-Pad aktif!",
            "color:#00ff88;font-weight:bold"
        );
    }

})();
