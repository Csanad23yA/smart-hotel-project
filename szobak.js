document.addEventListener('DOMContentLoaded', () => {
    
    // 1. KATEGÓRIA SZŰRŐ LOGIKA
    const filterButtons = document.querySelectorAll('.filter-btn');
    const roomCards = document.querySelectorAll('.room-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filterType = button.getAttribute('data-filter');

            roomCards.forEach(card => {
                const cardType = card.getAttribute('data-type');
                if (filterType === 'all' || cardType === filterType) {
                    card.style.display = 'flex';
                    setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => { card.style.display = 'none'; }, 300);
                }
            });
        });
    });

    // 2. OKOSOTTHON ACCORDION LOGIKA
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const span = header.querySelector('span');
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0px';
                span.innerText = '+';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                span.innerText = '−';
            }
        });
    });

    // =======================================================
    // 3. POP-UP KÉPGALÉRIA RENDSZER (ÚJ!)
    // =======================================================
    
    // Itt tároljuk a szobákhoz tartozó képeket és szövegeket
    const galleryData = {
        // A szobak.js fájlban keresd meg ezt a részt, és írd át a harmadik linket:
"standard": {
    title: "Smart Standard szoba",
    desc: "A minimalista dizájn és az okos technológia tökéletes találkozása. Dőlj hátra, és irányítsd a szobát a hangoddal.",
    images: [
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop" // EZT AZ ÚJ LINKET MÁSOLD BE IDE
    ]
},
        "suite": {
            title: "Deluxe Smart Lakosztály",
            desc: "Tágas, prémium terek, ahol a luxus és a kényelem a legmagasabb szinten fonódik össze. Különálló nappalival.",
            images: [
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop"
            ]
        },
        "luxury": {
            title: "Executive Penthouse",
            desc: "A hotel csúcsa. Saját jakuzzi, letaglózó panoráma, és egy biometrikusan védett lakosztály, ami csak a tiéd.",
            images: [
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1559841644-08984562005a?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop"
            ]
        }
    };

    const modal = document.getElementById('gallery-modal');
    const closeBtn = document.querySelector('.close-modal');
    const mainImage = document.getElementById('gallery-image');
    const titleText = document.getElementById('gallery-title');
    const descText = document.getElementById('gallery-desc');
    const currentNum = document.getElementById('current-img-num');
    const totalNum = document.getElementById('total-img-num');
    
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentImages = [];
    let currentIndex = 0;

    // Galéria megnyitása a kép wrapperre kattintva
    document.querySelectorAll('.open-gallery-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomKey = btn.getAttribute('data-room');
            const data = galleryData[roomKey];

            currentImages = data.images;
            currentIndex = 0;

            titleText.innerText = data.title;
            descText.innerText = data.desc;
            totalNum.innerText = currentImages.length;
            
            updateImage();
            modal.classList.add('active');
        });
    });

    // Kép frissítése
    function updateImage() {
        mainImage.style.opacity = '0.5'; // Pici fade effekt
        setTimeout(() => {
            mainImage.src = currentImages[currentIndex];
            currentNum.innerText = currentIndex + 1;
            mainImage.style.opacity = '1';
        }, 150);
    }

    // Lapozás jobbra-balra
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        updateImage();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        updateImage();
    });

    // Bezárás logikák
    closeBtn.addEventListener('click', () => { modal.classList.remove('active'); });
    modal.addEventListener('click', (e) => { 
        if(e.target === modal) modal.classList.remove('active'); 
    });
});