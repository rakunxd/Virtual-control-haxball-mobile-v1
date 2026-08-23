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
    // POSISI & UKURAN D-PAD (independen dari setting joystick/kick,
    // supaya ubah ini tidak ikut mengubah tombol kick di kanan)
    // Ganti angka ini kalau mau geser/perbesar D-pad-nya.
    // ============================================================
    const DPAD_WIDTH_PERCENT = 19;  // lebar, % dari lebar layar
    const DPAD_LEFT_PERCENT = 5;    // jarak dari kiri, % dari lebar layar
    const DPAD_BOTTOM_VW = 3;       // jarak dari bawah, dalam vw

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
                box-sizing: border-box;
                border-radius: 50%;
                background: rgba(194,194,194,.22);
                box-shadow: inset 0 0 0 2px rgba(255,255,255,.18);
                /* Kunci rasio 1:1. Hanya "width" yang di-set lewat JS,
                   "height" otomatis mengikuti supaya selalu persegi,
                   berapapun rasio layar HP-nya. */
                aspect-ratio: 1 / 1;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* Garis pembatas 8 sektor arah, cuma visual (dekoratif) */
            #haxball-dpad::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background:
                    linear-gradient(0deg,   transparent 49.3%, rgba(255,255,255,.15) 49.3%, rgba(255,255,255,.15) 50.7%, transparent 50.7%),
                    linear-gradient(90deg,  transparent 49.3%, rgba(255,255,255,.15) 49.3%, rgba(255,255,255,.15) 50.7%, transparent 50.7%),
                    linear-gradient(45deg,  transparent 49.3%, rgba(255,255,255,.12) 49.3%, rgba(255,255,255,.12) 50.7%, transparent 50.7%),
                    linear-gradient(135deg, transparent 49.3%, rgba(255,255,255,.12) 49.3%, rgba(255,255,255,.12) 50.7%, transparent 50.7%);
                pointer-events: none;
            }

            /* Knob yang digeser jari — posisinya diatur lewat JS (transform) */
            #haxball-dpad-knob {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 42%;
                height: 42%;
                margin-top: -21%;
                margin-left: -21%;
                border-radius: 50%;
                background: rgba(230,234,238,.75);
                box-shadow: 4px 4px 8px rgba(0,0,0,.18),
                            -3px -3px 6px rgba(255,255,255,.15);
                pointer-events: none;
                transition: background-color .08s ease;
            }

            #haxball-dpad-knob.hbd-active {
                background: rgba(255,255,255,.92);
            }
        `;
        document.head.appendChild(style);

        // ========================================================
        // CONTAINER
        // ========================================================
        const dpad = document.createElement("div");
        dpad.id = "haxball-dpad";
        document.body.appendChild(dpad);

        const knob = document.createElement("div");
        knob.id = "haxball-dpad-knob";
        dpad.appendChild(knob);

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
        // SETTING (opacity ikut pengaturan bersama, ukuran & posisi
        // pakai konstanta DPAD_* di atas supaya tidak ganggu kick)
        // ========================================================
        function getSettings() {
            let settings = [20, 5, 1];
            try {
                const saved = JSON.parse(localStorage.getItem("controls"));
                if (Array.isArray(saved) && saved.length >= 3) settings = saved;
            } catch (error) {}
            return {
                opacity: Number(settings[2]) || 1
            };
        }

        function updateStyle() {
            const settings = getSettings();
            // Height TIDAK di-set manual — biar aspect-ratio:1/1 di CSS
            // yang menjaga kotaknya selalu persegi.
            dpad.style.width = DPAD_WIDTH_PERCENT + "%";
            dpad.style.left = DPAD_LEFT_PERCENT + "%";
            dpad.style.bottom = DPAD_BOTTOM_VW + "vw";
            dpad.style.opacity = settings.opacity;
        }
        updateStyle();

        // ========================================================
        // INPUT — drag satu jari, arah di-snap ke 8 sektor 45°
        // (kombinasi WASD), knob mengikuti jari dengan halus supaya
        // tidak ada jeda "kaku" saat pindah arah seperti di tombol
        // terpisah, tapi tetap presisi/gampang seperti D-pad karena
        // toleransi tiap sektor lebar (45°), bukan derajat presisi
        // penuh seperti analog asli.
        // ========================================================
        const DEAD_ZONE_PERCENT = 0.16; // jari harus geser minimal segini (dari radius) biar kepencet arah
        const KNOB_MAX_PERCENT = 0.42;  // batas geser knob secara visual (biar gak keluar pad)

        // Urutan sektor 45°, mulai dari kanan (0°) searah jarum jam
        const SECTORS = [
            { angleDeg: 0, keys: "d" },
            { angleDeg: 45, keys: "sd" },
            { angleDeg: 90, keys: "s" },
            { angleDeg: 135, keys: "as" },
            { angleDeg: 180, keys: "a" },
            { angleDeg: 225, keys: "aw" },
            { angleDeg: 270, keys: "w" },
            { angleDeg: 315, keys: "wd" }
        ];

        let currentKeys = "";
        let activePointerId = null;
        let activeTouchId = null;

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

        function setKeys(str) {
            if (str === currentKeys) return; // cuma kirim event kalau memang berubah
            currentKeys = str;
            emulateKeys(str);
        }

        function resetKeys() {
            setKeys("");
            knob.style.transform = "translate(-50%, -50%)";
            knob.classList.remove("hbd-active");
        }
        // knob default posisi tengah (karena top/left:50% + margin negatif sudah menengahkan,
        // transform tambahan dipakai untuk pergeseran relatif dari titik tengah itu)
        knob.style.transform = "translate(-50%, -50%)";

        function handleMove(clientX, clientY) {
            const rect = dpad.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            const radius = rect.width / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Posisikan knob mengikuti jari, dibatasi supaya tidak keluar pad
            const maxKnobOffset = radius * (1 - KNOB_MAX_PERCENT * 0.55);
            const clampedDistance = Math.min(distance, maxKnobOffset);
            const angleRad = Math.atan2(dy, dx);
            const knobX = Math.cos(angleRad) * clampedDistance;
            const knobY = Math.sin(angleRad) * clampedDistance;
            knob.style.transform =
                "translate(calc(-50% + " + knobX + "px), calc(-50% + " + knobY + "px))";

            if (distance < radius * DEAD_ZONE_PERCENT) {
                setKeys("");
                knob.classList.remove("hbd-active");
                return;
            }

            knob.classList.add("hbd-active");

            // atan2 di layar: sumbu Y ke bawah positif, jadi 0deg = kanan,
            // 90deg = bawah — cocok langsung dengan urutan SECTORS di atas.
            let angleDeg = angleRad * (180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            // Cari sektor 45° terdekat (snap)
            const sectorIndex = Math.round(angleDeg / 45) % 8;
            setKeys(SECTORS[sectorIndex].keys);
        }

        function pointerDown(clientX, clientY) {
            handleMove(clientX, clientY);
        }

        // Touch events (fallback utama untuk WebView lama)
        dpad.addEventListener("touchstart", function (e) {
            e.preventDefault();
            if (activeTouchId !== null) return;
            const t = e.changedTouches[0];
            activeTouchId = t.identifier;
            pointerDown(t.clientX, t.clientY);
        }, { passive: false });

        dpad.addEventListener("touchmove", function (e) {
            e.preventDefault();
            for (const t of e.changedTouches) {
                if (t.identifier === activeTouchId) {
                    handleMove(t.clientX, t.clientY);
                }
            }
        }, { passive: false });

        function touchEnd(e) {
            for (const t of e.changedTouches) {
                if (t.identifier === activeTouchId) {
                    activeTouchId = null;
                    resetKeys();
                }
            }
        }
        dpad.addEventListener("touchend", touchEnd, { passive: false });
        dpad.addEventListener("touchcancel", touchEnd, { passive: false });

        // Pointer events (untuk browser modern)
        dpad.addEventListener("pointerdown", function (e) {
            if (activeTouchId !== null) return; // hindari double-fire kalau touch juga aktif
            e.preventDefault();
            activePointerId = e.pointerId;
            try { dpad.setPointerCapture(e.pointerId); } catch (error) {}
            pointerDown(e.clientX, e.clientY);
        }, { passive: false });

        dpad.addEventListener("pointermove", function (e) {
            if (e.pointerId !== activePointerId) return;
            handleMove(e.clientX, e.clientY);
        }, { passive: false });

        function pointerEnd(e) {
            if (e.pointerId !== activePointerId) return;
            activePointerId = null;
            resetKeys();
        }
        dpad.addEventListener("pointerup", pointerEnd, { passive: false });
        dpad.addEventListener("pointercancel", pointerEnd, { passive: false });

        // ========================================================
        // TAMPIL / SEMBUNYI — ikut atribut "view" pada joystick asli
        // ========================================================
        function updateVisibility() {
            const visible = originalJoystick.getAttribute("view") === "visible";
            if (visible) {
                dpad.style.display = "block";
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
