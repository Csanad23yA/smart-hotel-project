document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // --- IDŐZÍTÉS ALAPOK AZ AKTÍV LAPOZHATÓ NAPTÁRHOZ ---
    let calendarStartDate = new Date("2026-05-25"); // Kiinduló hét kezdete

    const usersDB = {
        "admin": { pass: "1234", name: "Admin: FCS", tabs: ["overview", "rooms", "calendar", "feedback"] },
        "recepcio": { pass: "rec123", name: "Recepció: Szabó Anna", tabs: ["overview", "rooms", "calendar"] },
        "karbantar": { pass: "szaki88", name: "Karbantartás: Kiss Péter", tabs: ["rooms"] }
    };

    // Kibővített alapállapot fix dátumokkal, hogy látszódjanak a naptárban!
    const defaultRoomsState = {
        "1234": { room: "101", type: "Standard", pricePerNight: 59000, guest: "Kovács János", status: "OCCUPIED", temp: 22, acOn: true, light: true, checkIn: "2026-05-25", checkOut: "2026-05-29" },
        "5678": { room: "102", type: "Standard", pricePerNight: 59000, guest: "-", status: "LAKATLAN", temp: 19, acOn: false, light: false, checkIn: "", checkOut: "" },
        "1111": { room: "103", type: "Deluxe", pricePerNight: 89000, guest: "Szabó Klára", status: "OCCUPIED", temp: 23, acOn: true, light: true, checkIn: "2026-05-24", checkOut: "2026-05-28" },
        "2222": { room: "104", type: "Deluxe", pricePerNight: 89000, guest: "-", status: "LAKATLAN", temp: 18, acOn: false, light: false, checkIn: "", checkOut: "" },
        "3333": { room: "105", type: "Deluxe", pricePerNight: 89000, guest: "Nagy Péter", status: "OCCUPIED", temp: 21, acOn: true, light: false, checkIn: "2026-05-26", checkOut: "2026-05-31" },
        "4444": { room: "106", type: "Deluxe", pricePerNight: 89000, guest: "-", status: "LAKATLAN", temp: 20, acOn: false, light: false, checkIn: "", checkOut: "" },
        "9999": { room: "204", type: "Luxury Suite", pricePerNight: 149000, guest: "Varga Miklós", status: "OCCUPIED", temp: 22, acOn: true, light: true, checkIn: "2026-05-25", checkOut: "2026-06-02" }
    };

    if (!localStorage.getItem('hotelRoomsState')) {
        localStorage.setItem('hotelRoomsState', JSON.stringify(defaultRoomsState));
    }

    let activeComplaints = [];
    let solvedComplaints = [];

    // --- LOGIN RENDSZER ---
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userInp = document.getElementById('username').value.trim().toLowerCase();
            const passInp = document.getElementById('password').value;

            if (usersDB[userInp] && usersDB[userInp].pass === passInp) {
                const loggedUser = usersDB[userInp];
                document.getElementById('staff-name').innerText = loggedUser.name;

                const sideLinks = document.querySelectorAll('.side-nav a:not(.logout-link)');
                sideLinks.forEach(link => {
                    const targetTab = link.getAttribute('data-tab');
                    if (loggedUser.tabs.includes(targetTab)) {
                        link.style.display = 'block';
                    } else {
                        link.style.display = 'none';
                    }
                });

                const firstAllowedTab = loggedUser.tabs[0];
                sideLinks.forEach(l => l.classList.remove('active'));
                const activeLink = document.querySelector(`.side-nav a[data-tab="${firstAllowedTab}"]`);
                if(activeLink) activeLink.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
                const targetPanel = document.getElementById(`tab-${firstAllowedTab}`);
                if(targetPanel) targetPanel.style.display = 'block';
                
                const titleElement = document.getElementById('tab-title');
                if(titleElement && activeLink) titleElement.innerText = activeLink.innerText;

                loginOverlay.style.display = 'none';
                dashboard.style.display = 'grid';
                updateDashboardData();
            } else {
                loginError.style.display = 'block';
                setTimeout(() => { loginError.style.display = 'none'; }, 3000);
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dashboard.style.display = 'none';
            loginOverlay.style.display = 'flex';
            loginForm.reset();
        });
    }

    // --- METRIKÁK ÉS ADATOK FRISSÍTÉSE ---
    function updateDashboardData() {
        try {
            activeComplaints = JSON.parse(localStorage.getItem('activeComplaints')) || [];
            solvedComplaints = JSON.parse(localStorage.getItem('solvedComplaints')) || [];
        } catch(e) {}

        const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState')) || defaultRoomsState;
        
        let total = 0;
        let occupied = 0;
        for (let pin in roomsState) {
            total++;
            if (roomsState[pin].status !== "LAKATLAN") occupied++;
        }
        let free = total - occupied;
        let percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

        const occRate = document.getElementById('occupancy-rate');
        const occBar = document.getElementById('occupancy-bar');
        const compCount = document.getElementById('complaint-count');
        const archCount = document.getElementById('archive-count');
        const freeCount = document.getElementById('free-count');
        const occCount = document.getElementById('occupied-count');

        if(occRate) occRate.innerText = `${percentage}%`;
        if(occBar) occBar.style.width = `${percentage}%`;
        if(compCount) compCount.innerText = activeComplaints.length;
        if(archCount) archCount.innerText = solvedComplaints.length;
        if(freeCount) freeCount.innerText = free;
        if(occCount) occCount.innerText = occupied;

        renderRooms();
        renderCalendar();       // Beérkező online foglalások listája
        renderInteractiveTimeline(); // AZ IGAZI LAPOZHATÓ IDŐVONAL
        renderComplaints();
        renderArchive();
    }

    // --- SZOBA RENDERING ---
    function renderRooms() {
        const container = document.getElementById('rooms-display-container');
        if(!container) return;
        container.innerHTML = '';

        const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState')) || defaultRoomsState;
        const balances = JSON.parse(localStorage.getItem('roomBalances')) || {};

        const sortedRoomsArray = Object.keys(roomsState).map(pin => {
            return { pin: pin, data: roomsState[pin] };
        });

        sortedRoomsArray.sort((a, b) => parseInt(a.data.room) - parseInt(b.data.room));

        sortedRoomsArray.forEach(item => {
            const pin = item.pin;
            const room = item.data;
            const isOccupied = room.status !== "LAKATLAN";
            const currentBalance = balances[room.room] || 0;

            const card = document.createElement('div');
            card.className = `room-status-card`;
            card.innerHTML = `
                <div class="room-card-header">
                    <h4>${room.room}. Szoba</h4>
                    <span class="room-badge" style="color: ${isOccupied ? 'var(--red)' : 'var(--green)'}">
                        ${isOccupied ? '🔴 Foglalt' : '🟢 Szabad'}
                    </span>
                </div>
                <p class="room-guest"><b>Vendég:</b> ${room.guest}</p>
                <div class="room-controls">
                    <label>🌡️ Klíma: <span style="color: ${room.acOn ? 'var(--gold)' : '#888'}">${room.acOn ? room.temp + '°C' : 'OFF'}</span></label>
                    <label>💡 Lámpa: <button class="iot-toggle-btn ${room.light ? 'active' : ''}" data-pin="${pin}">${room.light ? 'ON' : 'OFF'}</button></label>
                    <span class="room-pin-display">🔑 Belépési PIN: <b>${isOccupied ? pin : '----'}</b></span>
                    <span class="room-pin-display" style="opacity:0.8;">💳 Egyenleg: <b style="color:var(--gold);">${currentBalance.toLocaleString('hu-HU')} Ft</b></span>
                </div>
                <button class="btn-mini edit-room-state-btn" data-pin="${pin}" style="width:100%; margin-top:15px; background:rgba(255,255,255,0.02)">⚙️ KIADÁS / VEZÉRLÉS</button>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.iot-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const pin = this.getAttribute('data-pin');
                const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
                roomsState[pin].light = !roomsState[pin].light;
                localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));
                this.classList.toggle('active');
                this.innerText = roomsState[pin].light ? 'ON' : 'OFF';
            });
        });

        container.querySelectorAll('.edit-room-state-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openRoomModal(this.getAttribute('data-pin'));
            });
        });
    }

    // --- ONLINE FOGLALÁSOK LISTÁZÁSA ---
    function renderCalendar() {
        const calendarTableBody = document.getElementById('calendar-table-body');
        if (!calendarTableBody) return;
        
        const bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
        calendarTableBody.innerHTML = '';

        if (bookings.length === 0) {
            calendarTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="padding: 25px; text-align: center; opacity: 0.5; font-style: italic;">Nincsenek aktív jövőbeli foglalások a várólistában.</td>
                </tr>`;
            return;
        }

        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 14px; font-weight: 600;">${b.guest}</td>
                <td style="padding: 14px; color:#c5a059; font-weight:600;">${b.room}. szoba</td>
                <td style="padding: 14px; opacity: 0.7; font-size:0.85rem;">${b.type}</td>
                <td style="padding: 14px; font-size:0.9rem;">${b.checkIn}</td>
                <td style="padding: 14px; font-size:0.9rem;">${b.checkOut}</td>
                <td style="padding: 14px; text-align: center;">${b.nights} éj</td>
                <td style="padding: 14px; font-weight: 600; color:var(--gold);">${b.totalPrice.toLocaleString('hu-HU')} Ft</td>
                <td style="padding: 14px; text-align: center;">
                    <button onclick="checkInGuest(${b.id})" class="btn-mini" style="background:#c5a059; color:black; font-weight:600; padding: 6px 12px; border:none; border-radius:4px; cursor:pointer;">🛎️ BECSEKKOLÁS</button>
                </td>
            `;
            calendarTableBody.appendChild(tr);
        });
    }

    // --- IGAZI LAPOZHATÓ IDŐVONAL RENDERING ---
    function renderInteractiveTimeline() {
        const gridHead = document.getElementById('timeline-grid-head');
        const gridBody = document.getElementById('timeline-grid-body');
        const periodTitle = document.getElementById('cal-period-title');
        if(!gridHead || !gridBody) return;

        // 7 nap kiszámítása a calendarStartDate alapján
        let daysArray = [];
        let tempDate = new Date(calendarStartDate);
        for(let i=0; i<7; i++) {
            daysArray.push(new Date(tempDate));
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Címke formázása (Hónap.Nap - Hónap.Nap)
        const formatStr = (d) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        periodTitle.innerText = `${formatStr(daysArray[0])} — ${formatStr(daysArray[6])}`;

        // FEJLÉC GENERÁLÁS (Napok nevei)
        const dayNames = ["Vas", "Hét", "Ked", "Sze", "Csü", "Pén", "Szo"];
        let headHTML = `<tr><th class="room-col">Szobaszám</th>`;
        daysArray.forEach(day => {
            const m = String(day.getMonth() + 1).padStart(2, '0');
            const d = String(day.getDate()).padStart(2, '0');
            const name = dayNames[day.getDay()];
            headHTML += `<th>${m}.${d} (${name})</th>`;
        });
        headHTML += `</tr>`;
        gridHead.innerHTML = headHTML;

        // SOROK GENERÁLÁSA SZOBÁNKÉNT
        gridBody.innerHTML = '';
        const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState')) || defaultRoomsState;

        // Rendezzük a szobákat növekvő sorrendbe
        const sortedRooms = Object.values(roomsState).sort((a,b) => parseInt(a.room) - parseInt(b.room));

        sortedRooms.forEach(r => {
            let rowHTML = `<tr><td class="room-col">🚪 ${r.room} szoba (${r.type.split(' ')[0]})</td>`;
            
            daysArray.forEach(day => {
                const currentDayStr = formatStr(day).replace(/\./g, '-'); // YYYY-MM-DD formátum
                
                // Megnézzük, hogy a szoba lakott-e ezen a napon
                let isBooked = false;
                if(r.status === "OCCUPIED" && r.checkIn && r.checkOut) {
                    if(currentDayStr >= r.checkIn && currentDayStr < r.checkOut) {
                        isBooked = true;
                    }
                }

                if(isBooked) {
                    rowHTML += `<td class="booked-cell" title="Vendég: ${r.guest}">${r.guest.split(' ')[0]}</td>`;
                } else {
                    rowHTML += `<td style="opacity:0.3; font-size:0.75rem;">—</td>`;
                }
            });

            rowHTML += `</tr>`;
            gridBody.innerHTML += rowHTML;
        });
    }

    // Lapozó gombok eseménykezelői
    document.getElementById('cal-prev-btn').addEventListener('click', () => {
        calendarStartDate.setDate(calendarStartDate.getDate() - 7);
        renderInteractiveTimeline();
    });
    document.getElementById('cal-next-btn').addEventListener('click', () => {
        calendarStartDate.setDate(calendarStartDate.getDate() + 7);
        renderInteractiveTimeline();
    });


    // --- BECSEKKOLÁS MODUL ---
    window.checkInGuest = function(bookingId) {
        let bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
        const bookingIdx = bookings.findIndex(b => b.id === bookingId);
        if (bookingIdx === -1) return;
        const booking = bookings[bookingIdx];

        let roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
        let balances = JSON.parse(localStorage.getItem('roomBalances')) || {};

        let foundOldPin = null;
        for (let pin in roomsState) {
            if (roomsState[pin].room === booking.room) {
                foundOldPin = pin;
                break;
            }
        }

        if (!foundOldPin) {
            alert("Hiba: A lefoglalt szoba nem található a rendszerben!");
            return;
        }

        if (roomsState[foundOldPin].status !== "LAKATLAN") {
            alert(`❌ Sikertelen becsekkolás! A(z) ${booking.room}. szoba jelenleg még foglalt (${roomsState[foundOldPin].guest} lakja). Előbb jelentkeztesse ki a régi vendéget!`);
            return;
        }

        let newPin;
        do {
            newPin = Math.floor(1000 + Math.random() * 9000).toString();
        } while (roomsState[newPin]);

        const currentRoomData = roomsState[foundOldPin];
        let updatedRoom = {
            room: currentRoomData.room,
            type: currentRoomData.type,
            pricePerNight: currentRoomData.pricePerNight,
            guest: booking.guest,
            status: "OCCUPIED",
            temp: 22,
            acOn: true,
            light: true,
            checkIn: booking.checkIn,   // Átmentjük a dátumokat a naptárba
            checkOut: booking.checkOut
        };

        delete roomsState[foundOldPin];
        roomsState[newPin] = updatedRoom;

        balances[booking.room] = (balances[booking.room] || 0) + booking.totalPrice;
        bookings.splice(bookingIdx, 1);

        localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));
        localStorage.setItem('roomBalances', JSON.stringify(balances));
        localStorage.setItem('hotelBookings', JSON.stringify(bookings));

        alert(`🎉 SIKERES BECSEKKOLÁS!\n\nPIN: ${newPin}\nRáterhelve: ${booking.totalPrice.toLocaleString('hu-HU')} Ft.`);
        
        updateDashboardData();
    };

    // --- MODAL MODOSÍTÁS ÉS KIADÁS LOGIKA ---
    const modal = document.getElementById('roomModal');
    const closeModal = document.getElementById('closeModal');
    const roomEditForm = document.getElementById('room-edit-form');
    const selectStatus = document.getElementById('edit-room-status');
    const guestGroup = document.getElementById('guest-input-group');
    const pinGroup = document.getElementById('pin-input-group');
    const inputTemp = document.getElementById('edit-room-temp');
    const tempDisplay = document.getElementById('temp-val-display');

    if(inputTemp) { inputTemp.addEventListener('input', function() { tempDisplay.innerText = this.value; }); }
    if(selectStatus) { 
        selectStatus.addEventListener('change', function() { 
            if(this.value === 'free') {
                guestGroup.style.display = 'none';
                pinGroup.style.display = 'none';
            } else {
                guestGroup.style.display = 'block';
                pinGroup.style.display = 'block';
            }
        }); 
    }

    function openRoomModal(pin) {
        const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
        const room = roomsState[pin];
        
        document.getElementById('edit-room-id').value = pin;
        document.getElementById('modal-room-title').innerText = `${room.room}. Szoba teljes vezérlése`;
        document.getElementById('edit-room-pin').value = pin;
        
        if (room.status !== "LAKATLAN") {
            selectStatus.value = 'occupied';
            guestGroup.style.display = 'block';
            pinGroup.style.display = 'block';
            document.getElementById('edit-room-guest').value = room.guest;
        } else {
            selectStatus.value = 'free';
            guestGroup.style.display = 'none';
            pinGroup.style.display = 'none';
            document.getElementById('edit-room-guest').value = '';
        }
        document.getElementById('edit-room-ac').value = room.acOn ? 'on' : 'off';
        inputTemp.value = room.temp;
        tempDisplay.innerText = room.temp;
        modal.style.display = 'flex';
    }

    if(closeModal) { closeModal.addEventListener('click', () => modal.style.display = 'none'); }
    
    if(roomEditForm) {
        roomEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPin = document.getElementById('edit-room-id').value;
            const newPin = document.getElementById('edit-room-pin').value.trim();
            const roomsState = JSON.parse(localStorage.getItem('hotelRoomsState'));
            const balances = JSON.parse(localStorage.getItem('roomBalances')) || {};
            const currentRoomObj = roomsState[oldPin];

            if (selectStatus.value === 'occupied' && (!newPin || newPin.length !== 4)) {
                alert("Hiba: Foglalt szobához adj meg pontosan egy 4 jegyű PIN kódot!");
                return;
            }

            // Mai nap alapértelmezettnek kézi kiadásnál
            let updatedRoom = {
                room: currentRoomObj.room,
                type: currentRoomObj.type,
                pricePerNight: currentRoomObj.pricePerNight,
                temp: parseInt(inputTemp.value),
                acOn: document.getElementById('edit-room-ac').value === 'on',
                light: currentRoomObj.light,
                checkIn: currentRoomObj.checkIn || "2026-05-25",
                checkOut: currentRoomObj.checkOut || "2026-05-28"
            };

            if (selectStatus.value === 'free') {
                updatedRoom.status = 'LAKATLAN';
                updatedRoom.guest = '-';
                updatedRoom.checkIn = '';
                updatedRoom.checkOut = '';
                balances[currentRoomObj.room] = 0; 
                delete roomsState[oldPin];
                roomsState[oldPin] = updatedRoom; 
            } else {
                updatedRoom.status = 'OCCUPIED';
                updatedRoom.guest = document.getElementById('edit-room-guest').value || 'Névtelen vendég';
                delete roomsState[oldPin];
                roomsState[newPin] = updatedRoom; 
            }
            
            localStorage.setItem('hotelRoomsState', JSON.stringify(roomsState));
            localStorage.setItem('roomBalances', JSON.stringify(balances));
            modal.style.display = 'none';
            updateDashboardData();
        });
    }

    // --- PANASZKÖNYV RENDERING ---
    function renderComplaints() {
        const errorsContainer = document.getElementById('complaints-list-container');
        const ordersContainer = document.getElementById('orders-list-container');
        if (!errorsContainer || !ordersContainer) return;
        
        errorsContainer.innerHTML = '';
        ordersContainer.innerHTML = '';

        let errorCount = 0;
        let orderCount = 0;

        activeComplaints.forEach(complaint => {
            const item = document.createElement('div');
            item.className = 'complaint-item';
            item.innerHTML = `
                <div class="complaint-meta"><strong>👤 ${complaint.name}</strong></div>
                <p class="complaint-text">"${complaint.text}"</p>
                <button class="btn-mini solve-btn" data-id="${complaint.id}">✔ Archiválás (Megoldva)</button>
            `;

            if (complaint.email === "Fizetős Szolgáltatás") {
                ordersContainer.appendChild(item);
                orderCount++;
            } else {
                errorsContainer.appendChild(item);
                errorCount++;
            }
        });

        if(errorCount === 0) errorsContainer.innerHTML = '<p style="opacity:0.5; padding:20px; font-style:italic;">Nincs aktív szobai panasz vagy hiba.</p>';
        if(orderCount === 0) ordersContainer.innerHTML = '<p style="opacity:0.5; padding:20px; font-style:italic;">Nincs aktív minibár vagy taxi rendelés.</p>';

        document.querySelectorAll('.solve-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const idx = activeComplaints.findIndex(c => c.id === id);
                if (idx !== -1) {
                    const moved = activeComplaints.splice(idx, 1)[0];
                    solvedComplaints.push(moved);
                    localStorage.setItem('activeComplaints', JSON.stringify(activeComplaints));
                    localStorage.setItem('solvedComplaints', JSON.stringify(solvedComplaints));
                    updateDashboardData();
                }
            });
        });
    }

    // --- ARCHÍVUM ---
    function renderArchive() {
        const container = document.getElementById('archive-list-container');
        if (!container) return;

        container.innerHTML = solvedComplaints.length === 0 ? '<p style="opacity:0.5; padding:10px; font-style:italic;">Az archívum üres.</p>' : '';

        solvedComplaints.forEach(complaint => {
            const item = document.createElement('div');
            item.className = 'complaint-item archive-item';
            item.innerHTML = `
                <div class="complaint-meta"><strong>👤 ${complaint.name}</strong></div>
                <p class="complaint-text">"${complaint.text}"</p>
                <div style="display:flex; gap:10px;">
                    <button class="btn-mini restore-btn" data-id="${complaint.id}" style="border-color:#2ecc71; color:#2ecc71;">↩ Visszaállítás</button>
                    <button class="btn-mini delete-btn" data-id="${complaint.id}" style="border-color:#e74c3c; color:#e74c3c;">❌ Véglegen törlés</button>
                </div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const idx = solvedComplaints.findIndex(c => c.id === id);
                if (idx !== -1) {
                    const restored = solvedComplaints.splice(idx, 1)[0];
                    activeComplaints.push(restored);
                    localStorage.setItem('activeComplaints', JSON.stringify(activeComplaints));
                    localStorage.setItem('solvedComplaints', JSON.stringify(solvedComplaints));
                    updateDashboardData();
                }
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const idx = solvedComplaints.findIndex(c => c.id === id);
                if (idx !== -1) {
                    solvedComplaints.splice(idx, 1);
                    localStorage.setItem('solvedComplaints', JSON.stringify(solvedComplaints));
                    updateDashboardData();
                }
            });
        });
    }

    const archiveBtn = document.getElementById('archiveToggleBtn');
    const archivePanel = document.getElementById('archive-panel');
    if(archiveBtn && archivePanel) {
        archiveBtn.addEventListener('click', () => {
            if (archivePanel.style.display === 'none') {
                archivePanel.style.display = 'block';
                archiveBtn.innerText = `🗄️ Megoldott levelek elrejtése (${solvedComplaints.length}) ▴`;
            } else {
                archivePanel.style.display = 'none';
                archiveBtn.innerText = `🗄️ Megoldott levelek megtekintése (${solvedComplaints.length}) ▾`;
            }
        });
    }

    // Főmenü navigáció váltása
    const sideLinks = document.querySelectorAll('.side-nav a:not(.logout-link)');
    sideLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sideLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('tab-title').innerText = link.innerText;
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            document.getElementById(`tab-${link.getAttribute('data-tab')}`).style.display = 'block';
        });
    });

    const tabErrorsBtn = document.getElementById('tab-errors-btn');
    const tabOrdersBtn = document.getElementById('tab-orders-btn');
    const panelErrors = document.getElementById('panel-errors');
    const panelOrders = document.getElementById('panel-orders');

    if(tabErrorsBtn && tabOrdersBtn) {
        tabErrorsBtn.addEventListener('click', () => {
            tabErrorsBtn.classList.add('active');
            tabOrdersBtn.classList.remove('active');
            panelErrors.style.display = 'block';
            panelOrders.style.display = 'none';
        });

        tabOrdersBtn.addEventListener('click', () => {
            tabOrdersBtn.classList.add('active');
            tabErrorsBtn.classList.remove('active');
            panelOrders.style.display = 'block';
            panelErrors.style.display = 'none';
        });
    }

    updateDashboardData();
});