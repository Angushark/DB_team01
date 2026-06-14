// ═══════════════════════════════════════════════════════════════════════════
// LensRent — Main Page App (DB-driven)
// ═══════════════════════════════════════════════════════════════════════════

const state = {
  search: "", activeCat: "all",
  items: [], cartCount: 0, cartItemIds: new Set(),
  bannerIdx: 0, toastTimer: null,
  filterFrom: "", filterTo: "",
  unavailableIds: new Set(),
  dateFilterActive: false,
};
const fmt = (n) => `NT$ ${Number(n).toLocaleString("zh-TW")}`;
const $ = (sel) => document.querySelector(sel);

const CATEGORIES = [
  { id: "all",       label: "全部商品" },
  { id: "equipment", label: "設備器材" },
  { id: "accessory", label: "配件周邊" },
];

const SUB_TYPE_LABELS = {
  digital_camera: "數位相機", drone: "空拍機", film_camera: "底片相機",
  instant_camera: "拍立得",  action_camera: "運動相機", pocket_camera: "口袋相機",
  gimbal: "穩定器", "360_camera": "360相機", computer: "電腦",
  lighting: "燈光", audio: "音頻設備",
  lens: "鏡頭", tripod: "腳架", battery: "電池", storage: "記憶卡", filter: "濾鏡",
};

