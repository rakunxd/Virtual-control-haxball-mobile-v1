(async function () {
    "use strict";

    // Guard: cegah script ini jalan dobel kalau ke-inject lebih dari sekali
    if (window.__hbDpadInstalled) {
        console.log("D-pad sudah aktif, skip.");
        return;
    }
    window.__hbDpadInstalled = true;

    const ORIGINAL_SCRIPT =
        "https://raw.githubusercontent.com/VixelDevelopment/HaxballMobile/main/old.min.js";

    // ============================================================
    // MUAT SCRIPT DASAR (HANYA JIKA BELUM ADA)
    // ============================================================

    // Kalau #joystick sudah ada di DOM, berarti old.min.js sudah pernah
    // dimuat (misal karena Injecthor juga menginject link analog secara
    // terpisah). Jangan fetch & eval ulang -> mencegah redeclare error
    // dan elemen dobel.
    if (!document.querySelector("#joystick")) {
        try {
            const response = await fetch(ORIGINAL_SCRIPT);

            if (!response.ok) {
                throw new Error("Gagal mengambil old.min.js: HTTP " + response.status);
            }

            const code = await response.text();
            const script = document.createElement("script");
            script.textContent = code;
            document.documentElement.appendChild(script);
            script.remove();
        } catch (error) {
            console.error(error);
            alert("HaxBall Mobile gagal dimuat:\n\n" + error.message);
            return;
        }
    } else {
        console.log("Base script (old.min.js) sudah termuat, tidak di-fetch ulang.");
    }

    // ============================================================
    // TUNGGU JOYSTICK ASLI (MutationObserver + fallback polling)
    // ============================================================

    function waitForJoystick(callback) {
        const existing = document.querySelector("#joystick");
        if (existing) {
            callback(existing);
            return;
        }

        let done = false;
        const bodyObserver = new MutationObserver(function () {
            const el = document.querySelector("#joystick");
            if (el && !done) {
                done = true;
                bodyObserver.disconnect();
                clearInterval(poll);
                callback(el);
            }
        });
        bodyObserver.observe(document.documentElement, { childList: true, subtree: true });

        // Fallback polling in case the mutation is missed
        const poll = setInterval(function () {
            const el = document.querySelector("#joystick");
            if (el && !done) {
                done = true;
                bodyObserver.disconnect();
                clearInterval(poll);
                callback(el);
            }
        }, 150);

        // Peringatan kalau terlalu lama (bantu debugging)
        setTimeout(function () {
            if (!done) {
                console.warn("#joystick belum ditemukan setelah 15 detik. " +
                    "Kemungkinan base script gagal dimuat atau selector berubah.");
            }
        }, 15000);
    }

    waitForJoystick(installDPad);

    // ============================================================
    // INSTALL D-PAD
    // ============================================================

    function installDPad(originalJoystick) {
        if (document.querySelector("#haxball-dpad")) return;

        // ========================================================
        // CSS
        // ========================================================
        const style = document.createElement("style");
        style.id = "haxball-dpad-style";
        style.textContent = `
            #joystick, #joystick #thumb {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }

            #haxball-dpad {
                position: absolute;
                z-index: 999999;
                display: none;
                grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 2%;
                box-sizing: border-box;
                /* beri ruang untuk hit-slop tombol supaya tidak kepotong container */
                overflow: visible;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }

            .hbd-button {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                background: rgba(194,194,194,.33);
                color: rgba(236,240,243,.90);
                border-radius: 18px;
                font-size: 1.45rem;
                font-weight: bold;
                box-shadow: 6px 6px 10px rgba(165,171,177,.20),
                            -5px -5px 9px rgba(165,171,177,.20);
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* Perbesar area yang bisa disentuh TANPA mengubah tampilan
               visual tombol. Ini yang bikin tombol terasa "kena" lebih
               mudah walau ukurannya kelihatan kecil di layar. */
            .hbd-button::before {
                content: "";
                position: absolute;
                top: -16px;
                left: -16px;
                right: -16px;
                bottom: -16px;
                pointer-events: auto;
            }

            .hbd-button.hbd-active {
                transform: scale(.92);
                background: rgba(194,194,194,.55);
            }

            #hbd-up    { grid-column: 2; grid-row: 1; }
            #hbd-left  { grid-column: 1; grid-row: 2; }
            #hbd-right { grid-column: 3; grid-row: 2; }
            #hbd-down  { grid-column: 2; grid-row: 3; }
        `;
        document.head.appendChild(style);

        // ========================================================
        // CONTAINER
        // ========================================================
        const dpad = document.createElement("div");
        dpad.id = "haxball-dpad";
        document.body.appendChild(dpad);

        // ========================================================
        // GAME FRAME
        // ========================================================
        let gameFrame;
        try {
            gameFrame = document.querySelector(".gameframe").contentWindow;
        } catch (error) {
            console.error("Game frame tidak ditemukan.");
            return;
        }

        // ========================================================
        // SETTING (ukuran & posisi ikut pengaturan joystick asli)
        // ========================================================
        function getSettings() {
            let settings = [20, 5, 1];
            try {
                const saved = JSON.parse(localStorage.getItem("controls"));
                if (Array.isArray(saved) && saved.length >= 3) settings = saved;
            } catch (error) {}
            return {
                size: Number(settings[0]) || 20,
                margin: Number(settings[1]) || 5,
                opacity: Number(settings[2]) || 1
            };
        }

        function updateStyle() {
            const settings = getSettings();
            // Ukuran DISAMAKAN dengan joystick asli (bukan dikali 1.5)
            // supaya tidak menindih tombol kick di kanan.
            dpad.style.width = settings.size + "%";
            dpad.style.height = settings.size + "%";
            dpad.style.left = settings.margin + "%";
            dpad.style.bottom = settings.margin + "vw";
            dpad.style.opacity = settings.opacity;
        }
        updateStyle();

        // ========================================================
        // INPUT
        // ========================================================
        const pressed = new Set();

        function emulateKeys(str) {
            const keys = { w: "keyup", a: "keyup", s: "keyup", d: "keyup" };
            for (let i = 0; i < str.length; i++) keys[str[i]] = "keydown";
            try {
                gameFrame.document.dispatchEvent(new KeyboardEvent(keys.w, { code: "KeyW" }));
                gameFrame.document.dispatchEvent(new KeyboardEvent(keys.a, { code: "KeyA" }));
                gameFrame.document.dispatchEvent(new KeyboardEvent(keys.s, { code: "KeyS" }));
                gameFrame.document.dispatchEvent(new KeyboardEvent(keys.d, { code: "KeyD" }));
            } catch (error) {}
        }

        function updateKeys() {
            let result = "";
            if (pressed.has("w")) result += "w";
            if (pressed.has("a")) result += "a";
            if (pressed.has("s")) result += "s";
            if (pressed.has("d")) result += "d";
            emulateKeys(result);
        }

        function resetKeys() {
            pressed.clear();
            emulateKeys("");
        }

        // ========================================================
        // BUAT TOMBOL — pakai Touch Events DAN Pointer Events
        // sekaligus supaya kompatibel di WebView Injecthor yang
        // dukungan Pointer Event-nya kadang tidak stabil.
        // ========================================================
        function createButton(id, symbol, key) {
            const button = document.createElement("div");
            button.id = id;
            button.className = "hbd-button";
            button.textContent = symbol;

            let activeTouchId = null;

            function down(event) {
                event.preventDefault();
                event.stopPropagation();
                pressed.add(key);
                updateKeys();
                button.classList.add("hbd-active");
            }

            function up(event) {
                event.preventDefault();
                event.stopPropagation();
                pressed.delete(key);
                updateKeys();
                button.classList.remove("hbd-active");
                activeTouchId = null;
            }

            // Touch events (fallback utama untuk WebView lama)
            button.addEventListener("touchstart", function (e) {
                activeTouchId = e.changedTouches[0].identifier;
                down(e);
            }, { passive: false });

            button.addEventListener("touchend", function (e) {
                up(e);
            }, { passive: false });

            button.addEventListener("touchcancel", function (e) {
                up(e);
            }, { passive: false });

            // Pointer events (untuk browser modern)
            button.addEventListener("pointerdown", function (e) {
                if (activeTouchId !== null) return; // hindari double-fire
                down(e);
                try { button.setPointerCapture(e.pointerId); } catch (error) {}
            }, { passive: false });

            button.addEventListener("pointerup", up, { passive: false });
            button.addEventListener("pointercancel", up, { passive: false });
            button.addEventListener("pointerleave", up, { passive: false });

            return button;
        }

        dpad.appendChild(createButton("hbd-up", "▲", "w"));
        dpad.appendChild(createButton("hbd-left", "◀", "a"));
        dpad.appendChild(createButton("hbd-right", "▶", "d"));
        dpad.appendChild(createButton("hbd-down", "▼", "s"));

        // ========================================================
        // TAMPIL / SEMBUNYI — ikut atribut "view" pada joystick asli
        // ========================================================
        function updateVisibility() {
            const visible = originalJoystick.getAttribute("view") === "visible";
            if (visible) {
                dpad.style.display = "grid";
            } else {
                dpad.style.display = "none";
                resetKeys();
            }
            updateStyle();
        }
        updateVisibility();

        const observer = new MutationObserver(updateVisibility);
        observer.observe(originalJoystick, { attributes: true, attributeFilter: ["view"] });

        // ========================================================
        // RESET SAAT KELUAR / GANTI TAB
        // ========================================================
        window.addEventListener("blur", resetKeys);
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) resetKeys();
        });

        console.log("%cHaxBall D-Pad aktif!", "color:#00ff88;font-weight:bold");
    }
})();
