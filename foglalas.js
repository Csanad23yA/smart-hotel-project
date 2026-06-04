document.addEventListener('DOMContentLoaded', () => {
    const roomSelect = document.getElementById('room-select');
    const checkInInput = document.getElementById('check-in-date');
    const checkOutInput = document.getElementById('check-out-date');
    const summaryBox = document.getElementById('summary-box');
    const bookingForm = document.getElementById('booking-form');

    const defaultRoomsState = {
        "1234": { room: "101", type: "Standard", pricePerNight: 59000, guest: "Kovács János", status: "OCCUPIED", temp: 22, acOn: true, light: true },
        "5678": { room: "102", type: "Standard", pricePerNight: 59000, guest: "-", status: "LAKATLAN", temp: 19, acOn: false, light: false },
        "1111": { room: "103", type: "Deluxe", pricePerNight: 89000, guest: "Szabó Klára", status: "OCCUPIED", temp: 23, acOn: true, light: true },
        "2222": { room: "104", type: "Deluxe", pricePerNight: 89000, guest: "-", status: "LAKATLAN", temp: 18, acOn: false, light: false },
        "3333": { room: "105", type: "Deluxe", pricePerNight: 89000, guest: "Nagy Péter", status: "OCCUPIED", temp: 21, acOn: true, light: false },
        "4444": { room: "106", type: "Deluxe", pricePerNight: 89000, guest: "-", status: "LAKATLAN", temp: 20, acOn: false, light: false },
        "9999": { room: "204", type: "Luxury Suite", pricePerNight: 149000, guest: "Varga Miklós", status: "OCCUPIED", temp: 22, acOn: true, light: true }
    };

    // Dátumok korlátozása (Ma vagy későbbi napok)
    const today = new Date().toISOString().split('T')[0];
    if (checkInInput) checkInInput.min = today;
    if (checkOutInput) checkOutInput.min = today;

    // Szabad szobák betöltése és szűrése a kért dátumok alapján
    function loadAvailableRooms() {
        if (!roomSelect) return;

        // EZT ITT KELL MEGHÍVNI A FÜGGVÉNYEN BELÜL, A LEGELEJÉN:
        localStorage.removeItem('hotelRoomsState'); 

        // Ezután olvassa ki a friss értékeket a kódodból:
        let roomsState = JSON.parse(localStorage.getItem('hotelRoomsState')) || defaultRoomsState;
        let bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
        
        // ... a kódod további része változatlan ...

        // 1. Átalakítjuk a szobákat egy könnyen rendezhető listává (Array)
        let roomList = [];
        for (let pin in roomsState) {
            roomList.push(roomsState[pin]);
        }

        // 2. SORRENDBE RAKJUK a szobákat a szobaszámuk alapján (101, 102, 103...)
        roomList.sort((a, b) => parseInt(a.room) - parseInt(b.room));

        // Kiválasztott dátumok kinyerése
        const userCheckIn = checkInInput.value ? new Date(checkInInput.value) : null;
        const userCheckOut = checkOutInput.value ? new Date(checkOutInput.value) : null;

        // Ha nincsenek dátumok megadva, jelezzük a listában
        if (!userCheckIn || !userCheckOut || userCheckOut <= userCheckIn) {
            roomSelect.innerHTML = '<option value="" disabled selected>-- Előbb válasszon dátumot! --</option>';
            return;
        }

        roomSelect.innerHTML = '<option value="" disabled selected>-- Válasszon szobát --</option>';
        let hasFreeRoom = false;

        // 3. Végigmegyünk a sorbarendezett szobákon
        roomList.forEach(r => {
            // Megnézzük, hogy ez a konkrét szoba ütközik-e BÁRMELYIK meglévő foglalással a megadott időszakban
            const isOverlapping = bookings.some(b => {
                if (b.room !== r.room) return false;

                const bCheckIn = new Date(b.checkIn);
                const bCheckOut = new Date(b.checkOut);

                // Két dátumintervallum akkor ütközik, ha: Érkezés < bTávozás ÉS Távozás > bÉrkezés
                return userCheckIn < bCheckOut && userCheckOut > bCheckIn;
            });

            // Ha nincs ütközés, a szoba szabad ebben az időpontban! (Függetlenül attól, hogy MOST épp laknak-e benne)
            if (!isOverlapping) {
                hasFreeRoom = true;
                const option = document.createElement('option');
                option.value = r.room;
                option.dataset.price = r.pricePerNight;
                option.dataset.type = r.type;
                option.innerText = `${r.room}. szoba - ${r.type} (${r.pricePerNight.toLocaleString('hu-HU')} Ft/éj)`;
                roomSelect.appendChild(option);
            }
        });

        if (!hasFreeRoom) {
            roomSelect.innerHTML = '<option value="" disabled selected>Sajnos erre az időszakra minden szoba foglalt!</option>';
        }
    }

    function calculatePrice() {
        if (!roomSelect || !checkInInput || !checkOutInput || !summaryBox) return;

        const selectedOption = roomSelect.options[roomSelect.selectedIndex];
        
        if (!selectedOption || roomSelect.value === "" || !checkInInput.value || !checkOutInput.value) {
            summaryBox.style.display = 'none';
            return;
        }

        const pricePerNight = parseInt(selectedOption.dataset.price);
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));

        if (nights > 0) {
            document.getElementById('sum-type').innerText = `${selectedOption.dataset.type} (${roomSelect.value}. szoba)`;
            document.getElementById('sum-nights').innerText = `${nights} éj`;
            document.getElementById('sum-rate').innerText = `${pricePerNight.toLocaleString('hu-HU')} Ft`;
            document.getElementById('sum-total').innerText = `${(nights * pricePerNight).toLocaleString('hu-HU')} Ft`;
            summaryBox.style.display = 'block';
        } else {
            summaryBox.style.display = 'none';
        }
    }

    // Eseménykezelők: ha változik a dátum, újra kell számolni a SZABAD szobákat és a sorrendet!
    if (checkInInput) {
        checkInInput.addEventListener('change', () => {
            checkOutInput.min = checkInInput.value;
            loadAvailableRooms();
            calculatePrice();
        });
    }
    if (checkOutInput) {
        checkOutInput.addEventListener('change', () => {
            loadAvailableRooms();
            calculatePrice();
        });
    }
    if (roomSelect) roomSelect.addEventListener('change', calculatePrice);

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const selectedOption = roomSelect.options[roomSelect.selectedIndex];
            const checkIn = new Date(checkInInput.value);
            const checkOut = new Date(checkOutInput.value);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));

            if (nights <= 0) {
                alert("Hiba: A távozás napjának később kell lennie, mint az érkezés napja!");
                return;
            }

            const newBooking = {
                id: Date.now(),
                guest: document.getElementById('guest-name').value.trim(),
                room: roomSelect.value,
                type: selectedOption.dataset.type,
                checkIn: checkInInput.value,
                checkOut: checkOutInput.value,
                nights: nights,
                totalPrice: nights * parseInt(selectedOption.dataset.price)
            };

            let bookings = JSON.parse(localStorage.getItem('hotelBookings')) || [];
            bookings.push(newBooking);
            localStorage.setItem('hotelBookings', JSON.stringify(bookings));

            alert(`🎉 Sikeres foglalás!\n\nRögzítettük az igényt a(z) ${roomSelect.value}. szobára.`);
            window.location.href = 'szobak.html';
        });
    }

    // Első indításkor még nincs dátum, kényszerítjük a választást
    loadAvailableRooms();
});