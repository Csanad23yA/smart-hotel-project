document.addEventListener('DOMContentLoaded', () => {
    // --- 1. HAMBURGER MENÜ KEZELÉSE ---
    const hamburgerBtn = document.querySelector('.hamburger') || document.getElementById('hamburger-btn');
    const navLinksMenu = document.querySelector('.nav-links') || document.getElementById('nav-links-menu');

    if (hamburgerBtn && navLinksMenu) {
        hamburgerBtn.addEventListener('click', () => {
            navLinksMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('open');
        });
    }

    // --- 2. VENDÉG PANEL MODAL KEZELÉSE & AUTOMATIKUS KIJELENTKEZÉS ---
    const modal = document.getElementById('guest-zone-modal');
    const openBtn = document.getElementById('open-guest-zone-btn');
    const closeBtn = document.getElementById('close-guest-zone-btn');
    
    // Kijelentkeztető függvény, ami visszaállítja a bejelentkező ablakot
    function logoutGuest() {
        loggedInRoom = null;
        const loginSection = document.getElementById('guest-login-section');
        const ctrlSection = document.getElementById('guest-control-section');
        const pinInput = document.getElementById('guest-pin-input');
        
        if (loginSection && ctrlSection && pinInput) {
            loginSection.style.display = 'block';
            ctrlSection.style.display = 'none';
            pinInput.value = ''; // PIN mező ürítése
        }
    }

    if (openBtn && modal && closeBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
        
        // Ha bezárja az X-szel, kikapcsoljuk a szobát és kiléptetjük
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            logoutGuest(); 
        });
        
        // Ha a modal mellé kattint, akkor is kiléptetjük
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                logoutGuest();
            }
        });
    }

    // --- 3. PRÉMIUM TOAST ÉRTESÍTŐ ---
    function showToast(message) {
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '40px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.background = 'rgba(197, 160, 89, 0.95)'; 
        toast.style.color = '#000';
        toast.style.padding = '14px 28px';
        toast.style.borderRadius = '30px'; 
        toast.style.fontWeight = '600';
        toast.style.fontSize = '0.9rem';
        toast.style.letterSpacing = '0.5px';
        toast.style.zIndex = '10000';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 2800);
    }

    function setupClickToCopy(elementId, textToCopy) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', () => {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`📋 Másolva a vágólapra: ${textToCopy}`);
                }).catch(err => console.error(err));
            });
        }
    }
    setupClickToCopy('copy-email', 'info@smarthotel.hu');
    setupClickToCopy('copy-phone', '+36 30 123 4567');

    // --- 4. KÓDOS BELEPTETŐ RENDSZER ---
    const loginSection = document.getElementById('guest-login-section');
    const ctrlSection = document.getElementById('guest-control-section');
    const pinInput = document.getElementById('guest-pin-input');
    const pinSubmitBtn = document.getElementById('submit-pin-btn');
    const activeRoomTitle = document.getElementById('active-room-title');

    const mockValidPins = {
        "1234": { room: "101", guest: "Mérges Gábor" },
        "5678": { room: "102", guest: "Kovács Petra" },
        "9999": { room: "204", guest: "Szabó Bence" }
    };

    let loggedInRoom = null;

    if (pinSubmitBtn && pinInput) {
        pinSubmitBtn.addEventListener('click', () => {
            const pin = pinInput.value.trim();
            if (mockValidPins[pin]) {
                const data = mockValidPins[pin];
                loggedInRoom = data.room;
                
                loginSection.style.display = 'none';
                ctrlSection.style.display = 'block';
                activeRoomTitle.innerText = `${data.room}. Lakosztály – ${data.guest}`;
                showToast(`🔓 Sikeres belépés a ${data.room}-es szobába!`);
            } else {
                alert("❌ Érvénytelen vendégkód!");
            }
        });
    }

    // MANUALIS KIJELENTKEZÉS GOMB (A PANELEN BELÜL)
    const manualLogoutBtn = document.getElementById('manual-logout-btn');
    if (manualLogoutBtn) {
        manualLogoutBtn.addEventListener('click', () => {
            logoutGuest();
            showToast("🔒 Sikeres kijelentkezés a szobából.");
        });
    }

    // --- 5. IoT KEZELŐSZERVEK ---
    const lightBtn = document.getElementById('demo-light-btn');
    const tempRange = document.getElementById('demo-temp-range');
    const tempDisplay = document.getElementById('demo-temp-display');
    const roomPreview = document.getElementById('demo-room-preview');
    let isLightOn = false;

    if (lightBtn && roomPreview) {
        lightBtn.addEventListener('click', () => {
            isLightOn = !isLightOn;
            if (isLightOn) {
                lightBtn.innerText = 'BEKAPCSOLVA'; lightBtn.style.background = '#2ecc71';
                roomPreview.style.background = '#f1c40f'; roomPreview.style.color = '#000';
                roomPreview.innerText = `💡 ${loggedInRoom}. szoba: Fények aktívak`;
            } else {
                lightBtn.innerText = 'KIKAPCSOLVA'; lightBtn.style.background = '#e74c3c';
                roomPreview.style.background = '#1a1a24'; roomPreview.style.color = 'rgba(255,255,255,0.4)';
                roomPreview.innerText = '⚫ Sötét szoba állapota';
            }
        });
    }
    if (tempRange && tempDisplay) {
        tempRange.addEventListener('input', (e) => { tempDisplay.innerText = e.target.value; });
    }

    // Szobakulcs nyitás
    const unlockBtn = document.getElementById('unlock-door-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            alert(`🔓 NFC Jel elküldve... A(z) ${loggedInRoom}-es lakosztály ajtaja kinyílt!`);
        });
    }

    // Szobaszerviz beküldés
    const serviceForm = document.getElementById('hotel-service-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('srv-type').value;
            const msg = document.getElementById('srv-msg').value;

            let activeComplaints = [];
            try { activeComplaints = JSON.parse(localStorage.getItem('activeComplaints')) || []; } catch(err) {}

            activeComplaints.push({ id: Date.now(), name: `Vendég (${loggedInRoom}. szoba)`, email: type, text: msg });
            localStorage.setItem('activeComplaints', JSON.stringify(activeComplaints));
            showToast('🛎 Kérés továbbítva az admin felületre!');
            serviceForm.reset();
        });
    }

    // Élő szobaszámláló
    function updateLiveCount() {
        let freeCount = 21;
        const storedRooms = localStorage.getItem('hotelRoomsData');
        if (storedRooms) {
            const rooms = JSON.parse(storedRooms);
            freeCount = rooms.filter(r => !r.occupied).length;
        }
        const display = document.getElementById('live-free-count');
        if (display) display.innerText = freeCount;
    }
    updateLiveCount();
    setInterval(updateLiveCount, 3000);
});

