// ═══════════════════════════════════════════════════════════════════════════
// LensRent — Main Page App (Light Theme)
// ═══════════════════════════════════════════════════════════════════════════

const state = { search: "", activeCat: "all", cart: [], bannerIdx: 0, toastTimer: null };
const fmt = (n) => `NT$ ${n.toLocaleString("zh-TW")}`;
const $ = (sel) => document.querySelector(sel);

// ── Light theme banner backgrounds ──────────────────────────────────────
const BANNER_OVERRIDES = [
  { bg: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #451a03 100%)" },
  { bg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)" },
  { bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #172554 100%)" },
];

// ── Light theme promo tile backgrounds ──────────────────────────────────
const PROMO_OVERRIDES = [
  { bg: "linear-gradient(135deg, #065f46, #047857)" },
  { bg: "linear-gradient(135deg, #92400e, #b45309)" },
  { bg: "linear-gradient(135deg, #1e40af, #2563eb)" },
];

function getCartIds() { return new Set(state.cart.map(c => c.id)); }
function getCartCount() { return state.cart.reduce((s, c) => s + c.amount, 0); }
function getFilteredProducts() {
  let items = PRODUCTS;
  if (state.activeCat !== "all") items = items.filter(p => p.cat === state.activeCat);
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q));
  }
  return items;
}
function isShowFiltered() { return state.activeCat !== "all" || state.search.trim(); }

function addToCart(product) {
  if (product.rent_state !== "空置中") return;
  const ex = state.cart.find(c => c.id === product.id);
  if (ex) ex.amount++; else state.cart.push({ id: product.id, name: product.name, rental: product.rental, amount: 1 });
  showToast(product.name);
  render();
}

