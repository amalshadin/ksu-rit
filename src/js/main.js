import navbarHTML from '../components/navbar.html?raw';
import footerHTML from '../components/footer.html?raw';
import logoURL from '../assets/ksuritlogo.png';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Remove loading class to trigger fade-in
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);

    // 2. Component Injection
    loadSharedComponents();

    // 3. Initialize Events Page logic
    initEventsPage();
});

function loadSharedComponents() {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        // Replace the dev path with the actual processed asset URL
        const finalNavHTML = navbarHTML.replace('/src/assets/ksuritlogo.png', logoURL);
        navPlaceholder.innerHTML = finalNavHTML;
        highlightActiveLink();

        // Initialize menu AFTER the button is added to the DOM
        initMobileMenu();
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHTML;
    }
}

function initMobileMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Add Pulse effect logic for Event Cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.event-card');
        if (card) {
            card.classList.remove('pulse');
            void card.offsetWidth; // Trigger reflow
            card.classList.add('pulse');

            // Optional: Remove class after animation ends to keep DOM clean
            setTimeout(() => {
                card.classList.remove('pulse');
            }, 450);
        }
    });
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

/* ==========================================
   Events Page & Popout Slider Module
   ========================================== */

const EVENTS_DATA = [
    {
        id: "fifa26-efootball-tournament",
        title: "FIFA 2026 eFootball Tournament",
        date: "May 25, 2026",
        venue: "Online",
        description: "KSU RIT brings you an electrifying eFootball Tournament as part of the FIFA 2026 celebrations! Get ready to showcase your skills, compete against the best players on campus, and experience the thrill of virtual football like never before. Whether you're a casual gamer or a competitive pro, this is your chance to battle for glory, exciting prizes, and ultimate bragging rights. Gather your squad, pick your team, and let the kickoff begin!",
        poster: "/public/events/ksurit_fifa26_efootball_touranament.jpeg",
        images: ["/public/events/ksurit_fifa26_efootball_touranament.jpeg"
        ]
    },
    {
        id: "Ehsas26",
        title: "Ehsas'26",
        date: "Mar 30, 2026",
        venue: "College Auditorium",
        description: "On 30th March 2026, KSU organized a mesmerizing Ghazal Night featuring the soulful performances of the Dilrubha Muttippatt. The event created an enchanting musical atmosphere filled with timeless melodies, poetic lyrics, and captivating live music. Students gathered to enjoy an unforgettable evening of rhythm, emotion, and cultural celebration that made the night truly special.",
        poster: "/public/events/Ehsas26.jpg",
        images: [
            "/public/events/Ehsas26.jpg",
            "/public/gallery/ksurit_4.jpg",
            "/public/gallery/ksurit_5.jpg",
        ]
    },
    {
        id: "tech-for-change",
        title: "Tech for Change",
        date: "Dec 12, 2026",
        venue: "RIT Computing Facility",
        description: "A hackathon focused on building digital solutions for campus problems and social welfare. Over 30 teams coded overnight to create tools for mental health support, campus navigation, resource sharing, and waste management.",
        poster: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80",
        images: [
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80"
        ]
    },
    {
        id: "arts-festival-support",
        title: "Arts Festival Support",
        date: "Jan 05, 2027",
        venue: "RIT Open Air Theatre",
        description: "Volunteering and coordinating for the RIT internal arts festival to ensure smooth conduct. Members helped manage crowd flow, backstage preparation, sound/light coordination, and general logistics support.",
        poster: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        images: [
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop&q=80"
        ]
    }
];

let currentSlideIndex = 0;
let currentSliderImages = [];

function initEventsPage() {
    const eventGrid = document.getElementById('event-grid');
    if (!eventGrid) return;

    // Render Event Cards dynamically
    eventGrid.innerHTML = EVENTS_DATA.map(event => `
        <div class="event-card" data-event-id="${event.id}" tabindex="0" role="button" aria-label="View details for ${event.title}">
            <div class="event-card-img-wrapper">
                <img src="${event.poster}" alt="${event.title} Poster" class="event-card-img" loading="lazy">
            </div>
            <div class="event-card-content">
                <span class="event-date">${event.date}</span>
                <h3>${event.title}</h3>
            </div>
        </div>
    `).join('');

    // Setup Interaction listeners
    eventGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.event-card');
        if (card) {
            const eventId = card.dataset.eventId;
            const event = EVENTS_DATA.find(ev => ev.id === eventId);
            if (event) {
                openEventModal(event);
            }
        }
    });

    eventGrid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const card = e.target.closest('.event-card');
            if (card) {
                const eventId = card.dataset.eventId;
                const event = EVENTS_DATA.find(ev => ev.id === eventId);
                if (event) {
                    openEventModal(event);
                }
            }
        }
    });

    setupModalEventListeners();
}

function openEventModal(event) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    const modalDate = document.getElementById('modal-event-date');
    const modalTitle = document.getElementById('modal-event-title');
    const modalVenue = document.getElementById('modal-event-venue');
    const modalDesc = document.getElementById('modal-event-description');
    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderDots = document.getElementById('slider-dots');

    modalDate.textContent = event.date;
    modalTitle.textContent = event.title;
    modalVenue.textContent = event.venue;
    modalDesc.textContent = event.description;

    currentSliderImages = event.images || [];
    currentSlideIndex = 0;

    // Render slider slides
    sliderWrapper.innerHTML = currentSliderImages.map(imgUrl => `
        <div class="slider-slide">
            <img src="${imgUrl}" alt="${event.title} Event Gallery" loading="lazy">
        </div>
    `).join('');

    // Render slider dots
    sliderDots.innerHTML = currentSliderImages.map((_, idx) => `
        <button class="slider-dot ${idx === 0 ? 'active' : ''}" data-slide-index="${idx}" aria-label="Go to slide ${idx + 1}"></button>
    `).join('');

    // Display the modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Update initial slide position
    updateSlidePosition();

    // Focus on close button for accessibility
    const closeBtn = document.getElementById('modal-close');
    closeBtn?.focus();
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scrolling
}

function updateSlidePosition() {
    const sliderWrapper = document.getElementById('slider-wrapper');
    if (!sliderWrapper) return;

    sliderWrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

    // Sync dots status
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
        if (idx === currentSlideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function nextSlide() {
    if (currentSliderImages.length === 0) return;
    currentSlideIndex = (currentSlideIndex + 1) % currentSliderImages.length;
    updateSlidePosition();
}

function prevSlide() {
    if (currentSliderImages.length === 0) return;
    currentSlideIndex = (currentSlideIndex - 1 + currentSliderImages.length) % currentSliderImages.length;
    updateSlidePosition();
}

function setupModalEventListeners() {
    const modal = document.getElementById('event-modal');
    const closeBtn = document.getElementById('modal-close');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const sliderDots = document.getElementById('slider-dots');

    if (!modal) return;

    closeBtn?.addEventListener('click', closeEventModal);

    modal.addEventListener('click', (e) => {
        // Close if click target is the overlay background itself
        if (e.target === modal) {
            closeEventModal();
        }
    });

    prevBtn?.addEventListener('click', prevSlide);
    nextBtn?.addEventListener('click', nextSlide);

    sliderDots?.addEventListener('click', (e) => {
        const dot = e.target.closest('.slider-dot');
        if (dot) {
            currentSlideIndex = parseInt(dot.dataset.slideIndex, 10);
            updateSlidePosition();
        }
    });

    // Keyboard handlers (Escape key closes, Arrow keys navigate slides)
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeEventModal();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        }
    });
}
