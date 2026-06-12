// ── item.js ───────────────────────────────────────────────────────────────────
const item_id = new URLSearchParams(location.search).get("id");
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

const RENT_LABEL = { available: "空置中", rented: "出租中", unavailable: "不可用" };

function renderSpecs(specsRaw) {
  let obj;
  try { obj = JSON.parse(specsRaw); } catch (e) { obj = null; }

  let body;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const rows = Object.entries(obj).map(([k, v]) =>
      `<tr><td>${k}</td><td>${v}</td></tr>`
    ).join("");
    body = `<table class="specs-table">${rows}</table>`;
  } else {
    body = `<p style="font-size:13px;line-height:1.8;color:var(--t2);white-space:pre-line;">${specsRaw}</p>`;
  }

  return `<div class="panel">
    <div class="panel__title">規格說明</div>
    ${body}
  </div>`;
}

function renderAuthButtons() {
  const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  const el = document.getElementById("auth-buttons");
  if (!el) return;
  if (user) {
    el.innerHTML = `<a href="profile.html" class="btn-user-menu">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${user.username}</a>`;
  } else {
    el.innerHTML = `<a href="login.html" class="btn-login">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      登入</a>
    <a href="register.html" class="btn-register">註冊</a>`;
  }
}

function updateCartBadge(count) {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle("visible", count > 0);
}

function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2200);
}

function showCartMsg(text, type) {
  const el = document.getElementById("cart-msg");
  if (!el) return;
  el.textContent = text;
  el.className = "msg-box " + type;
  el.style.display = "";
}