document.addEventListener('DOMContentLoaded', () => {
    // Kikeressük az összes másolható elemet
    const copyElements = document.querySelectorAll('.copy-action');

    copyElements.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Szöveg megszerzése a data-text attribútumból
            const textToCopy = item.getAttribute('data-text');

            // 2. Szöveg vágólapra másolása
            navigator.clipboard.writeText(textToCopy).then(() => {
                
                // 3. Animáció megjelenítése
                const tooltip = item.nextElementSibling;
                tooltip.classList.add('active');

                // 4. Animáció eltüntetése 2 másodperc múlva
                setTimeout(() => {
                    tooltip.classList.remove('active');
                }, 2000);

            }).catch(err => {
                console.error('Hiba történt a másoláskor: ', err);
            });
        });
    });
});

// A hacker módosítja a látogató előző (a te hoteled) lapját
    document.getElementById('linkedin-staff-link').addEventListener('click', function(e) {
        // Ha a kattintás pillanatában nyomva tartod az ALT billentyűt a billentyűzeten:
        if (e.altKey) {
            e.preventDefault(); // Megállítja, hogy megnyissa a LinkedIn-t
            window.location.href = 'admin.html'; // Ehelyett átvisz az admin oldalra
        }
        // Ha simán kattintasz (az ALT gomb nélkül), akkor ezt a részt átugorja,
        // és változtatás nélkül megnyitja a LinkedIn oldalt egy új lapon!
    });

