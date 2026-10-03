// DeskShare Frontend Application Logic

// Curated high-resolution workspace images by space type
const DEFAULT_IMAGES = {
  'meeting-room': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
  'hot-desk': 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=900&q=80',
  'private-office': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80',
  'conference-room': 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80',
  'desk': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80'
};

const AppState = {
  user: null,
  spaces: [],
  filteredSpaces: [],
  filters: {
    keyword: '',
    type: 'all',
    sort: 'default'
  },
  selectedSpace: null,
  dashboardTab: 'bookings'
};

// Utilities
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success'
    ? `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`
    : type === 'error'
    ? `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div style="flex:1;">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getSpaceImage(space) {
  if (space.imageUrls && space.imageUrls.length > 0 && space.imageUrls[0]) {
    return space.imageUrls[0];
  }
  return DEFAULT_IMAGES[space.type] || DEFAULT_IMAGES['desk'];
}

function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

// Modal Controllers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Navigation & Auth State
function updateNav() {
  const authBtns = document.getElementById('nav-auth-btns');
  const userMenu = document.getElementById('nav-user-menu');
  const navDashboardLink = document.getElementById('nav-dashboard-link');

  if (AppState.user) {
    if (authBtns) authBtns.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const initial = (AppState.user.name || AppState.user.email || 'U').charAt(0).toUpperCase();
      document.getElementById('user-avatar-text').textContent = initial;
      document.getElementById('user-display-name').textContent = AppState.user.name || 'User';
      document.getElementById('user-display-role').textContent = AppState.user.role || 'user';
    }
    if (navDashboardLink) navDashboardLink.style.display = 'inline-flex';
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (navDashboardLink) navDashboardLink.style.display = 'none';
  }
}

// Spaces Fetching & Rendering
async function fetchSpaces() {
  const container = document.getElementById('spaces-grid');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 14px; color: var(--text-muted);">Discovering available workspaces...</p>
    </div>
  `;

  try {
    const res = await API.spaces.getAll();
    AppState.spaces = res.data || [];
    applyFilters();
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load spaces</div>
        <div class="empty-desc">${err.message}</div>
        <button class="btn btn-primary btn-sm" onclick="fetchSpaces()">Try Again</button>
      </div>
    `;
  }
}

function applyFilters() {
  let list = [...AppState.spaces];

  // Keyword filter
  if (AppState.filters.keyword) {
    const q = AppState.filters.keyword.toLowerCase();
    list = list.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.type.toLowerCase().includes(q)
    );
  }

  // Type filter
  if (AppState.filters.type !== 'all') {
    list = list.filter((s) => s.type === AppState.filters.type);
  }

  // Sorting
  if (AppState.filters.sort === 'price-asc') {
    list.sort((a, b) => a.pricePerHour - b.pricePerHour);
  } else if (AppState.filters.sort === 'price-desc') {
    list.sort((a, b) => b.pricePerHour - a.pricePerHour);
  } else if (AppState.filters.sort === 'capacity-desc') {
    list.sort((a, b) => b.capacity - a.capacity);
  }

  AppState.filteredSpaces = list;
  renderSpaces(list);
}

function renderSpaces(spaces) {
  const container = document.getElementById('spaces-grid');
  const countEl = document.getElementById('spaces-count');
  if (countEl) countEl.textContent = `${spaces.length} space${spaces.length === 1 ? '' : 's'} available`;

  if (!container) return;

  if (spaces.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No workspaces match your search</div>
        <div class="empty-desc">Try clearing filters or searching for different keywords like "desk", "office", or "meeting".</div>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = spaces.map((space) => {
    const imgUrl = getSpaceImage(space);
    const isOwner = AppState.user && space.owner && (
      (typeof space.owner === 'object' && space.owner._id === AppState.user.id) ||
      space.owner === AppState.user.id ||
      AppState.user.role === 'admin'
    );

    const typeIcons = {
      'meeting-room': '👥',
      'hot-desk': '💻',
      'private-office': '🏢',
      'conference-room': '🎤',
      'desk': '🪑'
    };
    const icon = typeIcons[space.type] || '📍';

    return `
      <article class="space-card" data-id="${space._id}">
        <div class="space-img-wrap">
          <img src="${imgUrl}" alt="${space.name}" class="space-img" loading="lazy" />
          <div class="space-type-badge">${icon} ${space.type.replace('-', ' ')}</div>
          <div class="space-price-tag">₹${space.pricePerHour} <span>/ hr</span></div>
        </div>
        <div class="space-content">
          <h3 class="space-name">${escapeHtml(space.name)}</h3>
          <div class="space-location">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-6.5-8-12a8 8 0 1116 0c0 5.5-8 12-8 12z"></path><circle cx="12" cy="9" r="3"></circle></svg>
            ${escapeHtml(space.location)}
          </div>
          <p class="space-desc">${escapeHtml(space.description || 'Modern and fully-equipped workspace tailored for productivity and collaboration.')}</p>

          <div class="space-meta">
            <div class="meta-item">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75M12 14a4 4 0 100-8 4 4 0 000 8z"></path></svg>
              Capacity: ${space.capacity} ${space.capacity === 1 ? 'person' : 'people'}
            </div>
            <div class="meta-item">
              <span style="color: var(--success);">● Available</span>
            </div>
          </div>

          <div class="space-amenities">
            ${(space.amenities || []).slice(0, 4).map((a) => `<span class="amenity-chip">${escapeHtml(a)}</span>`).join('')}
            ${(space.amenities || []).length > 4 ? `<span class="amenity-chip">+${space.amenities.length - 4} more</span>` : ''}
          </div>

          <div class="space-card-actions">
            <button class="btn btn-primary" style="flex:1;" onclick="openBookingModal('${space._id}')">
              Book Now
            </button>
            ${isOwner ? `
              <button class="btn btn-secondary btn-sm" title="Edit Space" onclick="openEditSpaceModal('${space._id}')">✏️</button>
              <button class="btn btn-danger btn-sm" title="Delete Space" onclick="deleteSpace('${space._id}')">🗑️</button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function resetFilters() {
  AppState.filters.keyword = '';
  AppState.filters.type = 'all';
  AppState.filters.sort = 'default';

  const kw = document.getElementById('search-input');
  if (kw) kw.value = '';

  const pills = document.querySelectorAll('.type-pill');
  pills.forEach((p) => {
    p.classList.toggle('active', p.dataset.type === 'all');
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'default';

  applyFilters();
}

// Booking Modal Logic
function openBookingModal(spaceId) {
  const space = AppState.spaces.find((s) => s._id === spaceId);
  if (!space) {
    showToast('Error', 'Workspace not found', 'error');
    return;
  }

  if (!AppState.user) {
    showToast('Login Required', 'Please log in or use a Quick Demo account to book a space.', 'info');
    openAuthModal('login');
    return;
  }

  AppState.selectedSpace = space;

  document.getElementById('booking-space-title').textContent = space.name;
  document.getElementById('booking-space-rate').textContent = `₹${space.pricePerHour}/hr`;
  document.getElementById('booking-space-loc').textContent = space.location;
  document.getElementById('booking-space-thumb').src = getSpaceImage(space);

  // Set default start time: next full hour from now
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);

  // Set end time: 2 hours after start
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const startInput = document.getElementById('booking-start-time');
  const endInput = document.getElementById('booking-end-time');

  startInput.min = toLocalDatetimeString(new Date());
  startInput.value = toLocalDatetimeString(now);
  endInput.min = toLocalDatetimeString(now);
  endInput.value = toLocalDatetimeString(later);

  document.getElementById('booking-notes').value = '';
  updateBookingCalculation();

  openModal('booking-modal');
}

function updateBookingCalculation() {
  if (!AppState.selectedSpace) return;

  const startVal = document.getElementById('booking-start-time').value;
  const endVal = document.getElementById('booking-end-time').value;
  const btn = document.getElementById('btn-confirm-booking');

  if (!startVal || !endVal) {
    document.getElementById('calc-hours').textContent = '0 hrs';
    document.getElementById('calc-total-price').textContent = '₹0';
    if (btn) btn.disabled = true;
    return;
  }

  const start = new Date(startVal);
  const end = new Date(endVal);

  if (start >= end) {
    document.getElementById('calc-hours').textContent = 'Invalid duration';
    document.getElementById('calc-total-price').textContent = '—';
    if (btn) btn.disabled = true;
    return;
  }

  const diffMs = end - start;
  const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  const total = Math.round(hours * AppState.selectedSpace.pricePerHour);

  document.getElementById('calc-hours').textContent = `${hours} hr${hours === 1 ? '' : 's'}`;
  document.getElementById('calc-total-price').textContent = `₹${total}`;
  if (btn) btn.disabled = false;
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  if (!AppState.selectedSpace) return;

  const startVal = document.getElementById('booking-start-time').value;
  const endVal = document.getElementById('booking-end-time').value;
  const notes = document.getElementById('booking-notes').value.trim();
  const btn = document.getElementById('btn-confirm-booking');

  if (!startVal || !endVal) {
    showToast('Missing Times', 'Please choose both start and end time.', 'error');
    return;
  }

  const start = new Date(startVal);
  const end = new Date(endVal);

  if (start < new Date()) {
    showToast('Invalid Time', 'Booking cannot start in the past.', 'error');
    return;
  }

  if (start >= end) {
    showToast('Invalid Time', 'End time must be after start time.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px;"></span> Reserving...`;

  try {
    const res = await API.bookings.create(
      AppState.selectedSpace._id,
      start.toISOString(),
      end.toISOString(),
      notes
    );

    closeModal('booking-modal');
    showToast('Booking Confirmed! 🎉', `Your reservation for "${AppState.selectedSpace.name}" is confirmed.`, 'success');

    // Switch to dashboard bookings view
    navigateTo('dashboard');
    switchDashboardTab('bookings');
  } catch (err) {
    showToast('Booking Failed', err.message || 'Time conflict detected or server error.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Confirm Booking';
  }
}

// Membership Purchasing
async function purchaseMembership(plan) {
  if (!AppState.user) {
    showToast('Login Required', 'Please log in to purchase a membership plan.', 'info');
    openAuthModal('login');
    return;
  }

  const planTitles = {
    basic: 'Basic Freelancer Plan (₹999/mo)',
    premium: 'Premium Dedicated Plan (₹1,999/mo)',
    team: 'Team Studio Plan (₹4,999/mo)'
  };

  const confirmed = confirm(`Confirm purchase of ${planTitles[plan] || plan}?`);
  if (!confirmed) return;

  try {
    const res = await API.memberships.purchase(plan);
    showToast('Membership Activated! 🚀', `You are now subscribed to the ${plan.toUpperCase()} plan!`, 'success');
    navigateTo('dashboard');
    switchDashboardTab('memberships');
  } catch (err) {
    showToast('Purchase Failed', err.message, 'error');
  }
}

// User Dashboard Views
function switchDashboardTab(tab) {
  AppState.dashboardTab = tab;

  document.querySelectorAll('.dash-tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const bookingsSec = document.getElementById('dash-bookings-sec');
  const membershipsSec = document.getElementById('dash-memberships-sec');
  const spacesSec = document.getElementById('dash-spaces-sec');

  if (bookingsSec) bookingsSec.style.display = tab === 'bookings' ? 'block' : 'none';
  if (membershipsSec) membershipsSec.style.display = tab === 'memberships' ? 'block' : 'none';
  if (spacesSec) spacesSec.style.display = tab === 'spaces' ? 'block' : 'none';

  if (tab === 'bookings') loadUserBookings();
  else if (tab === 'memberships') loadUserMemberships();
  else if (tab === 'spaces') loadOwnerSpaces();
}

async function loadUserBookings() {
  const container = document.getElementById('dash-bookings-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 10px; color: var(--text-muted);">Fetching your reservations...</p>
    </div>
  `;

  try {
    const res = await API.bookings.getMy();
    const bookings = res.data || [];

    const badge = document.getElementById('badge-bookings-count');
    if (badge) badge.textContent = bookings.length;

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">No bookings yet</div>
          <div class="empty-desc">You have not booked any coworking spaces yet. Explore available desks and meeting rooms now.</div>
          <button class="btn btn-primary btn-sm" onclick="navigateTo('spaces')">Browse Workspaces</button>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.map((b) => {
      const space = b.space || {};
      const img = (space.imageUrls && space.imageUrls[0]) || DEFAULT_IMAGES[space.type] || DEFAULT_IMAGES['desk'];
      const statusClass = b.status === 'confirmed' ? 'status-confirmed' : b.status === 'cancelled' ? 'status-cancelled' : 'status-completed';

      const canCancel = b.status === 'confirmed' && new Date(b.startTime) > new Date();

      return `
        <div class="booking-item">
          <div class="booking-info">
            <img src="${img}" alt="${escapeHtml(space.name || 'Space')}" class="booking-thumb" />
            <div>
              <div class="booking-title">${escapeHtml(space.name || 'Workspace')}</div>
              <div class="booking-meta">
                <span>📍 ${escapeHtml(space.location || 'Location')}</span>
                <span>🕒 ${formatDateTime(b.startTime)} → ${formatDateTime(b.endTime)}</span>
                <span>💳 Total: <strong>₹${b.totalAmount}</strong></span>
              </div>
              ${b.notes ? `<div style="font-size:0.8rem; color:var(--text-subtle); margin-top:4px;">Notes: ${escapeHtml(b.notes)}</div>` : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="status-badge ${statusClass}">${b.status}</span>
            ${canCancel ? `
              <button class="btn btn-danger btn-sm" onclick="cancelBooking('${b._id}')">Cancel</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load bookings</div>
        <div class="empty-desc">${err.message}</div>
      </div>
    `;
  }
}

async function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  try {
    await API.bookings.cancel(id);
    showToast('Cancelled', 'Your booking has been cancelled successfully.', 'info');
    loadUserBookings();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function loadUserMemberships() {
  const container = document.getElementById('dash-memberships-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 10px; color: var(--text-muted);">Checking active memberships...</p>
    </div>
  `;

  try {
    const res = await API.memberships.getMy();
    const memberships = res.data || [];

    const badge = document.getElementById('badge-memberships-count');
    if (badge) badge.textContent = memberships.length;

    if (memberships.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎟️</div>
          <div class="empty-title">No Active Membership</div>
          <div class="empty-desc">Unlock unlimited hot desks, priority meeting room access, and community perks with a monthly plan.</div>
          <button class="btn btn-primary btn-sm" onclick="navigateTo('memberships')">View Membership Plans</button>
        </div>
      `;
      return;
    }

    container.innerHTML = memberships.map((m) => {
      const isExpired = new Date(m.endDate) < new Date();
      const statusText = isExpired ? 'Expired' : m.status || 'Active';
      const statusClass = !isExpired && m.status === 'active' ? 'status-confirmed' : 'status-completed';

      return `
        <div class="booking-item">
          <div>
            <div style="font-size:1.2rem; font-weight:700; text-transform:capitalize; margin-bottom:4px;">
              ${m.plan} Membership
            </div>
            <div class="booking-meta">
              <span>📅 Valid from: ${formatDate(m.startDate)}</span>
              <span>🏁 Expires: ${formatDate(m.endDate)}</span>
              <span>💰 Amount: <strong>₹${m.amount}/mo</strong></span>
            </div>
          </div>
          <div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load memberships</div>
        <div class="empty-desc">${err.message}</div>
      </div>
    `;
  }
}

// Owner Space Management
function loadOwnerSpaces() {
  const container = document.getElementById('dash-spaces-container');
  if (!container) return;

  const mySpaces = AppState.spaces.filter((s) => {
    if (!AppState.user) return false;
    if (typeof s.owner === 'object') return s.owner?._id === AppState.user.id;
    return s.owner === AppState.user.id;
  });

  const badge = document.getElementById('badge-spaces-count');
  if (badge) badge.textContent = mySpaces.length;

  if (mySpaces.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏢</div>
        <div class="empty-title">You haven't listed any spaces yet</div>
        <div class="empty-desc">As a DeskShare space owner, you can list meeting rooms, hot desks, or private offices and earn bookings.</div>
        <button class="btn btn-primary btn-sm" onclick="openCreateSpaceModal()">+ Add Your First Space</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom: 20px; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary btn-sm" onclick="openCreateSpaceModal()">+ Add New Space</button>
    </div>
    <div class="spaces-grid">
      ${mySpaces.map((space) => {
        const img = getSpaceImage(space);
        return `
          <div class="space-card">
            <div class="space-img-wrap">
              <img src="${img}" alt="${escapeHtml(space.name)}" class="space-img" />
              <div class="space-type-badge">${space.type}</div>
              <div class="space-price-tag">₹${space.pricePerHour}/hr</div>
            </div>
            <div class="space-content">
              <h3 class="space-name">${escapeHtml(space.name)}</h3>
              <div class="space-location">📍 ${escapeHtml(space.location)}</div>
              <div class="space-meta">
                <span>Capacity: ${space.capacity}</span>
                <span>${space.available ? '🟢 Active' : '🔴 Inactive'}</span>
              </div>
              <div class="space-card-actions">
                <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openEditSpaceModal('${space._id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSpace('${space._id}')">Delete</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Create & Edit Space
let editingSpaceId = null;

function openCreateSpaceModal() {
  if (!AppState.user || (AppState.user.role !== 'owner' && AppState.user.role !== 'admin')) {
    showToast('Permission Denied', 'Only space owners can list workspaces. Register/Login as an Owner.', 'error');
    return;
  }

  editingSpaceId = null;
  document.getElementById('space-modal-title').textContent = 'List New Workspace';
  document.getElementById('space-form').reset();
  document.getElementById('space-id-input').value = '';
  openModal('space-modal');
}

function openEditSpaceModal(spaceId) {
  const space = AppState.spaces.find((s) => s._id === spaceId);
  if (!space) return;

  editingSpaceId = spaceId;
  document.getElementById('space-modal-title').textContent = 'Edit Workspace';

  document.getElementById('space-id-input').value = space._id;
  document.getElementById('space-name-input').value = space.name || '';
  document.getElementById('space-type-select').value = space.type || 'hot-desk';
  document.getElementById('space-location-input').value = space.location || '';
  document.getElementById('space-price-input').value = space.pricePerHour || '';
  document.getElementById('space-capacity-input').value = space.capacity || '';
  document.getElementById('space-desc-input').value = space.description || '';
  document.getElementById('space-amenities-input').value = (space.amenities || []).join(', ');
  document.getElementById('space-image-input').value = (space.imageUrls && space.imageUrls[0]) || '';

  openModal('space-modal');
}

async function handleSpaceSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('space-name-input').value.trim();
  const type = document.getElementById('space-type-select').value;
  const location = document.getElementById('space-location-input').value.trim();
  const pricePerHour = Number(document.getElementById('space-price-input').value);
  const capacity = Number(document.getElementById('space-capacity-input').value);
  const description = document.getElementById('space-desc-input').value.trim();
  const amenitiesStr = document.getElementById('space-amenities-input').value.trim();
  const imageUrl = document.getElementById('space-image-input').value.trim();

  const amenities = amenitiesStr ? amenitiesStr.split(',').map((a) => a.trim()).filter(Boolean) : [];

  const payload = {
    name,
    type,
    location,
    pricePerHour,
    capacity,
    description,
    amenities,
    imageUrl: imageUrl || DEFAULT_IMAGES[type] || DEFAULT_IMAGES['desk']
  };

  const btn = document.getElementById('btn-save-space');
  btn.disabled = true;

  try {
    if (editingSpaceId) {
      await API.spaces.update(editingSpaceId, payload);
      showToast('Space Updated', 'Your workspace details have been saved.', 'success');
    } else {
      await API.spaces.create(payload);
      showToast('Space Listed! 🎉', 'Your new workspace is now live on DeskShare.', 'success');
    }

    closeModal('space-modal');
    await fetchSpaces();
    if (AppState.dashboardTab === 'spaces') {
      loadOwnerSpaces();
    }
  } catch (err) {
    showToast('Failed to Save Space', err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteSpace(spaceId) {
  if (!confirm('Are you sure you want to delete this space? All associated bookings will be affected.')) return;

  try {
    await API.spaces.delete(spaceId);
    showToast('Space Deleted', 'Workspace removed successfully.', 'info');
    await fetchSpaces();
    if (AppState.dashboardTab === 'spaces') {
      loadOwnerSpaces();
    }
  } catch (err) {
    showToast('Delete Failed', err.message, 'error');
  }
}

// Authentication Modal Logic
function openAuthModal(mode = 'login') {
  const loginTab = document.getElementById('auth-tab-login');
  const regTab = document.getElementById('auth-tab-register');
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');

  if (mode === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  } else {
    loginTab.classList.remove('active');
    regTab.classList.add('active');
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
  }

  openModal('auth-modal');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login-submit');

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await API.auth.login(email, password);
    AppState.user = res.user;
    updateNav();
    closeModal('auth-modal');
    showToast('Welcome Back!', `Logged in as ${res.user.name} (${res.user.role})`, 'success');
    applyFilters();
  } catch (err) {
    showToast('Login Failed', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.querySelector('input[name="reg-role"]:checked')?.value || 'user';
  const btn = document.getElementById('btn-reg-submit');

  if (password.length < 6) {
    showToast('Weak Password', 'Password must be at least 6 characters.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating Account...';

  try {
    const res = await API.auth.register(name, email, password, role);
    AppState.user = res.user;
    updateNav();
    closeModal('auth-modal');
    showToast('Account Created! 🎉', `Welcome to DeskShare, ${res.user.name}!`, 'success');
    applyFilters();
  } catch (err) {
    showToast('Registration Failed', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

// Quick Demo Login buttons
async function quickDemoLogin(role) {
  const credentials = {
    user: { email: 'user@deskshare.com', password: 'User@123' },
    owner: { email: 'owner@deskshare.com', password: 'Owner@123' }
  };

  const cred = credentials[role];
  if (!cred) return;

  try {
    showToast('Connecting...', `Signing into demo ${role} account...`, 'info');
    const res = await API.auth.login(cred.email, cred.password);
    AppState.user = res.user;
    updateNav();
    showToast('Demo Login Active ⚡', `Signed in as Demo ${role.toUpperCase()} (${cred.email})`, 'success');
    applyFilters();

    // If owner, switch or show owner capabilities
    const ownerTab = document.getElementById('dash-tab-spaces');
    if (ownerTab) ownerTab.style.display = res.user.role === 'owner' ? 'inline-flex' : 'none';
  } catch (err) {
    showToast('Demo Login Failed', err.message, 'error');
  }
}

function handleLogout() {
  API.auth.logout();
  AppState.user = null;
  updateNav();
  showToast('Logged Out', 'You have been signed out.', 'info');
  navigateTo('spaces');
  applyFilters();
}

// Page Navigation
function navigateTo(sectionId) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.target === sectionId);
  });

  const spacesSec = document.getElementById('section-spaces');
  const membershipsSec = document.getElementById('section-memberships');
  const dashboardSec = document.getElementById('section-dashboard');

  if (sectionId === 'spaces') {
    spacesSec.style.display = 'block';
    membershipsSec.style.display = 'block';
    dashboardSec.style.display = 'none';
    spacesSec.scrollIntoView({ behavior: 'smooth' });
  } else if (sectionId === 'memberships') {
    spacesSec.style.display = 'block';
    membershipsSec.style.display = 'block';
    dashboardSec.style.display = 'none';
    membershipsSec.scrollIntoView({ behavior: 'smooth' });
  } else if (sectionId === 'dashboard') {
    if (!AppState.user) {
      showToast('Authentication Needed', 'Please log in to view your dashboard.', 'info');
      openAuthModal('login');
      return;
    }
    spacesSec.style.display = 'none';
    membershipsSec.style.display = 'none';
    dashboardSec.style.display = 'block';

    const ownerTab = document.getElementById('dash-tab-spaces');
    if (ownerTab) {
      ownerTab.style.display = AppState.user.role === 'owner' ? 'inline-flex' : 'none';
    }

    switchDashboardTab(AppState.dashboardTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Check stored user session
  const storedUser = API.getUser();
  if (storedUser && API.getToken()) {
    AppState.user = storedUser;
    updateNav();
    // Validate session in background
    API.auth.getMe().then((res) => {
      AppState.user = res.user;
      updateNav();
    }).catch(() => {
      API.auth.logout();
      AppState.user = null;
      updateNav();
    });
  }

  // Setup Event Listeners
  // Search input with debounce
  let searchTimeout;
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        AppState.filters.keyword = e.target.value.trim();
        applyFilters();
      }, 250);
    });
  }

  // Type pills
  document.querySelectorAll('.type-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.type-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.filters.type = pill.dataset.type;
      applyFilters();
    });
  });

  // Sort select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.filters.sort = e.target.value;
      applyFilters();
    });
  }

  // Booking modal time changes
  const startInput = document.getElementById('booking-start-time');
  const endInput = document.getElementById('booking-end-time');
  if (startInput && endInput) {
    startInput.addEventListener('change', updateBookingCalculation);
    endInput.addEventListener('change', updateBookingCalculation);
  }

  // Form Submissions
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);

  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const regForm = document.getElementById('form-register');
  if (regForm) regForm.addEventListener('submit', handleRegister);

  const spaceForm = document.getElementById('space-form');
  if (spaceForm) spaceForm.addEventListener('submit', handleSpaceSubmit);

  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // Initial fetch
  await fetchSpaces();
});
