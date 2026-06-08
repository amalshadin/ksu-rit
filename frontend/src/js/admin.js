// Admin CMS Client Module
const API_BASE = 'http://localhost:5000/api';

// State management
let currentToken = localStorage.getItem('admin_token') || null;
let currentEvents = [];
let currentGallery = [];

// Track slider images marked for deletion during Event editing
let eventDeletedImages = [];

// DOM Elements
const authPortal = document.getElementById('auth-portal');
const dashboardPortal = document.getElementById('dashboard-portal');
const loginForm = document.getElementById('login-form');
const loginAlert = document.getElementById('login-alert');
const loginAlertText = document.getElementById('login-alert-text');
const logoutBtn = document.getElementById('logout-btn');

// Sidebar Tabs
const tabEventsBtn = document.getElementById('tab-events-btn');
const tabGalleryBtn = document.getElementById('tab-gallery-btn');
const eventsPanel = document.getElementById('events-panel');
const galleryPanel = document.getElementById('gallery-panel');

// Event DOM Elements
const createEventBtn = document.getElementById('create-event-btn');
const eventModal = document.getElementById('event-modal');
const eventModalClose = document.getElementById('event-modal-close');
const eventModalTitle = document.getElementById('event-modal-title');
const eventForm = document.getElementById('event-form');
const eventIdInput = document.getElementById('event-id');
const eventTitleInput = document.getElementById('event-title-input');
const eventDateInput = document.getElementById('event-date-input');
const eventVenueInput = document.getElementById('event-venue-input');
const eventDescInput = document.getElementById('event-desc-input');
const eventPosterFile = document.getElementById('event-poster-file');
const eventSliderFiles = document.getElementById('event-slider-files');
const eventAlert = document.getElementById('event-alert');
const posterDropzone = document.getElementById('poster-dropzone');
const sliderDropzone = document.getElementById('slider-dropzone');
const posterPreviewContainer = document.getElementById('poster-preview-container');
const sliderPreviewsContainer = document.getElementById('slider-previews-container');
const eventsTableBody = document.getElementById('events-table-body');
const eventsEmptyState = document.getElementById('events-empty');

// Gallery DOM Elements
const uploadGalleryBtn = document.getElementById('upload-gallery-btn');
const galleryModal = document.getElementById('gallery-modal');
const galleryModalClose = document.getElementById('gallery-modal-close');
const galleryModalTitle = document.getElementById('gallery-modal-title');
const galleryForm = document.getElementById('gallery-form');
const galleryIdInput = document.getElementById('gallery-id');
const galleryTitleInput = document.getElementById('gallery-title-input');
const galleryCategoryInput = document.getElementById('gallery-category-input');
const galleryFile = document.getElementById('gallery-file');
const galleryAlert = document.getElementById('gallery-alert');
const galleryDropzone = document.getElementById('gallery-dropzone');
const galleryPreviewContainer = document.getElementById('gallery-preview-container');
const galleryTableBody = document.getElementById('gallery-table-body');
const galleryEmptyState = document.getElementById('gallery-empty');

// Files selection state (used to store files when drag-and-dropped)
let selectedPosterFile = null;
let selectedSliderFiles = [];
let selectedGalleryFile = null;

/* ==========================================
   Initialization & Auth Session
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    setupCoreEventListeners();
    setupDropzoneHandlers();
});

async function checkAuthSession() {
    if (!currentToken) {
        showPortal('auth');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            showPortal('dashboard');
            loadCMSData();
        } else {
            // Token expired or invalid
            logout();
        }
    } catch (error) {
        console.error('Session verification failed:', error);
        // Fallback to auth login screen
        showPortal('auth');
    }
}

function showPortal(portal) {
    if (portal === 'auth') {
        authPortal.style.display = 'flex';
        dashboardPortal.style.display = 'none';
        document.body.classList.remove('admin-body-dashboard');
    } else {
        authPortal.style.display = 'none';
        dashboardPortal.style.display = 'grid';
        document.body.classList.add('admin-body-dashboard');
    }
}

function logout() {
    currentToken = null;
    localStorage.removeItem('admin_token');
    showPortal('auth');
}

/* ==========================================
   Event Listeners (Forms, Tabs, Modals)
   ========================================== */

