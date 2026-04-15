import navbarHTML from '../components/navbar.html?raw';
import footerHTML from '../components/footer.html?raw';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Remove loading class to trigger fade-in
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);

    // 2. Component Injection
    loadSharedComponents();
});

function loadSharedComponents() {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = navbarHTML;
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