const BANNER_OVERRIDES = [
  { bg: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #451a03 100%)" },
  { bg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)" },
  { bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #172554 100%)" },
];
const PROMO_OVERRIDES = [
  { bg: "linear-gradient(135deg, #065f46, #047857)" },
  { bg: "linear-gradient(135deg, #92400e, #b45309)" },
  { bg: "linear-gradient(135deg, #1e40af, #2563eb)" },
];
const BANNERS = [
  { title: "頂級攝影器材，輕鬆租借", subtitle: "超過百款相機、鏡頭、配件任你選" },
  { title: "專業穩定器出租", subtitle: "拍出電影感，輕鬆駕馭每個場景" },
  { title: "全方位器材", subtitle: "一站式租借" },
];
const PROMOS = [
  { title: "首次租借優惠", sub: "新會員首單享 9 折", icon: "🎁" },
  { title: "長租特惠方案", sub: "租超過 7 天享 9 折 · 超過 30 天享 8 折", icon: "📅" },
  { title: "攝影師套組", sub: "相機＋鏡頭＋腳架一次租", icon: "📷", bundle: "photographer" },
];

const BUNDLES = {
  photographer: {
    title: "攝影師套組",
    sub: "相機＋鏡頭＋腳架，一次備齊",
    icon: "📷",
    items: [
      { item_id: "1",   name: "Sony A7M4 全片幅微單眼機身",      rental: 1200, url: "https://raw.githubusercontent.com/Angushark/DB_team01/main/img/1.jpg",    tag: "機身" },
      { item_id: "102", name: "Sony FE 24-70mm F2.8 GM II 鏡頭", rental: 800,  url: "https://raw.githubusercontent.com/Angushark/DB_team01/main/img/102.jpg",  tag: "鏡頭" },
      { item_id: "101", name: "Manfrotto 190XPRO 專業三腳架",    rental: 200,  url: "https://raw.githubusercontent.com/Angushark/DB_team01/main/img/101.jpeg", tag: "腳架" },
    ],
  },
};

// ── Date filter helpers ──────────────────────────────────────────────────────
function getDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchUnavailableIds() {
  if (!state.filterFrom || !state.filterTo) { state.unavailableIds = new Set(); return; }
  try {
    const r = await fetch(`api/available_dates_filter.php?from=${state.filterFrom}&to=${state.filterTo}`);
    const data = await r.json();
    if (data.success) state.unavailableIds = new Set(data.unavailable_item_ids.map(String));
  } catch (e) { state.unavailableIds = new Set(); }
}

function dateFilteredItems() {
  if (!state.dateFilterActive) return state.items;
  return state.items.filter(p => !state.unavailableIds.has(String(p.item_id)));
}

function updateFilterCount() {
  const countEl = document.getElementById("filter-count");
  if (!countEl) return;
  if (state.dateFilterActive) {
    countEl.textContent = `共 ${dateFilteredItems().length} 項可租借`;
  } else {
    countEl.textContent = "";
  }
}

let rentPicker = null;
let returnPicker = null;

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function saveDates(rentDate, returnDate) {
  localStorage.setItem("lensrent_dates", JSON.stringify({ rent_date: rentDate, return_date: returnDate }));
}

function initRentPickers(blocked) {
  if (!blocked) blocked = [];
  const locale = (flatpickr.l10ns && flatpickr.l10ns.zh_tw) ? flatpickr.l10ns.zh_tw : "default";

  var disableFn = blocked.length ? function(date) {
    return blocked.some(function(r) {
      var from = new Date(r.from + "T00:00:00");
      var to   = new Date(r.to   + "T00:00:00");
      return date >= from && date < to;
    });
  } : null;

  if (rentPicker) rentPicker.destroy();
  if (returnPicker) returnPicker.destroy();

  rentPicker = flatpickr("#rent-date", {
    dateFormat: "Y年n月j日",
    locale: locale,
    minDate: "today",
    disable: disableFn ? [disableFn] : [],
    onChange: async function(dates) {
      if (!dates[0]) return;
      state.filterFrom = fmtDate(dates[0]);
      returnPicker.set("minDate", dates[0]);
      if (!state.filterTo || state.filterTo <= state.filterFrom) {
        const next = new Date(dates[0]);
        next.setDate(next.getDate() + 1);
        state.filterTo = fmtDate(next);
        returnPicker.setDate(next, false);
      }
      if (state.dateFilterActive) { await fetchUnavailableIds(); render(); }
    },
  });

  returnPicker = flatpickr("#return-date", {
    dateFormat: "Y年n月j日",
    locale: locale,
    minDate: state.filterFrom ? new Date(state.filterFrom + "T00:00:00") : "today",
    disable: disableFn ? [disableFn] : [],
    onChange: async function(dates) {
      if (!dates[0]) return;
      state.filterTo = fmtDate(dates[0]);
      if (state.dateFilterActive) { await fetchUnavailableIds(); render(); }
    },
  });

  rentPicker.setDate(new Date(state.filterFrom + "T00:00:00"), false);
  returnPicker.setDate(new Date(state.filterTo + "T00:00:00"), false);

  const hint = document.getElementById("date-blocked-hint");
  if (hint) hint.style.display = blocked.length > 0 ? "block" : "none";
}

// ── Data transform ──────────────────────────────────────────────────────────
function transformItem(item) {
  const isEquip = item.type === "Equipment";
  const stateMap = { available: "可租借", rented: "租借中", unavailable: "不可租借" };
  return {
    id: item.item_id, item_id: item.item_id,
    name: item.name, brand: item.brand || "", model: item.model || "",
    item_type: isEquip ? "equipment" : "accessory",
    cat: isEquip ? "equipment" : "accessory",
    sub_type: isEquip ? (item.equipment_type || "") : (item.accessory_type || ""),
    rent_state: stateMap[item.rent_state] || "不可用",
    original_rent_state: item.rent_state,
    rental: parseFloat(item.rental) || 0,
    img: isEquip ? "📷" : "🎒",
    url: item.url || null,
    hot: false, isNew: false,
  };
}

// ── API helpers ─────────────────────────────────────────────────────────────
async function loadItems() {
  try {
    const r = await fetch("api/items.php");
    const data = await r.json();
    if (data.success) {
      state.items = data.items.map(transformItem);
    }
  } catch (e) { console.error("loadItems failed", e); }
}

async function loadCart() {
  try {
    const r = await fetch("api/cart.php", { credentials: "same-origin" });
    const data = await r.json();
    if (data.success) {
      state.cartCount = data.count;
      state.cartItemIds = new Set(data.cart.map(c => c.item_id));
    }
  } catch (e) {}
}

// ── Cart & filter helpers ────────────────────────────────────────────────────
function getCartIds() { return state.cartItemIds; }
function getCartCount() { return state.cartCount; }
function getFilteredProducts() {
  let items = dateFilteredItems();
  if (state.activeCat !== "all") {
    if (state.activeCat === "equipment" || state.activeCat === "accessory") {
      items = items.filter(p => p.cat === state.activeCat);
    } else {
      items = items.filter(p => p.sub_type === state.activeCat);
    }
  }
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    items = items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q)
    );
  }
  return items;
}
function isShowFiltered() { return state.activeCat !== "all" || state.search.trim(); }

