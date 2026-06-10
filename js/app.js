// ═══════════════════════════════════════════════════════════════════════════
// LensRent — Main Page App (DB-driven)
// ═══════════════════════════════════════════════════════════════════════════

const state = {
  search: "", activeCat: "all",
  items: [], cartCount: 0, cartItemIds: new Set(),
  bannerIdx: 0, toastTimer: null
};
const fmt = (n) => `NT$ ${Number(n).toLocaleString("zh-TW")}`;
const $ = (sel) => document.querySelector(sel);

const CATEGORIES = [
  { id: "all",       label: "全部商品", icon: "📦" },
  { id: "equipment", label: "設備器材", icon: "📷" },
  { id: "accessory", label: "配件周邊", icon: "🎒" },
];

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
  { title: "頂級攝影器材，輕鬆租借", subtitle: "超過百款相機、鏡頭、配件任你選", cta: "立即瀏覽" },
  { title: "專業穩定器出租", subtitle: "拍出電影感，輕鬆駕馭每個場景", cta: "查看穩定器" },
  { title: "全套燈光設備租借", subtitle: "商業攝影、婚禮記錄一次搞定", cta: "瀏覽燈光設備" },
];
const PROMOS = [
  { title: "首次租借優惠", sub: "新會員首單享 9 折", icon: "🎁" },
  { title: "長租特惠方案", sub: "租借 7 天以上享折扣", icon: "📅" },
  { title: "攝影師套組", sub: "相機＋鏡頭＋腳架一次租", icon: "📷" },
];

// ── Data transform ──────────────────────────────────────────────────────────
function transformItem(item) {
  const isEquip = item.type === "Equipment";
  const stateMap = { available: "空置中", rented: "出租中", unavailable: "不可用" };
  return {
    id: item.item_id, item_id: item.item_id,
    name: item.name, brand: item.brand || "", model: item.model || "",
    item_type: isEquip ? "equipment" : "accessory",
    cat: isEquip ? "equipment" : "accessory",
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
    if (data.success) state.items = data.items.map(transformItem);
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
  let items = state.items;
  if (state.activeCat !== "all") items = items.filter(p => p.cat === state.activeCat);
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

async function addToCart(product) {
  if (product.original_rent_state !== "available") return;
  try {
    const r = await fetch("api/cart.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", item_id: product.id, name: product.name, rental: product.rental }),
    });
    const data = await r.json();
    if (data.success) {
      state.cartCount = data.count;
      state.cartItemIds.add(product.id);
      showToast(product.name);
      render();
    }
  } catch (e) {}
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function showToast(name) {
  const toast = $("#toast");
  toast.textContent = "✓ 已將「" + name + "」加入租借清單";
  toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

// ── Render functions ─────────────────────────────────────────────────────────
function renderProductCard(p, compact) {
  const available = p.original_rent_state === "available";
  const rented    = p.original_rent_state === "rented";
  const inCart    = getCartIds().has(p.id);
  const stClass   = available ? "available" : "rented";
  let corner = "";
  if (p.isNew) corner = '<span class="badge-corner badge-corner--new">NEW</span>';
  else if (p.hot) corner = '<span class="badge-corner badge-corner--hot">🔥 熱門</span>';
  let btnC, btnT;
  if (!available) { btnC = "btn-add--rented"; btnT = rented ? "已出租" : "不可用"; }
  else if (inCart) { btnC = "btn-add--incart"; btnT = "✓ 已加入"; }
  else { btnC = "btn-add--available"; btnT = "+ 租借"; }
  const imgTag = p.url
    ? `<img src="${p.url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';this.nextSibling.style.display='block'"><span class="card-img__emoji" style="display:none">${p.img}</span>`
    : `<span class="card-img__emoji">${p.img}</span>`;
  return `<div class="product-card${compact ? " compact" : ""}">
    <div class="card-img">${imgTag}
      <span class="badge-state badge-state--${stClass}"><span class="badge-state__dot"></span>${p.rent_state}</span>${corner}
    </div>
    <div class="card-info">
      <div class="card-info__tags">
        <span class="badge-type badge-type--${p.item_type}">${p.item_type === "equipment" ? "器材" : "配件"}</span>
        <span class="card-info__brand">${p.brand}</span>
      </div>
      <h3 class="card-info__name">${p.name}</h3>
      <div class="card-info__bottom">
        <span class="card-info__price">${fmt(p.rental)}<span class="card-info__price-unit">/日</span></span>
        <button class="btn-add-trigger btn-add ${btnC}" data-product-id="${p.id}" ${!available ? "disabled" : ""}>${btnT}</button>
      </div>
    </div>
  </div>`;
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
  const cta = $("#hero-cta");
  cta.textContent = b.cta;
  cta.style.background = "rgba(255,255,255,0.2)";
  cta.style.color = "#fff";
  cta.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
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
  const catLabel = CATEGORIES.find(c => c.id === state.activeCat)?.label || "全部商品";
  const title = state.search ? "「" + state.search + "」的搜尋結果" : catLabel;
  let clearBtn = state.activeCat !== "all" ? ' · <button class="filtered-view__clear" id="clear-filter">清除篩選</button>' : "";
  let content = products.length === 0
    ? '<div class="empty-state"><div class="empty-state__icon">🔍</div><p class="empty-state__title">找不到符合的器材</p><p class="empty-state__sub">試試其他分類或關鍵字</p></div>'
    : '<div class="product-grid">' + products.map(p => renderProductCard(p)).join("") + "</div>";
  $("#filtered-view").innerHTML = `<div class="filtered-view__header"><h1 class="filtered-view__title">${title}</h1><p class="filtered-view__meta">共 <span class="filtered-view__count">${products.length}</span> 項商品${clearBtn}</p></div>${content}`;
}

function renderHomeView() {
  const items = state.items;
  const eq = items.filter(p => p.item_type === "equipment");
  const ac = items.filter(p => p.item_type === "accessory");
  $("#hot-track").innerHTML = items.slice(0, 6).map(p => renderProductCard(p, true)).join("");
  $("#promo-grid").innerHTML = PROMOS.map((promo, i) => {
    const bg = PROMO_OVERRIDES[i].bg;
    return `<div class="promo-tile" style="background:${bg}"><div class="promo-tile__bg-icon">${promo.icon}</div><div class="promo-tile__label" style="color:rgba(255,255,255,0.7)">限定方案</div><h3 class="promo-tile__title">${promo.title}</h3><p class="promo-tile__sub">${promo.sub}</p></div>`;
  }).join("");
  $("#new-grid").innerHTML = items.slice(-4).map(p => renderProductCard(p)).join("");
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
    if (ab && !ab.disabled) {
      e.stopPropagation();
      const p = state.items.find(p => p.id === ab.dataset.productId);
      if (p) addToCart(p).catch(() => {});
      return;
    }
    if (e.target.id === "clear-filter") { state.activeCat = "all"; render(); }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadItems(), loadCart()]);
  render();
  initEvents();
  setInterval(() => { state.bannerIdx = (state.bannerIdx + 1) % BANNERS.length; renderBanner(); }, 5000);
});
