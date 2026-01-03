// script.js - Final Fixed Version

// --- Global State ---
let currentTheme = localStorage.getItem('theme') || 'light';
let items = [];

// --- 1. Init ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (window.location.pathname.includes('manage.html')) {
        initAdmin();
    } else {
        initPublic();
    }
});

// --- 2. Theme Manager ---
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    if (currentTheme === 'dark') document.body.classList.add('dark-theme');
    
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
            if(icon) icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
}

// --- 3. Public Logic ---
function initPublic() {
    fetchItems();
    
    // Search Listener
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    if(searchInput) {
        searchInput.addEventListener('keyup', () => renderItems(searchInput.value));
        searchBtn.addEventListener('click', () => renderItems(searchInput.value));
    }

    // Modal Setup
    setupModal();

    // *** NEW: Event Delegation for Buttons (Fixes "Not Working" issue) ***
    const activeGrid = document.getElementById('items-grid');
    if (activeGrid) {
        activeGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('claim-btn')) {
                openReservationModal(e.target.dataset.id, e.target.dataset.name);
            }
        });
    }
}

// --- 4. Fetch Data ---
async function fetchItems() {
    try {
        const res = await fetch('/api/items');
        items = await res.json();
        renderItems();
        updateStats();
    } catch(err) { console.error(err); }
}

function updateStats() {
    const active = items.filter(i => i.status === 'active').length;
    const claimed = items.filter(i => i.status === 'claimed').length;
    if(document.getElementById('active-count')) document.getElementById('active-count').textContent = active;
    if(document.getElementById('claimed-count')) document.getElementById('claimed-count').textContent = claimed;
}

// --- 5. Render Items ---
function renderItems(filterText = '') {
    const activeGrid = document.getElementById('items-grid');
    const claimedGrid = document.getElementById('claimed-grid');
    if(!activeGrid) return;

    const lowerFilter = filterText.toLowerCase();
    const filtered = items.filter(i => 
        i.name.toLowerCase().includes(lowerFilter) || 
        i.location.toLowerCase().includes(lowerFilter) ||
        (i.description && i.description.toLowerCase().includes(lowerFilter))
    );

    const active = filtered.filter(i => i.status === 'active');
    const claimed = filtered.filter(i => i.status === 'claimed');

    activeGrid.innerHTML = active.length ? active.map(i => createCard(i)).join('') : '<div class="no-items">No items found.</div>';
    claimedGrid.innerHTML = claimed.length ? claimed.map(i => createCard(i)).join('') : '<div class="no-items">No claimed items.</div>';
}

function createCard(item) {
    const isClaimed = item.status === 'claimed';
    const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return `
    <div class="item-card ${isClaimed ? 'claimed-card' : ''}">
        <div class="item-header">
            <i class="${item.iconClass}"></i>
            <span>${isClaimed ? 'CLAIMED' : 'ACTIVE'}</span>
        </div>
        <div class="item-body">
            <h3 class="item-name">${item.name}</h3>
            <div class="item-detail"><i class="fas fa-map-marker-alt"></i> ${item.location}</div>
            <div class="item-detail"><i class="fas fa-calendar"></i> ${dateStr}</div>
            ${item.description ? `<div class="item-detail description"><i class="fas fa-info-circle"></i> ${item.description}</div>` : ''}
        </div>
        <div class="item-footer">
            <button class="claim-btn" data-id="${item._id}" data-name="${item.name}" ${isClaimed ? 'disabled' : ''}>
                ${isClaimed ? 'Owner Found' : 'Reserve This Item'}
            </button>
        </div>
    </div>`;
}

// --- 6. Modal Logic ---
function openReservationModal(id, name) {
    document.getElementById('reservation-item-id').value = id;
    document.getElementById('reservation-item-name').value = name;
    document.getElementById('reservation-modal').classList.remove('hidden');
}

