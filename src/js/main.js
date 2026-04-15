/**
 * KSU RIT Unit - Main JS
 * Responsible for global animations, mobile menu, and shared component loading.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Remove loading class to trigger fade-in
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);

    // 2. Component Injection
    loadSharedComponents();
});

async function loadSharedComponents() {
    const navbarPath = '/src/components/navbar.html';
    const footerPath = '/src/components/footer.html';

    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        try {
            const navHTML = await fetch(navbarPath).then(res => res.text());
            navPlaceholder.innerHTML = navHTML;
            highlightActiveLink();

            // CRITICAL: Initialize menu AFTER the button is added to the DOM
            initMobileMenu();
        } catch (err) {
            console.error("Navbar failed to load:", err);
        }
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const footerHTML = await fetch(footerPath).then(res => res.text());
            footerPlaceholder.innerHTML = footerHTML;
        } catch (err) {
            console.error("Footer failed to load:", err);
        }
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