function showToast(name) {
  const toast = $("#toast");
  toast.textContent = "✓ 已將「" + name + "」加入租借清單";
  toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function renderProductCard(p, compact) {
  const rented = p.rent_state === "出租中";
  const inCart = getCartIds().has(p.id);
  const stClass = rented ? "rented" : "available";
  let corner = "";
  if (p.isNew) corner = '<span class="badge-corner badge-corner--new">NEW</span>';
  else if (p.hot) corner = '<span class="badge-corner badge-corner--hot">🔥 熱門</span>';
  let btnC = rented ? "btn-add--rented" : inCart ? "btn-add--incart" : "btn-add--available";
  let btnT = rented ? "已出租" : inCart ? "✓ 已加入" : "+ 租借";
  return `<div class="product-card${compact?' compact':''}"><div class="card-img"><span class="card-img__emoji">${p.img}</span><span class="badge-state badge-state--${stClass}"><span class="badge-state__dot"></span>${p.rent_state}</span>${corner}</div><div class="card-info"><div class="card-info__tags"><span class="badge-type badge-type--${p.item_type}">${p.item_type==='equipment'?'器材':'配件'}</span><span class="card-info__brand">${p.brand}</span></div><h3 class="card-info__name">${p.name}</h3><div class="card-info__bottom"><span class="card-info__price">${fmt(p.rental)}<span class="card-info__price-unit">/日</span></span><button class="btn-add-trigger btn-add ${btnC}" data-product-id="${p.id}" ${rented?'disabled':''}>${btnT}</button></div></div></div>`;
}

function renderBanner() {
  const b = BANNERS[state.bannerIdx];
  const o = BANNER_OVERRIDES[state.bannerIdx];
  const hero = $("#hero-inner");
  hero.style.background = o.bg;
  hero.style.borderColor = "transparent";
  $("#hero-circle-1").style.background = "rgba(255,255,255,0.06)";
  $("#hero-circle-2").style.background = "rgba(255,255,255,0.04)";
  $("#hero-label").style.color = "rgba(255,255,255,0.7)";
  $("#hero-title").textContent = b.title;
  $("#hero-sub").textContent = b.subtitle;
  const cta = $("#hero-cta");
  cta.textContent = b.cta;
  cta.style.background = "rgba(255,255,255,0.2)";
  cta.style.color = "#fff";
  cta.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
  $("#hero-dots").innerHTML = BANNERS.map((_, i) => {
    const active = i === state.bannerIdx;
    return `<button class="hero__dot hero__dot--${active?'active':'inactive'}" data-banner="${i}" style="background:${active?'#fff':'rgba(255,255,255,0.3)'}; width:${active?24:8}px;"></button>`;
  }).join("");
}

function renderCatNav() {
  $("#cat-nav").innerHTML = CATEGORIES.map(cat =>
    `<button class="cat-nav-btn${state.activeCat===cat.id?' active':''}" data-cat="${cat.id}">${cat.label}</button>`
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
  const homeView = $("#home-view");
  const filteredView = $("#filtered-view");
  if (isShowFiltered()) { homeView.classList.add("hidden"); filteredView.classList.remove("hidden"); renderFilteredView(); }
  else { filteredView.classList.add("hidden"); homeView.classList.remove("hidden"); renderHomeView(); }
}

function renderFilteredView() {
  const products = getFilteredProducts();
  const catLabel = CATEGORIES.find(c => c.id === state.activeCat)?.label || "全部商品";
  const title = state.search ? "「" + state.search + "」的搜尋結果" : catLabel;
  let clearBtn = state.activeCat !== "all" ? ' · <button class="filtered-view__clear" id="clear-filter">清除篩選</button>' : "";
  let content = products.length === 0
    ? '<div class="empty-state"><div class="empty-state__icon">🔍</div><p class="empty-state__title">找不到符合的器材</p><p class="empty-state__sub">試試其他分類或關鍵字</p></div>'
    : '<div class="product-grid">' + products.map(p => renderProductCard(p)).join("") + '</div>';
  $("#filtered-view").innerHTML = `<div class="filtered-view__header"><h1 class="filtered-view__title">${title}</h1><p class="filtered-view__meta">共 <span class="filtered-view__count">${products.length}</span> 項商品${clearBtn}</p></div>${content}`;
}

function renderHomeView() {
  const hot = PRODUCTS.filter(p => p.hot);
  const ne = PRODUCTS.filter(p => p.isNew);
  const eq = PRODUCTS.filter(p => p.item_type === "equipment");
  const ac = PRODUCTS.filter(p => p.item_type === "accessory");
  $("#hot-track").innerHTML = hot.map(p => renderProductCard(p, true)).join("");
  $("#promo-grid").innerHTML = PROMOS.map((promo, i) => {
    const bg = PROMO_OVERRIDES[i].bg;
    return `<div class="promo-tile" style="background:${bg}"><div class="promo-tile__bg-icon">${promo.icon}</div><div class="promo-tile__label" style="color:rgba(255,255,255,0.7)">限定方案</div><h3 class="promo-tile__title">${promo.title}</h3><p class="promo-tile__sub">${promo.sub}</p></div>`;
  }).join("");
  $("#new-grid").innerHTML = ne.map(p => renderProductCard(p)).join("");
  $("#equip-grid").innerHTML = eq.map(p => renderProductCard(p)).join("");
  $("#acc-grid").innerHTML = ac.map(p => renderProductCard(p)).join("");
}

function render() { renderCatNav(); renderCartBadge(); renderBanner(); renderContent(); renderAuthButtons(); }

function initEvents() {
  const si = $("#search-input"), sc = $("#search-clear");
  si.addEventListener("input", e => { state.search = e.target.value; sc.classList.toggle("visible", !!state.search); render(); });
  sc.addEventListener("click", () => { state.search = ""; si.value = ""; sc.classList.remove("visible"); render(); });
  $("#cat-nav").addEventListener("click", e => { const b = e.target.closest(".cat-nav-btn"); if (b) { state.activeCat = b.dataset.cat; render(); } });
  $("#hero-dots").addEventListener("click", e => { const d = e.target.closest(".hero__dot"); if (d) { state.bannerIdx = parseInt(d.dataset.banner); renderBanner(); } });
  $("#cat-tiles-grid").addEventListener("click", e => { const t = e.target.closest(".cat-tile"); if (t) { state.activeCat = t.dataset.cat; render(); } });
  $("#scroll-left").addEventListener("click", () => { $("#hot-track").scrollBy({ left: -260, behavior: "smooth" }); });
  $("#scroll-right").addEventListener("click", () => { $("#hot-track").scrollBy({ left: 260, behavior: "smooth" }); });
  document.body.addEventListener("click", e => {
    const ab = e.target.closest(".btn-add-trigger");
    if (ab && !ab.disabled) { e.stopPropagation(); const p = PRODUCTS.find(p => p.id === ab.dataset.productId); if (p) addToCart(p); return; }
    if (e.target.id === "clear-filter") { state.activeCat = "all"; render(); }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  initEvents();
  setInterval(() => { state.bannerIdx = (state.bannerIdx + 1) % BANNERS.length; renderBanner(); }, 5000);
});