function setupCoreEventListeners() {
    // Auth Login Form
    loginForm.addEventListener('submit', handleLogin);

    // Logout Button
    logoutBtn.addEventListener('click', logout);

    // Tab Navigation
    tabEventsBtn.addEventListener('click', () => switchTab('events'));
    tabGalleryBtn.addEventListener('click', () => switchTab('gallery'));

    // Event CMS Actions
    createEventBtn.addEventListener('click', () => openEventModalWindow());
    eventModalClose.addEventListener('click', () => closeEventModalWindow());
    document.getElementById('event-cancel-btn').addEventListener('click', () => closeEventModalWindow());
    eventForm.addEventListener('submit', handleEventSubmit);

    // Gallery CMS Actions
    uploadGalleryBtn.addEventListener('click', () => openGalleryModalWindow());
    galleryModalClose.addEventListener('click', () => closeGalleryModalWindow());
    document.getElementById('gallery-cancel-btn').addEventListener('click', () => closeGalleryModalWindow());
    galleryForm.addEventListener('submit', handleGallerySubmit);
}

function switchTab(tab) {
    if (tab === 'events') {
        tabEventsBtn.classList.add('active');
        tabGalleryBtn.classList.remove('active');
        eventsPanel.classList.add('active');
        galleryPanel.classList.remove('active');
    } else {
        tabEventsBtn.classList.remove('active');
        tabGalleryBtn.classList.add('active');
        eventsPanel.classList.remove('active');
        galleryPanel.classList.add('active');
    }
}

/* ==========================================
   CMS Data Fetching & Rendering
   ========================================== */

function loadCMSData() {
    fetchEventsList();
    fetchGalleryList();
}

async function fetchEventsList() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const result = await response.json();
        if (result.success) {
            currentEvents = result.data || [];
            renderEventsTable();
        }
    } catch (err) {
        console.error('Failed to load events:', err);
    }
}

async function fetchGalleryList() {
    try {
        const response = await fetch(`${API_BASE}/gallery`);
        const result = await response.json();
        if (result.success) {
            currentGallery = result.data || [];
            renderGalleryTable();
        }
    } catch (err) {
        console.error('Failed to load gallery items:', err);
    }
}

function renderEventsTable() {
    if (currentEvents.length === 0) {
        eventsTableBody.innerHTML = '';
        eventsEmptyState.style.display = 'block';
        return;
    }

    eventsEmptyState.style.display = 'none';
    eventsTableBody.innerHTML = currentEvents.map(event => `
        <tr data-id="${event.id}">
            <td>
                <img src="${event.poster}" alt="Poster" class="cell-thumbnail" onerror="this.src='/favicon.svg'">
            </td>
            <td>
                <div style="font-weight: 600; color: #fff;">${event.title}</div>
                <div style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.25rem;">
                    ${event.description.length > 70 ? event.description.substring(0, 70) + '...' : event.description}
                </div>
            </td>
            <td>
                <i class="fa-solid fa-map-pin" style="color: #00aeef; margin-right: 5px;"></i>${event.venue}
            </td>
            <td>
                <i class="fa-solid fa-calendar-day" style="color: #9ca3af; margin-right: 5px;"></i>${event.date}
            </td>
            <td>
                <div class="cell-actions">
                    <button class="btn-icon edit-event-btn" title="Edit Event"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-icon-danger delete-event-btn" title="Delete Event"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    // Attach row action listeners
    document.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            openEventModalWindow(row.dataset.id);
        });
    });

    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            deleteEventItem(row.dataset.id);
        });
    });
}

function renderGalleryTable() {
    if (currentGallery.length === 0) {
        galleryTableBody.innerHTML = '';
        galleryEmptyState.style.display = 'block';
        return;
    }

    galleryEmptyState.style.display = 'none';
    galleryTableBody.innerHTML = currentGallery.map(item => {
        const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
        return `
            <tr data-id="${item.id}">
                <td>
                    <img src="${item.image_url}" alt="Gallery" class="cell-thumbnail" onerror="this.src='/favicon.svg'">
                </td>
                <td style="font-weight: 600; color: #fff;">
                    ${item.title || '<span style="color:#6b7280; font-style:italic;">No caption</span>'}
                </td>
                <td>
                    <span style="background: rgba(255,255,255,0.06); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.04);">
                        ${item.category || 'General'}
                    </span>
                </td>
                <td>
                    <i class="fa-solid fa-clock" style="color: #9ca3af; margin-right: 5px;"></i>${formattedDate}
                </td>
                <td>
                    <div class="cell-actions">
                        <button class="btn-icon edit-gallery-btn" title="Edit Photo"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon btn-icon-danger delete-gallery-btn" title="Delete Photo"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Attach row action listeners
    document.querySelectorAll('.edit-gallery-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            openGalleryModalWindow(row.dataset.id);
        });
    });

    document.querySelectorAll('.delete-gallery-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            deleteGalleryItem(row.dataset.id);
        });
    });
}