function setupModal() {
    const modal = document.getElementById('reservation-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-reservation');
    const form = document.getElementById('reservation-form');

    const closeModal = () => modal.classList.add('hidden');
    if(closeBtn) closeBtn.onclick = closeModal;
    if(cancelBtn) cancelBtn.onclick = closeModal;

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;

            const data = {
                itemId: document.getElementById('reservation-item-id').value,
                itemName: document.getElementById('reservation-item-name').value,
                fullName: document.getElementById('full-name').value,
                userType: document.getElementById('user-type').value,
                contactInfo: document.getElementById('contact-info').value,
                comment: document.getElementById('reservation-comment').value
            };
            
            try {
                const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    alert('Reservation Sent! Please visit the GS Building within 24 hours.');
                    closeModal();
                    form.reset();
                } else throw new Error();
            } catch(err) { 
                alert('Failed to send reservation.'); 
            } finally {
                submitBtn.textContent = "Submit Request";
                submitBtn.disabled = false;
            }
        });
    }
}

// --- 7. Admin Logic (Same as before) ---
async function initAdmin() {
    const authRes = await fetch('/api/admin/check');
    const authData = await authRes.json();
    
    if (authData.loggedIn) {
        showDashboard();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, password })
                });
                if (res.ok) { showDashboard(); loginForm.reset(); }
                else { document.getElementById('login-error').classList.remove('hidden'); }
            } catch (err) { console.error(err); }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.onclick = async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.reload(); };

    // Tabs
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            loadAdminData();
        });
    });

    // Add Item
    const addForm = document.getElementById('admin-item-form');
    if(addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const itemData = {
                name: document.getElementById('admin-item-name').value,
                iconClass: document.getElementById('admin-item-icon').value,
                location: document.getElementById('admin-item-location').value,
                date: document.getElementById('admin-item-date').value,
                status: 'active',
                description: document.getElementById('admin-item-description').value,
                adminDetails: document.getElementById('admin-item-details').value
            };
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(itemData)
            });
            if(res.ok) { alert('Item Published!'); addForm.reset(); document.querySelector('[data-tab="items"]').click(); }
        });
    }
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadAdminData();
}

async function loadAdminData() {
    const [itemsRes, resRes] = await Promise.all([ fetch('/api/items'), fetch('/api/reservations') ]);
    const items = await itemsRes.json();
    const reservations = await resRes.json();
    
    const tableBody = document.getElementById('admin-items-table');
    if(tableBody) {
        tableBody.innerHTML = items.map(i => `
            <tr>
                <td><i class="${i.iconClass}"></i> ${i.name}</td>
                <td>${i.location}</td>
                <td>${new Date(i.date).toLocaleDateString()}</td>
                <td><span class="status-${i.status}">${i.status.toUpperCase()}</span></td>
                <td>
                    <button onclick="toggleItemStatus('${i._id}', '${i.status}')" class="btn-secondary"><i class="fas fa-exchange-alt"></i></button>
                    <button onclick="deleteItem('${i._id}')" class="btn-secondary" style="color:red;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
    
    const resList = document.getElementById('reservations-list');
    if(resList) {
        resList.innerHTML = reservations.map(r => `
            <div class="info-card" style="text-align:left; border-left:4px solid var(--unn-green);">
                <h3>${r.itemName} <span class="badge" style="background:#ffc107; color:black;">${r.status}</span></h3>
                <p><strong>Claimant:</strong> ${r.fullName} (${r.userType})</p>
                <p><strong>Contact:</strong> ${r.contactInfo}</p>
                <p><strong>Comment:</strong> ${r.comment}</p>
            </div>
        `).join('');
    }
}

window.toggleItemStatus = async (id, current) => {
    const status = current === 'active' ? 'claimed' : 'active';
    if(confirm(`Mark as ${status.toUpperCase()}?`)) {
        await fetch(`/api/items/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status }) });
        loadAdminData();
    }
};

window.deleteItem = async (id) => {
    if(confirm('Permanently Delete?')) {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        loadAdminData();
    }
};