// ── UI helpers ───────────────────────────────────────────────────────────────
// ── Render functions ─────────────────────────────────────────────────────────
function renderProductCard(p, compact) {
  const available = p.original_rent_state === "available";
  const inCart    = getCartIds().has(p.id);
  const stClass   = available ? "available" : "rented";
  let corner = "";
  if (p.isNew) corner = '<span class="badge-corner badge-corner--new">NEW</span>';
  else if (p.hot) corner = '<span class="badge-corner badge-corner--hot">🔥 熱門</span>';
  const imgTag = p.url
    ? `<img src="${p.url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextSibling.style.display='block'"><span class="card-img__emoji" style="display:none">${p.img}</span>`
    : `<span class="card-img__emoji">${p.img}</span>`;
  const hint = inCart
    ? `<span style="font-size:11px;color:var(--green);font-weight:600;">✓ 已加入</span>`
    : (state.dateFilterActive || available
      ? `<span style="font-size:11px;color:var(--amber);font-weight:600;">查看詳情 →</span>`
      : `<span style="font-size:11px;color:var(--t3);">${p.rent_state}</span>`);
  const stateBadge = state.dateFilterActive ? "" : `<span class="badge-state badge-state--${stClass}"><span class="badge-state__dot"></span>${p.rent_state}</span>`;
  return `<a href="item.html?id=${p.id}" class="product-card${compact ? " compact" : ""}" style="text-decoration:none;color:inherit;display:block;">
    <div class="card-img">${imgTag}${stateBadge}${corner}
    </div>
    <div class="card-info">
      <div class="card-info__tags">
        <span class="badge-type badge-type--${p.item_type}">${p.item_type === "equipment" ? "器材" : "配件"}</span>
        <span class="card-info__brand">${p.brand}</span>
      </div>
      <h3 class="card-info__name">${p.name}</h3>
      <div class="card-info__bottom">
        <span class="card-info__price">${fmt(p.rental)}<span class="card-info__price-unit">/日</span></span>
        ${hint}
      </div>
    </div>
  </a>`;
}

function renderBanner() {
  const b = BANNERS[state.bannerIdx], o = BANNER_OVERRIDES[state.bannerIdx];
  const hero = $("#hero-inner");
  hero.style.background = o.bg;
  hero.style.borderColor = "transparent";
  $("#hero-circle-1").style.background = "rgba(255,255,255,0.06)";
  $("#hero-circle-2").style.background = "rgba(255,255,255,0.04)";
  $("#hero-label").style.color = "rgba(255,255,255,0.7)";
  $("#hero-title").textContent = b.title;
  $("#hero-sub").textContent = b.subtitle;
  $("#hero-dots").innerHTML = BANNERS.map((_, i) => {
    const active = i === state.bannerIdx;
    return `<button class="hero__dot hero__dot--${active ? "active" : "inactive"}" data-banner="${i}" style="background:${active ? "#fff" : "rgba(255,255,255,0.3)"}; width:${active ? 24 : 8}px;"></button>`;
  }).join("");
}

function renderCatNav() {
  $("#cat-nav").innerHTML = CATEGORIES.map(cat =>
    `<button class="cat-nav-btn${state.activeCat === cat.id ? " active" : ""}" data-cat="${cat.id}">${cat.label}</button>`
  ).join("");
}

function renderCartBadge() {
  const badge = $("#cart-badge");
  const count = getCartCount();
  badge.textContent = count;
  badge.classList.toggle("visible", count > 0);
}

function renderAuthButtons() {
  const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  const el = $("#auth-buttons");
  if (user) {
    el.innerHTML = `<a href="profile.html" class="btn-user-menu"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${user.username}</a>`;
  } else {
    el.innerHTML = `<a href="login.html" class="btn-login"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 登入</a><a href="register.html" class="btn-register">註冊</a>`;
  }
}

function renderContent() {
  const homeView = $("#home-view"), filteredView = $("#filtered-view");
  if (isShowFiltered()) { homeView.classList.add("hidden"); filteredView.classList.remove("hidden"); renderFilteredView(); }
  else { filteredView.classList.add("hidden"); homeView.classList.remove("hidden"); renderHomeView(); }
}

