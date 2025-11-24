/* =========================================================
   Product Page + Mini Cart — script.js
   - Gallery controls (thumbs, ← → keys)
   - Variant selection (size/color)
   - Add/Remove/Qty with LocalStorage persistence
   - Accessible modal drawer (ESC + basic focus trap)
   ========================================================= */

// Helpers
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
document.documentElement.classList.remove('no-js');

// ----------------- Gallery -----------------
const heroImg = $('#heroImg');
const thumbs = $$('.thumb');
const prevBtn = $('#prevImg');
const nextBtn = $('#nextImg');

let currentIndex = 0;

function setHero(i) {
    const btn = thumbs[i];
    if (!btn) return;
    thumbs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    heroImg.src = btn.dataset.full;
    heroImg.alt = `Riviera Tee — ${btn.dataset.alt}`;
    currentIndex = i;
}

thumbs.forEach((b, i) => b.addEventListener('click', () => setHero(i)));
prevBtn.addEventListener('click', () => setHero((currentIndex - 1 + thumbs.length) % thumbs.length));
nextBtn.addEventListener('click', () => setHero((currentIndex + 1) % thumbs.length));

// Keyboard ← → on hero image
heroImg.tabIndex = 0;
heroImg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { setHero((currentIndex - 1 + thumbs.length) % thumbs.length); }
    if (e.key === 'ArrowRight') { setHero((currentIndex + 1) % thumbs.length); }
});

// ----------------- Variants & Qty -----------------
const color = () => ($('input[name="color"]:checked')?.value ?? 'Sand');
const size = () => ($('input[name="size"]:checked')?.value ?? 'M');
const qtyInput = $('#qty');
$('#incQty').addEventListener('click', () => qtyInput.value = Math.min(10, (+qtyInput.value || 1) + 1));
$('#decQty').addEventListener('click', () => qtyInput.value = Math.max(1, (+qtyInput.value || 1) - 1));

// ----------------- Cart State (LocalStorage) -----------------
const LS_KEY = 'mini-cart-v1';
const state = {
    items: loadLS()
};

function loadLS() {
    try { return JSON.parse(localStorage.getItem(LS_KEY))?.items || []; }
    catch { return []; }
}
function saveLS() {
    localStorage.setItem(LS_KEY, JSON.stringify({ items: state.items }));
}

function cartCount() {
    return state.items.reduce((n, it) => n + it.qty, 0);
}
function subtotal() {
    return state.items.reduce((s, it) => s + it.qty * it.price, 0);
}

// ----------------- Mini Cart UI -----------------
const cartBtn = $('#openCart');
const cartModal = $('#miniCart');
const closeCart = $('#closeCart');
const cartItemsEl = $('#cartItems');
const cartSubtotal = $('#cartSubtotal');
const cartCountBadge = $('#cartCount');
const checkoutBtn = $('#checkout');

function money(n) { return `$${n.toFixed(2)}`; }

function renderCart() {
    cartItemsEl.innerHTML = '';
    if (state.items.length === 0) {
        cartItemsEl.innerHTML = `<p class="muted">Your cart is empty.</p>`;
    } else {
        for (const it of state.items) {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
        <img src="${it.img}" alt="" width="64" height="64" />
        <div>
          <h4>${it.title}</h4>
          <div class="meta">${it.color} / ${it.size}</div>
          <div class="cart-qty">
            <button class="btn ghost" data-act="dec">−</button>
            <input type="number" min="1" max="10" value="${it.qty}" aria-label="Quantity for ${it.title}">
            <button class="btn ghost" data-act="inc">+</button>
          </div>
        </div>
        <div style="display:grid;gap:.4rem;justify-items:end">
          <strong>${money(it.price * it.qty)}</strong>
          <button class="remove" aria-label="Remove ${it.title}">Remove</button>
        </div>
      `;
            // Controls
            row.querySelector('[data-act="inc"]').addEventListener('click', () => { it.qty = Math.min(10, it.qty + 1); update(); });
            row.querySelector('[data-act="dec"]').addEventListener('click', () => { it.qty = Math.max(1, it.qty - 1); update(); });
            row.querySelector('input').addEventListener('change', (e) => { it.qty = Math.max(1, Math.min(10, +e.target.value || 1)); update(); });
            row.querySelector('.remove').addEventListener('click', () => { state.items = state.items.filter(x => x !== it); update(); });
            cartItemsEl.appendChild(row);
        }
    }
    cartSubtotal.textContent = money(subtotal());
    cartCountBadge.textContent = cartCount();
    saveLS();
}

function update() { renderCart(); }

// ----------------- Add to Cart -----------------
$('#addToCart').addEventListener('click', () => {
    const q = Math.max(1, Math.min(10, +qtyInput.value || 1));
    const itemKey = (it) => `${it.sku}-${it.color}-${it.size}`;
    const newItem = {
        sku: 'riviera-tee',
        title: 'Riviera Tee',
        color: color(),
        size: size(),
        price: 24.90,
        qty: q,
        img: thumbs[currentIndex].querySelector('img').src.replace('-thumb', '') // small image ok
    };
    // Merge if same variant exists
    const found = state.items.find(it => itemKey(it) === itemKey(newItem));
    if (found) found.qty = Math.min(10, found.qty + q);
    else state.items.push(newItem);
    update();
    openCart(); // show confirmation by opening cart
});

// “Buy now” just adds + opens cart in this demo
$('#buyNow').addEventListener('click', () => {
    $('#addToCart').click();
});

// ----------------- Modal (accessible) -----------------
let lastActive = null;

function openCart() {
    lastActive = document.activeElement;
    cartModal.hidden = false;
    cartBtn.setAttribute('aria-expanded', 'true');
    // Focus first focusable element in drawer
    setTimeout(() => { $('#closeCart').focus(); }, 0);
    // Lock scroll (simple)
    document.body.style.overflow = 'hidden';
}
function closeCartModal() {
    cartModal.hidden = true;
    cartBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    lastActive?.focus();
}

// Click handlers
cartBtn.addEventListener('click', () => openCart());
closeCart.addEventListener('click', closeCartModal);
cartModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeCartModal();
});

// ESC to close
document.addEventListener('keydown', (e) => {
    if (!cartModal.hidden && e.key === 'Escape') closeCartModal();
});

// Basic focus trap inside drawer
cartModal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', cartModal)
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// ----------------- Init -----------------
(function init() {
    // Set default hero & render cart
    setHero(0);
    renderCart();
    // Year
    $('#year').textContent = new Date().getFullYear();
})();
