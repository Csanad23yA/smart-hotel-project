    document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('guest-login-section');
    const ctrlSection = document.getElementById('guest-control-section');
    const pinInput = document.getElementById('guest-pin-input');
    const pinSubmitBtn = document.getElementById('submit-pin-btn');
    const activeRoomTitle = document.getElementById('active-room-title');
    const manualLogoutBtn = document.getElementById('manual-logout-btn');
    const expressCheckoutBtn = document.getElementById('express-checkout-btn');
    const balanceDisplay = document.getElementById('checkout-balance-display');

    const lightBtn = document.getElementById('demo-light-btn');
    const tempRange = document.getElementById('demo-temp-range');
    const tempDisplay = document.getElementById('demo-temp-display');
    const roomPreview = document.getElementById('demo-room-preview');

    let currentPin = null; 
    let loggedInRoom = null;

    // Élő számlaegyenleg felület frissítése
    function updateBalanceUI() {
        if (loggedInRoom) {
            const balances = JSON.parse(localStorage.getItem('roomBalances')) || {};
            balanceDisplay.innerText = (balances[loggedInRoom] || 0).toLocaleString('hu-HU');
        }
    }

    // IoT Felület állapotainak szinkronizálása a háttértárral
    function syncIoTUI(roomObj) {
        if (!roomObj) return;

        // Lámpa állapota
        if (roomObj.light) {
            lightBtn.innerText = 'BEKAPCSOLVA';
            lightBtn.style.background = '#2ecc71';
            roomPreview.style.background = '#f1c40f';
            roomPreview.style.color = '#000';
            roomPreview.innerText = `💡 Fények aktívak a ${roomObj.room}. szobában`;
        } else {
            lightBtn.innerText = 'KIKAPCSOLVA';
            lightBtn.style.background = '#e74c3c';
            roomPreview.style.background = '#1a1a24';
            roomPreview.style.color = 'rgba(255,255,255,0.4)';
            roomPreview.innerText = '⚫ Sötét szoba állapota';
        }

        // Klíma állapota
        tempRange.value = roomObj.temp;
        tempDisplay.innerText = roomObj.temp;
    }

    // LÁTOGATÓI BELÉPÉS ELLENŐRZÉSE
    if (pinSubmitBtn && pinInput) {
        pinSubmitBtn.addEventListener('click', () => {
            const pin = pinInput.value.trim();
            const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));

            if (roomsState && roomsState[pin]) {
                if (roomsState[pin].status === "LAKATLAN") {
                    alert("❌ Ez a szoba jelenleg üres! Érvényes kódot a recepción kérhet.");
                    return;
                }
                
                currentPin = pin;
                loggedInRoom = roomsState[pin].room;
                
                loginSection.style.display = 'none';
                ctrlSection.style.display = 'block';
                activeRoomTitle.innerText = `${roomsState[pin].room}. Szoba – Vendég: ${roomsState[pin].guest}`;
                
                syncIoTUI(roomsState[pin]);
                updateBalanceUI();
            } else {
                alert("❌ Érvénytelen vagy hibás vendégkód!");
            }
        });
    }

    // LÁMPA IOT KAPCSOLÓ (Szinkronizál az admin panellel!)
    if (lightBtn) {
        lightBtn.addEventListener('click', () => {
            const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
            if (roomsState && roomsState[currentPin]) {
                roomsState[currentPin].light = !roomsState[currentPin].light;
                localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));
                syncIoTUI(roomsState[currentPin]);
            }
        });
    }

    // KLÍMA IOT RANGE CSÚSZKA (Szinkronizál az admin panellel!)
    if (tempRange) {
        tempRange.addEventListener('change', (e) => {
            const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
            if (roomsState && roomsState[currentPin]) {
                roomsState[currentPin].temp = parseInt(e.target.value);
                localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));
                syncIoTUI(roomsState[currentPin]);
            }
        });
        // Folyamatos visszajelzés húzás közben a kijelzőn
        tempRange.addEventListener('input', (e) => {
            tempDisplay.innerText = e.target.value;
        });
    }

    // AJTÓNYITÁS SZIMULÁCIÓ
    document.getElementById('unlock-door-btn').addEventListener('click', () => {
        alert(`🔓 A(z) ${loggedInRoom}. szoba ajtaja sikeresen kinyílt!`);
    });

    // RENDELÉS LEADÁSA + PÉNZÜGYI EGYENLEG SZÁMÍTÁSA
    document.getElementById('hotel-service-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const select = document.getElementById('srv-type');
        const selectedOpt = select.options[select.selectedIndex];
        const srvName = selectedOpt.value;
        const price = parseInt(selectedOpt.getAttribute('data-price')) || 0;
        const msg = document.getElementById('srv-msg').value;

        // Egyenleg növelése a szobaszámhoz rendelve
        let balances = JSON.parse(localStorage.getItem('roomBalances')) || {};
        balances[loggedInRoom] = (balances[loggedInRoom] || 0) + price;
        localStorage.setItem('roomBalances', JSON.stringify(balances));

        // Értesítés küldése az admin felületre
        let activeComplaints = JSON.parse(localStorage.getItem('activeComplaints')) || [];
        activeComplaints.push({
            id: Date.now(),
            name: `🛒 RENDELÉS (${loggedInRoom}. szoba)`,
            email: price > 0 ? "Fizetős Szolgáltatás" : "Sima Kérés", 
            text: `Tétel: ${srvName} (${price} Ft)\nMegjegyzés: ${msg}`
        });
        localStorage.setItem('activeComplaints', JSON.stringify(activeComplaints));

        alert('🛎 Rendelés sikeresen továbbítva a szálloda személyzetének!');
        document.getElementById('hotel-service-form').reset();
        updateBalanceUI();
    });

    // EXPRESS KIJELENTKEZÉS (AUTOMATIKUS SZOBALEZÁRÁS ÉS STATISZTIKA FRISSÍTÉS)
    if (expressCheckoutBtn) {
        expressCheckoutBtn.addEventListener('click', () => {
            const balances = JSON.parse(localStorage.getItem('roomBalances')) || {};
            const finalRoomBalance = balances[loggedInRoom] || 0;

            const confirmCheck = confirm(`Biztosan ki szeretne jelentkezni a(z) ${loggedInRoom}. szobából?\nFizetendő végösszeg: ${finalRoomBalance.toLocaleString('hu-HU')} Ft.\nA digitális szobakulcsa most le lesz tiltva.`);
            
            if (confirmCheck) {
                const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
                let activeComplaints = JSON.parse(localStorage.getItem('activeComplaints')) || [];
                
                // Szoba visszaállítása LAKATLAN állapotra
                if (roomsState && roomsState[currentPin]) {
                    roomsState[currentPin].guest = "-";
                    roomsState[currentPin].status = "LAKATLAN";
                    roomsState[currentPin].light = false;
                    roomsState[currentPin].acOn = false;
                }
                localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));

                // Értesítés generálása a recepciós felületre
                activeComplaints.push({
                    id: Date.now(),
                    name: `🚪 KIJELENTKEZÉS (${loggedInRoom}. szoba)`,
                    email: "Rendszerértesítés", 
                    text: `A vendég elhagyta a lakosztályt. Végszámla egyenleg: ${finalRoomBalance} Ft. A szoba státusza LAKATLAN lett, takarítás és ellenőrzés szükséges!`
                });
                localStorage.setItem('activeComplaints', JSON.stringify(activeComplaints));

                // Egyenleg nullázása a jövőbeli vendégek számára
                balances[loggedInRoom] = 0;
                localStorage.setItem('roomBalances', JSON.stringify(balances));

                alert('✔ Sikeres expressz kijelentkezés!\nKöszönjük, hogy a SmartHotel-t választotta! Kellemes utat kívánunk!');
                
                // Felület visszaállítása alapállapotba
                currentPin = null;
                loggedInRoom = null;
                loginSection.style.display = 'block';
                ctrlSection.style.display = 'none';
                pinInput.value = '';
            }
        });
    }

    // Bezárás gomb (csak kilép a nézetből, de nem jelentkezteti ki a szobát a hotelből)
    if (manualLogoutBtn) { 
        manualLogoutBtn.addEventListener('click', () => { 
            currentPin = null;
            loggedInRoom = null; 
            loginSection.style.display = 'block'; 
            ctrlSection.style.display = 'none'; 
            pinInput.value = ''; 
        }); 
    }

    // Periodikus háttér-szinkronizáció (másodpercenként)
    setInterval(() => {
        if (currentPin && ctrlSection.style.display === 'block') {
            const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
            if (roomsState && roomsState[currentPin]) {
                // Ha az admin közben törölte a vendéget (kijelentkeztette), dobja ki a kliens felület is
                if (roomsState[currentPin].status === "LAKATLAN") {
                    alert("A szobafiók munkamenete véget ért.");
                    manualLogoutBtn.click();
                    return;
                }
                syncIoTUI(roomsState[currentPin]);
            }
        }
    }, 1000);
});