function renderFilteredView() {
  const products = getFilteredProducts();
  const catLabel = CATEGORIES.find(c => c.id === state.activeCat)?.label || SUB_TYPE_LABELS[state.activeCat] || "全部商品";
  const title = state.search ? "「" + state.search + "」的搜尋結果" : catLabel;
  let clearBtn = state.activeCat !== "all" ? ' · <button class="filtered-view__clear" id="clear-filter">清除篩選</button>' : "";
  let content = products.length === 0
    ? '<div class="empty-state"><div class="empty-state__icon">🔍</div><p class="empty-state__title">找不到符合的器材</p><p class="empty-state__sub">試試其他分類或關鍵字</p></div>'
    : '<div class="product-grid">' + products.map(p => renderProductCard(p)).join("") + "</div>";
  $("#filtered-view").innerHTML = `<div class="filtered-view__header"><h1 class="filtered-view__title">${title}</h1><p class="filtered-view__meta">共 <span class="filtered-view__count">${products.length}</span> 項商品${clearBtn}</p></div>${content}`;
}

function renderHomeView() {
  const items = dateFilteredItems();
  const eq = items.filter(p => p.item_type === "equipment");
  const ac = items.filter(p => p.item_type === "accessory");
  $("#promo-grid").innerHTML = PROMOS.map((promo, i) => {
    const bg = PROMO_OVERRIDES[i].bg;
    const bundleAttr = promo.bundle ? ` data-bundle="${promo.bundle}"` : "";
    const bundleCls  = promo.bundle ? " promo-tile--bundle" : "";
    const hint = promo.bundle ? `<p class="promo-tile__hint">點擊查看套組內容 →</p>` : "";
    return `<div class="promo-tile${bundleCls}" style="background:${bg}"${bundleAttr}><div class="promo-tile__bg-icon">${promo.icon}</div><div class="promo-tile__label" style="color:rgba(255,255,255,0.7)">限定方案</div><h3 class="promo-tile__title">${promo.title}</h3><p class="promo-tile__sub">${promo.sub}</p>${hint}</div>`;
  }).join("");
  $("#new-grid").innerHTML = items.slice(-4).map(p => renderProductCard(p)).join("");
  $("#equip-grid").innerHTML = eq.map(p => renderProductCard(p)).join("");
  $("#acc-grid").innerHTML = ac.map(p => renderProductCard(p)).join("");
}

function render() { renderCatNav(); renderCartBadge(); renderBanner(); renderContent(); renderAuthButtons(); updateFilterCount(); }

