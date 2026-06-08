import navbarHTML from '../components/navbar.html?raw';
import footerHTML from '../components/footer.html?raw';
import logoURL from '../assets/ksuritlogo.png';

// Global API Base URL configuration
const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Remove loading class to trigger fade-in
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);

    // 2. Component Injection
    loadSharedComponents();

    // 3. Initialize Events Page logic
    initEventsPage();

    // 4. Initialize Gallery Page logic
    initGalleryPage();
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

let eventsList = [];
let currentSlideIndex = 0;
let currentSliderImages = [];

async function initEventsPage() {
    const eventGrid = document.getElementById('event-grid');
    if (!eventGrid) return;

    // Fetch dynamic events from backend API
    try {
        const response = await fetch(`${API_BASE}/events`);
        if (!response.ok) throw new Error('Failed to fetch from API');
        const result = await response.json();
        if (result.success && result.data) {
            eventsList = result.data;
            console.log('✅ Events loaded from Express CMS API.');
        }
    } catch (err) {
        console.error('Error fetching events:', err.message);
    }

    // If no events found, display a clean empty state
    if (eventsList.length === 0) {
        eventGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4.5rem 2rem; color: var(--color-text-muted); width: 100%;">
                <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color: var(--color-text-muted); margin-bottom: 1rem; display: block;"></i>
                <h3>No events found</h3>
                <p style="margin-top:0.5rem; font-size:0.95rem; opacity:0.8;">Stay tuned! Events will be published here soon.</p>
            </div>
        `;
        return;
    }

    // Render Event Cards dynamically
    eventGrid.innerHTML = eventsList.map(event => `
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
            const event = eventsList.find(ev => ev.id == eventId);
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
                const event = eventsList.find(ev => ev.id == eventId);
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

/* ==========================================
   Gallery Page Dynamic Module
   ========================================== */

async function initGalleryPage() {
    const galleryMasonry = document.getElementById('gallery-masonry');
    if (!galleryMasonry) return;

    let galleryItems = [];

    // Fetch dynamic gallery images from backend API
    try {
        const response = await fetch(`${API_BASE}/gallery`);
        if (!response.ok) throw new Error('Failed to fetch from API');
        const result = await response.json();
        if (result.success && result.data) {
            galleryItems = result.data;
            console.log('✅ Gallery loaded from Express CMS API.');
        }
    } catch (err) {
        console.error('Error fetching gallery:', err.message);
    }

    // If no gallery images found, display a clean empty state
    if (galleryItems.length === 0) {
        galleryMasonry.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4.5rem 2rem; color: var(--color-text-muted); width: 100%;">
                <i class="fa-solid fa-images" style="font-size: 2.5rem; color: var(--color-text-muted); margin-bottom: 1rem; display: block;"></i>
                <h3>No photos found</h3>
                <p style="margin-top:0.5rem; font-size:0.95rem; opacity:0.8;">The gallery is currently empty. Please check back later.</p>
            </div>
        `;
        return;
    }

    // Render Gallery Items dynamically
    galleryMasonry.innerHTML = galleryItems.map(item => `
        <div class="gallery-item">
            <img src="${item.image_url}" alt="${item.title || 'Gallery Image'}" loading="lazy">
        </div>
    `).join('');
}