/* ==========================================
   Form Handling Operations
   ========================================== */

async function handleLogin(e) {
    e.preventDefault();
    loginAlert.style.display = 'none';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success && data.token) {
            currentToken = data.token;
            localStorage.setItem('admin_token', data.token);
            showPortal('dashboard');
            loadCMSData();
            loginForm.reset();
        } else {
            showLoginError(data.message || 'Login failed. Invalid admin credentials.');
        }
    } catch (err) {
        showLoginError('Network error. Failed to communicate with the CMS backend.');
    }
}

function showLoginError(msg) {
    loginAlertText.textContent = msg;
    loginAlert.style.display = 'flex';
}

// Event Create / Edit Submit
async function handleEventSubmit(e) {
    e.preventDefault();
    eventAlert.style.display = 'none';

    const id = eventIdInput.value;
    const isEdit = !!id;

    // Validate cover image exists for creation
    if (!isEdit && !selectedPosterFile) {
        eventAlert.textContent = 'Main event poster image is required.';
        eventAlert.style.display = 'flex';
        return;
    }

    const formData = new FormData();
    formData.append('title', eventTitleInput.value);
    formData.append('event_date', eventDateInput.value);
    formData.append('venue', eventVenueInput.value);
    formData.append('description', eventDescInput.value);

    // Append cover poster if uploaded
    if (selectedPosterFile) {
        formData.append('poster', selectedPosterFile);
    }

    // Append multiple slider files if uploaded
    if (selectedSliderFiles.length > 0) {
        selectedSliderFiles.forEach(file => {
            formData.append('images', file);
        });
    }

    // Append deleted image URLs for editing
    if (isEdit && eventDeletedImages.length > 0) {
        eventDeletedImages.forEach(url => {
            formData.append('deleted_images', url);
        });
    }

    const submitBtn = document.getElementById('event-submit-btn');
    const oldBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const url = isEdit ? `${API_BASE}/events/${id}` : `${API_BASE}/events`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            closeEventModalWindow();
            fetchEventsList();
        } else {
            eventAlert.textContent = result.message || 'Failed to save event.';
            eventAlert.style.display = 'flex';
        }
    } catch (err) {
        console.error('Error saving event:', err);
        eventAlert.textContent = 'Connection error. Check your server console.';
        eventAlert.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldBtnHTML;
    }
}

