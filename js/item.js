// ── item.js ───────────────────────────────────────────────────────────────────
const item_id = new URLSearchParams(location.search).get("id");
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

const RENT_LABEL = { available: "可租借", rented: "租借中", unavailable: "不可租借" };

const EQUIP_TYPE_LABELS = {
  digital_camera: "數位相機", drone: "空拍機", film_camera: "底片相機",
  instant_camera: "拍立得", action_camera: "運動相機", pocket_camera: "口袋相機",
  gimbal: "穩定器", "360_camera": "360相機", computer: "電腦",
  lighting: "燈光", audio: "音頻設備",
};
const ACC_TYPE_LABELS = {
  lens: "鏡頭", tripod: "腳架", battery: "電池", storage: "記憶卡", filter: "濾鏡",
};

function renderSpecs(item) {
  const rows = [];

  if (item.type === "Equipment") {
    const fields = [
      ["equipment_type", "設備類型",   v => EQUIP_TYPE_LABELS[v] || v],
      ["serial_number",  "序號",        null],
      ["e_mount_type",   "卡口",        null],
      ["sensor_size",    "感光元件",    null],
      ["max_resolution", "最高解析度",  null],
      ["weight",         "重量",        null],
      ["battery",        "電池型號",    null],
    ];
    for (const [key, label, fmt] of fields) {
      const v = item[key];
      if (v !== null && v !== undefined && v !== "") {
        rows.push(`<tr><td>${label}</td><td>${fmt ? fmt(v) : v}</td></tr>`);
      }
    }
  } else {
    const fields = [
      ["accessory_type", "配件類型",     v => ACC_TYPE_LABELS[v] || v],
      ["a_mount_type",   "卡口",         null],
      ["focal_length",   "焦距",         null],
      ["aperture",       "光圈",         null],
      ["filter_size",    "濾鏡尺寸",     v => v + " mm"],
    ];
    for (const [key, label, fmt] of fields) {
      const v = item[key];
      if (v !== null && v !== undefined && v !== "" && v !== 0) {
        rows.push(`<tr><td>${label}</td><td>${fmt ? fmt(v) : v}</td></tr>`);
      }
    }
  }

  // specs JSON 欄位（從 Item.specs 欄位）
  if (item.specs) {
    let obj;
    try { obj = JSON.parse(item.specs); } catch (e) { obj = null; }
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        rows.push(`<tr><td>${k}</td><td>${v}</td></tr>`);
      }
    } else {
      rows.push(`<tr><td colspan="2" style="white-space:pre-line;">${item.specs}</td></tr>`);
    }
  }

  if (rows.length === 0) return "";
  return `<div class="panel">
    <div class="panel__title">規格說明</div>
    <table class="specs-table">${rows.join("")}</table>
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
  document.title = `${item.name} — 10gear 拾光機`;

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
      ${item.rent_state === "rented" ? "租借中" : "不可租借"}
    </button>`;
  } else if (inCart) {
    btnHtml = `<button class="btn-primary" disabled style="opacity:.7;cursor:default;">✓ 已加入購物車</button>`;
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

    ${renderSpecs(item)}

    <div id="related-section"></div>
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
              <button class="btn-primary" disabled style="opacity:.7;cursor:default;">✓ 已加入購物車</button>`;
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

function renderRelated(related, oppositeType) {
  const el = document.getElementById("related-section");
  if (!el || related.length === 0) return;
  const label = oppositeType === "Accessory" ? "配套配件" : "適用機身";
  const stateMap = { available: "可租借", rented: "租借中", unavailable: "不可租借" };
  const cards = related.map(r => {
    const st = stateMap[r.rent_state] || r.rent_state;
    const stCls = r.rent_state === "available" ? "available" : "rented";
    const imgTag = r.url
      ? `<img src="${r.url}" alt="${r.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><span class="card-img__emoji" style="display:none">${r.type === "Equipment" ? "📷" : "🎒"}</span>`
      : `<span class="card-img__emoji">${r.type === "Equipment" ? "📷" : "🎒"}</span>`;
    return `<a href="item.html?id=${r.item_id}" class="product-card compact" style="text-decoration:none;color:inherit;display:block;">
      <div class="card-img">${imgTag}
        <span class="badge-state badge-state--${stCls}"><span class="badge-state__dot"></span>${st}</span>
      </div>
      <div class="card-info">
        <div class="card-info__tags">
          <span class="badge-type badge-type--${r.type === "Equipment" ? "equipment" : "accessory"}">${r.type === "Equipment" ? "器材" : "配件"}</span>
          <span class="card-info__brand">${r.brand}</span>
        </div>
        <h3 class="card-info__name">${r.name}</h3>
        <div class="card-info__bottom">
          <span class="card-info__price">NT$ ${Number(r.rental).toLocaleString("zh-TW")}<span class="card-info__price-unit">/日</span></span>
        </div>
      </div>
    </a>`;
  }).join("");
  el.innerHTML = `<div class="panel" style="margin-top:16px;">
    <div class="panel__title">${label}</div>
    <div class="product-grid" style="margin-top:12px;">${cards}</div>
  </div>`;
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
    const [itemRes, cartRes, relatedRes] = await Promise.all([
      fetch(`api/item_detail.php?item_id=${item_id}`),
      fetch("api/cart.php", { credentials: "same-origin" }),
      fetch(`api/item_related.php?item_id=${item_id}`),
    ]);
    const itemData = await itemRes.json();
    const cartData = await cartRes.json();
    const relatedData = await relatedRes.json();
    if (!itemData.success) { showError(itemData.message || "找不到器材"); return; }
    const inCart = cartData.success && cartData.cart.some(c => String(c.item_id) === String(item_id));
    const cartCount = cartData.success ? (cartData.count || 0) : 0;
    renderItem(itemData.item, inCart, cartCount);
    if (relatedData.success && relatedData.related.length > 0) {
      renderRelated(relatedData.related, relatedData.opposite_type);
    }
  } catch (e) {
    showError("載入失敗，請重新整理");
  }
}

renderAuthButtons();
loadItem();