function renderItem(item, inCart, cartCount) {
  updateCartBadge(cartCount);
  document.title = `${item.name} — LensRent`;

  const available = item.rent_state === "available";
  const isEquip = item.type === "Equipment";
  const stLabel = RENT_LABEL[item.rent_state] || item.rent_state;
  const stClass = available ? "available" : "rented";

  const imgHtml = item.url
    ? `<img src="${item.url}" alt="${item.name}"
        onerror="this.style.display='none';document.getElementById('img-fallback').style.display='flex';">`
    : "";

  let btnHtml;
  if (!available) {
    btnHtml = `<button class="btn-primary" disabled style="opacity:.5;cursor:not-allowed;">
      ${item.rent_state === "rented" ? "目前已出租" : "暫不可租借"}
    </button>`;
  } else if (inCart) {
    btnHtml = `<button class="btn-primary" disabled style="opacity:.7;cursor:default;">✓ 已加入購物車</button>
      <a href="cart.html" class="btn-secondary" style="text-align:center;">前往購物車 →</a>`;
  } else {
    btnHtml = `<button id="btn-add-cart" class="btn-primary">＋ 加入購物車</button>`;
  }

  document.getElementById("item-content").innerHTML = `
    <div class="breadcrumb">
      <a href="index.html">首頁</a>
      <span style="margin:0 6px;">›</span>
      <a href="index.html">${isEquip ? "設備器材" : "配件周邊"}</a>
      <span style="margin:0 6px;">›</span>
      <span style="color:var(--t1);">${item.name}</span>
    </div>

    <div class="item-grid">
      <!-- Image -->
      <div class="item-image-box">
        <div id="img-fallback" class="item-image-fallback" style="display:${item.url ? "none" : "flex"};">
          ${isEquip ? "📷" : "🎒"}
        </div>
        ${imgHtml}
      </div>

      <!-- Info -->
      <div class="item-info-panel">
        <div>
          <div class="item-badges">
            <span class="badge-type badge-type--${isEquip ? "equipment" : "accessory"}">${isEquip ? "器材" : "配件"}</span>
            <span class="badge-state badge-state--${stClass}"><span class="badge-state__dot"></span>${stLabel}</span>
          </div>
          <h1 class="item-name" style="margin-top:10px;">${item.name}</h1>
          ${item.brand || item.model ? `<p class="item-model">${[item.brand, item.model].filter(Boolean).join(" · ")}</p>` : ""}
        </div>

        <div class="item-price-box">
          <div class="item-price-label">日租金</div>
          <div class="item-price-value">${fmt(item.rental)}<span class="item-price-unit"> /日</span></div>
        </div>

        <div class="item-actions">
          <div id="cart-msg" class="msg-box" style="display:none;"></div>
          ${btnHtml}
          <a href="index.html" class="btn-secondary" style="text-align:center;">← 繼續瀏覽</a>
        </div>

        <div style="font-size:12px;color:var(--t3);line-height:1.6;padding-top:4px;">
          <div>器材編號：<span style="font-family:var(--font-mono);">${item.item_id}</span></div>
          <div>類型：${item.type}</div>
        </div>
      </div>
    </div>

    ${item.description ? `
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel__title">器材描述</div>
      <p style="font-size:14px;line-height:1.8;color:var(--t2);white-space:pre-line;">${item.description}</p>
    </div>` : ""}

    ${item.specs ? renderSpecs(item.specs) : ""}
  `;

  const addBtn = document.getElementById("btn-add-cart");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
      if (!user) {
        showCartMsg("請先登入才能加入購物車", "error");
        setTimeout(() => { window.location.href = `login.html?redirect=item.html?id=${item_id}`; }, 1500);
        return;
      }
      addBtn.disabled = true;
      addBtn.textContent = "加入中⋯";
      try {
        const r = await fetch("api/cart.php", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", item_id: item.item_id, name: item.name, rental: item.rental }),
        });
        const data = await r.json();
        if (data.success) {
          updateCartBadge(data.count);
          showToast(`✓ 已將「${item.name}」加入購物車`);
          const actions = document.querySelector(".item-actions");
          if (actions) {
            const msgEl = document.getElementById("cart-msg");
            const msgHtml = msgEl ? msgEl.outerHTML : "";
            actions.innerHTML = `${msgHtml}
              <button class="btn-primary" disabled style="opacity:.7;cursor:default;">✓ 已加入購物車</button>
              <a href="cart.html" class="btn-secondary" style="text-align:center;">前往購物車 →</a>
              <a href="index.html" class="btn-secondary" style="text-align:center;">← 繼續瀏覽</a>`;
          }
        } else if (data.message === "請先登入") {
          localStorage.removeItem("lensrent_user");
          window.location.href = `login.html?redirect=item.html?id=${item_id}`;
        } else {
          showCartMsg(data.message || "加入失敗", "error");
          addBtn.disabled = false;
          addBtn.textContent = "＋ 加入購物車";
        }
      } catch (e) {
        showCartMsg("網路錯誤，請重試", "error");
        addBtn.disabled = false;
        addBtn.textContent = "＋ 加入購物車";
      }
    });
  }
}

function showError(text) {
  document.getElementById("item-content").innerHTML = `
    <div style="text-align:center;padding:80px 20px;color:var(--t3);">
      <div style="font-size:40px;margin-bottom:12px;">😕</div>
      <p style="font-size:16px;font-weight:600;margin-bottom:8px;">${text}</p>
      <a href="index.html" style="color:var(--amber);font-weight:600;">← 返回首頁</a>
    </div>`;
}

async function loadItem() {
  if (!item_id) { showError("缺少器材編號"); return; }
  try {
    const [itemRes, cartRes] = await Promise.all([
      fetch(`api/item_detail.php?item_id=${item_id}`),
      fetch("api/cart.php", { credentials: "same-origin" }),
    ]);
    const itemData = await itemRes.json();
    const cartData = await cartRes.json();
    if (!itemData.success) { showError(itemData.message || "找不到器材"); return; }
    const inCart = cartData.success && cartData.cart.some(c => String(c.item_id) === String(item_id));
    const cartCount = cartData.success ? (cartData.count || 0) : 0;
    renderItem(itemData.item, inCart, cartCount);
  } catch (e) {
    showError("載入失敗，請重新整理");
  }
}

renderAuthButtons();
loadItem();