// ── Bundle Modal ──────────────────────────────────────────────────────────────
function openBundleModal(bundleId) {
  const bundle  = BUNDLES[bundleId];
  if (!bundle) return;
  const overlay = document.getElementById("bundle-overlay");
  const box     = document.getElementById("bundle-modal-box");
  const total   = bundle.items.reduce((s, it) => s + it.rental, 0);
  const allInCart = bundle.items.every(it => state.cartItemIds.has(String(it.item_id)));

  box.innerHTML = `
    <button class="bundle-modal__close" id="bundle-close" aria-label="關閉">✕</button>
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="font-size:18px;font-weight:700;color:var(--t1);margin:0 0 4px;">${bundle.title}</h2>
      <p style="font-size:12px;color:var(--t3);margin:0;">${bundle.sub}</p>
    </div>
    <div class="bundle-items-grid">
      ${bundle.items.map(it => {
        const inCart = state.cartItemIds.has(String(it.item_id));
        return `<div class="bundle-item${inCart ? " in-cart" : ""}">
          <div class="bundle-item__img">
            <img src="${it.url}" alt="${it.name}" onerror="this.style.display='none'">
          </div>
          <div class="bundle-item__info">
            ${inCart
              ? `<div class="bundle-item__in-cart">✓ 已在購物車</div>`
              : `<div class="bundle-item__tag">${it.tag}</div>`}
            <div class="bundle-item__name">${it.name}</div>
            <div class="bundle-item__price">NT$ ${it.rental.toLocaleString("zh-TW")}<span> /日</span></div>
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="bundle-total">
      <span style="font-size:13px;color:var(--t2);">套組每日合計</span>
      <span style="font-size:18px;font-weight:700;color:var(--amber);">NT$ ${total.toLocaleString("zh-TW")}</span>
    </div>
    <button class="bundle-modal__btn${allInCart ? " all-added" : ""}" id="bundle-add-all"${allInCart ? " disabled" : ""}>
      ${allInCart ? "✓ 已全部加入購物車" : "＋ 全部加入購物車"}
    </button>`;

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  document.getElementById("bundle-close").addEventListener("click", closeBundleModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeBundleModal(); });

  const addBtn = document.getElementById("bundle-add-all");
  if (addBtn && !allInCart) addBtn.addEventListener("click", () => addBundleToCart(bundleId));
}

function closeBundleModal() {
  document.getElementById("bundle-overlay").style.display = "none";
  document.body.style.overflow = "";
}

async function addBundleToCart(bundleId) {
  const bundle = BUNDLES[bundleId];
  const user   = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  if (!user) {
    closeBundleModal();
    setTimeout(() => { window.location.href = "login.html?redirect=index.html"; }, 100);
    return;
  }

  const btn = document.getElementById("bundle-add-all");
  if (btn) { btn.disabled = true; btn.textContent = "加入中⋯"; }

  let added = 0;
  for (const it of bundle.items) {
    if (state.cartItemIds.has(String(it.item_id))) continue;
    try {
      const r = await fetch("api/cart.php", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", item_id: it.item_id, name: it.name, rental: it.rental }),
      });
      const data = await r.json();
      if (data.success) { state.cartItemIds.add(String(it.item_id)); state.cartCount = data.count; added++; }
    } catch (_) {}
  }

  closeBundleModal();
  renderCartBadge();
  render();
  if (added > 0) showToast(`✓ 已加入 ${added} 件套組商品至購物車`);
  else showToast("套組商品皆已在購物車中");
}

function initEvents() {
  const si = $("#search-input"), sc = $("#search-clear");
  si.addEventListener("input", e => { state.search = e.target.value; sc.classList.toggle("visible", !!state.search); render(); });
  sc.addEventListener("click", () => { state.search = ""; si.value = ""; sc.classList.remove("visible"); render(); });
  $("#cat-nav").addEventListener("click", e => { const b = e.target.closest(".cat-nav-btn"); if (b) { state.activeCat = b.dataset.cat; render(); } });
  $("#hero-dots").addEventListener("click", e => { const d = e.target.closest(".hero__dot"); if (d) { state.bannerIdx = parseInt(d.dataset.banner); renderBanner(); } });
  $("#cat-tiles-grid").addEventListener("click", e => { const t = e.target.closest(".cat-tile"); if (t) { state.activeCat = t.dataset.cat; render(); } });
  document.body.addEventListener("click", e => {
    if (e.target.id === "clear-filter") { state.activeCat = "all"; render(); }
  });

  document.getElementById("promo-grid").addEventListener("click", e => {
    const tile = e.target.closest(".promo-tile[data-bundle]");
    if (tile) openBundleModal(tile.dataset.bundle);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeBundleModal();
  });

  const btnConfirm = $("#btn-filter-confirm");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", async () => {
      if (state.dateFilterActive) {
        state.dateFilterActive = false;
        state.unavailableIds = new Set();
        btnConfirm.textContent = "確認篩選";
        render();
        return;
      }
      if (!state.filterFrom || !state.filterTo) return;
      state.dateFilterActive = true;
      btnConfirm.disabled = true;
      btnConfirm.textContent = "篩選中⋯";
      await fetchUnavailableIds();
      render();
      btnConfirm.disabled = false;
      btnConfirm.textContent = "取消篩選";
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  state.filterFrom = getDateStr(0);
  state.filterTo   = getDateStr(1);

  await Promise.all([loadItems(), loadCart()]);

  // Fetch blocked dates from items currently in cart
  let blocked = [];
  if (state.cartItemIds.size > 0) {
    try {
      const ids = [...state.cartItemIds].join(",");
      const r = await fetch(`api/item_unavailable_dates.php?item_ids=${ids}`);
      const data = await r.json();
      if (data.success) blocked = data.blocked;
    } catch (e) {}
  }

  render();
  initEvents();
  initRentPickers(blocked);
  setInterval(() => { state.bannerIdx = (state.bannerIdx + 1) % BANNERS.length; renderBanner(); }, 5000);
});