// Gallery Upload / Edit Submit
async function handleGallerySubmit(e) {
    e.preventDefault();
    galleryAlert.style.display = 'none';

    const id = galleryIdInput.value;
    const isEdit = !!id;

    if (!isEdit && !selectedGalleryFile) {
        galleryAlert.textContent = 'Image file is required for upload.';
        galleryAlert.style.display = 'flex';
        return;
    }

    const formData = new FormData();
    formData.append('title', galleryTitleInput.value || '');
    formData.append('category', galleryCategoryInput.value || '');

    if (selectedGalleryFile) {
        formData.append('image', selectedGalleryFile);
    }

    const submitBtn = document.getElementById('gallery-submit-btn');
    const oldBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    const url = isEdit ? `${API_BASE}/gallery/${id}` : `${API_BASE}/gallery`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            closeGalleryModalWindow();
            fetchGalleryList();
        } else {
            galleryAlert.textContent = result.message || 'Failed to save gallery item.';
            galleryAlert.style.display = 'flex';
        }
    } catch (err) {
        console.error('Error saving gallery item:', err);
        galleryAlert.textContent = 'Connection error. Check your server console.';
        galleryAlert.style.display = 'flex';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldBtnHTML;
    }
}

// Deletions
async function deleteEventItem(id) {
    const event = currentEvents.find(e => e.id == id);
    if (!confirm(`Are you sure you want to delete "${event?.title}"? This will also permanently remove its images from Cloudflare R2.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const result = await response.json();
        if (result.success) {
            fetchEventsList();
        } else {
            alert(result.message || 'Failed to delete event.');
        }
    } catch (err) {
        console.error('Delete event error:', err);
    }
}

async function deleteGalleryItem(id) {
    if (!confirm('Are you sure you want to delete this gallery photo from Cloudflare R2 and database?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const result = await response.json();
        if (result.success) {
            fetchGalleryList();
        } else {
            alert(result.message || 'Failed to delete photo.');
        }
    } catch (err) {
        console.error('Delete photo error:', err);
    }
}

/* ==========================================
   Modal Operations & UI Previews
   ========================================== */

function openEventModalWindow(id = null) {
    eventAlert.style.display = 'none';
    eventForm.reset();
    eventIdInput.value = '';
    selectedPosterFile = null;
    selectedSliderFiles = [];
    eventDeletedImages = [];
    posterPreviewContainer.innerHTML = '';
    sliderPreviewsContainer.innerHTML = '';

    if (id) {
        // Edit Mode
        eventModalTitle.textContent = 'Edit Event';
        const event = currentEvents.find(e => e.id == id);
        if (event) {
            eventIdInput.value = event.id;
            eventTitleInput.value = event.title;
            eventDateInput.value = event.date;
            eventVenueInput.value = event.venue;
            eventDescInput.value = event.description;

            // Render existing cover poster preview
            posterPreviewContainer.innerHTML = `
                <div class="preview-thumbnail">
                    <img src="${event.poster}">
                </div>
            `;

            // Render existing slider image previews (the first index of event.images is the poster cover, so slice from 1 onwards)
            const sliderUrls = event.images ? event.images.slice(1) : [];
            sliderUrls.forEach(url => {
                const thumb = document.createElement('div');
                thumb.className = 'preview-thumbnail';
                thumb.dataset.url = url;
                thumb.innerHTML = `
                    <img src="${url}">
                    <button type="button" class="preview-thumbnail-delete" title="Remove image">&times;</button>
                `;
                // Hook delete button click to mark URL for database deletion on save
                thumb.querySelector('.preview-thumbnail-delete').addEventListener('click', () => {
                    eventDeletedImages.push(url);
                    thumb.remove();
                });
                sliderPreviewsContainer.appendChild(thumb);
            });
        }
    } else {
        // Create Mode
        eventModalTitle.textContent = 'Add New Event';
    }

    eventModal.classList.add('active');
}

function closeEventModalWindow() {
    eventModal.classList.remove('active');
}

function openGalleryModalWindow(id = null) {
    galleryAlert.style.display = 'none';
    galleryForm.reset();
    galleryIdInput.value = '';
    selectedGalleryFile = null;
    galleryPreviewContainer.innerHTML = '';

    if (id) {
        // Edit Mode
        galleryModalTitle.textContent = 'Edit Gallery Item';
        const item = currentGallery.find(g => g.id == id);
        if (item) {
            galleryIdInput.value = item.id;
            galleryTitleInput.value = item.title || '';
            galleryCategoryInput.value = item.category || '';

            galleryPreviewContainer.innerHTML = `
                <div class="preview-thumbnail">
                    <img src="${item.image_url}">
                </div>
            `;
        }
    } else {
        // Create Mode
        galleryModalTitle.textContent = 'Upload Gallery Photo';
    }

    galleryModal.classList.add('active');
}

function closeGalleryModalWindow() {
    galleryModal.classList.remove('active');
}

/* ==========================================
   File Drag & Drop / Input Selection
   ========================================== */

function setupDropzoneHandlers() {
    // 1. Poster upload
    posterDropzone.addEventListener('click', () => eventPosterFile.click());
    eventPosterFile.addEventListener('change', (e) => handlePosterSelect(e.target.files[0]));

    // 2. Slider upload
    sliderDropzone.addEventListener('click', () => eventSliderFiles.click());
    eventSliderFiles.addEventListener('change', (e) => handleSliderSelect(e.target.files));

    // 3. Gallery upload
    galleryDropzone.addEventListener('click', () => galleryFile.click());
    galleryFile.addEventListener('change', (e) => handleGallerySelect(e.target.files[0]));

    // Setup drag/drop animations
    const zones = [posterDropzone, sliderDropzone, galleryDropzone];
    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
    });

    posterDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        posterDropzone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handlePosterSelect(e.dataTransfer.files[0]);
    });

    sliderDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        sliderDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleSliderSelect(e.dataTransfer.files);
    });

    galleryDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        galleryDropzone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleGallerySelect(e.dataTransfer.files[0]);
    });
}

function handlePosterSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed!');
        return;
    }
    selectedPosterFile = file;

    // Create URL reader preview
    const reader = new FileReader();
    reader.onload = (e) => {
        posterPreviewContainer.innerHTML = `
            <div class="preview-thumbnail">
                <img src="${e.target.result}">
                <button type="button" class="preview-thumbnail-delete" id="remove-selected-poster">&times;</button>
            </div>
        `;
        document.getElementById('remove-selected-poster').addEventListener('click', () => {
            selectedPosterFile = null;
            posterPreviewContainer.innerHTML = '';
        });
    };
    reader.readAsDataURL(file);
}

function handleSliderSelect(files) {
    if (!files || files.length === 0) return;
    
    // Total files limit (10)
    const allowedNewCount = 10 - (sliderPreviewsContainer.children.length - eventDeletedImages.length);
    const countToUpload = Math.min(files.length, allowedNewCount);

    if (countToUpload <= 0) {
        alert('Maximum of 10 images are allowed for event slider.');
        return;
    }

    for (let i = 0; i < countToUpload; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        selectedSliderFiles.push(file);
        const indexRef = selectedSliderFiles.length - 1;

        const reader = new FileReader();
        reader.onload = (e) => {
            const thumb = document.createElement('div');
            thumb.className = 'preview-thumbnail';
            thumb.innerHTML = `
                <img src="${e.target.result}">
                <button type="button" class="preview-thumbnail-delete" data-index="${indexRef}">&times;</button>
            `;
            // Remove newly selected file reference
            thumb.querySelector('.preview-thumbnail-delete').addEventListener('click', (ev) => {
                const idx = parseInt(ev.target.dataset.index, 10);
                selectedSliderFiles.splice(idx, 1);
                thumb.remove();
            });
            sliderPreviewsContainer.appendChild(thumb);
        };
        reader.readAsDataURL(file);
    }
}

function handleGallerySelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed!');
        return;
    }
    selectedGalleryFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        galleryPreviewContainer.innerHTML = `
            <div class="preview-thumbnail">
                <img src="${e.target.result}">
                <button type="button" class="preview-thumbnail-delete" id="remove-selected-gallery-img">&times;</button>
            </div>
        `;
        document.getElementById('remove-selected-gallery-img').addEventListener('click', () => {
            selectedGalleryFile = null;
            galleryPreviewContainer.innerHTML = '';
        });
    };
    reader.readAsDataURL(file);
}
