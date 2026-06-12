// ── order_detail.js ───────────────────────────────────────────────────────────
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

function renderAuthButtons() {
  const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  const el = document.getElementById("auth-buttons");
  if (!el) return;
  if (user) {
    el.innerHTML = `<a href="profile.html" class="btn-user-menu">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ${user.username}</a>`;
  } else {
    el.innerHTML = `<a href="login.html" class="btn-login">登入</a><a href="register.html" class="btn-register">註冊</a>`;
  }
}
renderAuthButtons();
const STATE_MAP = {
  unpaid:    "未付款", confirmed: "訂單成立",
  completed: "訂單完成", cancelled: "不成立",
};
const order_id = new URLSearchParams(location.search).get("id");
let allItems = [];
let editRentPicker = null;
let editReturnPicker = null;

flatpickr.localize(flatpickr.l10ns.zh_tw);

function renderDetail(order) {
  const st = STATE_MAP[order.order_state] || order.order_state;
  const days = Math.max(1, Math.round((new Date(order.return_date) - new Date(order.rent_date)) / 864e5));
  const itemRows = order.items.length
    ? order.items.map(i => `<tr>
        <td style="font-family:monospace;font-size:11px;color:var(--t3);">${i.item_id}</td>
        <td style="font-weight:500;">${i.name}</td>
        <td>${i.type}</td>
        <td>${i.brand}</td>
        <td style="font-family:monospace;color:var(--amber);">${fmt(i.rental)}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--t3);">尚無明細</td></tr>`;

  document.getElementById("detail-content").innerHTML = `
    ${location.search.includes("new=1") ? '<div class="msg-box success" style="display:block;">✓ 訂單已建立成功！</div>' : ""}

    <!-- Order Info -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0;">訂單 #${order.order_id}</h1>
      <span class="order-state-badge order-state--${order.order_state}">${st}</span>
    </div>
    <div class="panel">
      <div class="info-grid">
        <div><div class="info-item__label">租借人</div><div class="info-item__value">${order.renter_name}</div></div>
        <div><div class="info-item__label">訂單總金額</div><div class="info-item__value" style="color:var(--amber);">${fmt(order.total_rental)}</div></div>
        <div><div class="info-item__label">租借日期</div><div class="info-item__value">${order.rent_date}</div></div>
        <div><div class="info-item__label">歸還日期</div><div class="info-item__value">${order.return_date}</div></div>
        <div><div class="info-item__label">租借天數</div><div class="info-item__value">${days} 天</div></div>
      </div>
    </div>

    <!-- Edit Order -->
    <div class="panel">
      <div class="panel__title">編輯訂單</div>
      <div id="edit-msg" class="msg-box"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>租借日期</label>
          <input type="text" id="edit-rent" class="flatpickr-input" value="${order.rent_date}" readonly>
        </div>
        <div class="form-group">
          <label>歸還日期</label>
          <input type="text" id="edit-return" class="flatpickr-input" value="${order.return_date}" readonly>
        </div>
      </div>
      <div class="form-group">
        <label>訂單狀態</label>
        <select id="edit-state" class="form-input">
          ${Object.entries(STATE_MAP).map(([v, l]) =>
            `<option value="${v}" ${order.order_state === v ? "selected" : ""}>${l}</option>`
          ).join("")}
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button id="btn-save" class="btn-primary">儲存變更</button>
        <a href="orders.html" class="btn-secondary">取消</a>
      </div>
    </div>

    <!-- Items -->
    <div class="panel">
      <div class="panel__title">訂單明細</div>
      <div id="items-msg" class="msg-box"></div>
      <table class="items-table">
        <thead><tr><th>編號</th><th>名稱</th><th>類型</th><th>品牌</th><th>日租金</th></tr></thead>
        <tbody id="items-tbody">${itemRows}</tbody>
      </table>
    </div>`;

  // Init flatpickr — store at module level so save handler can lock/unlock them
  editRentPicker = flatpickr("#edit-rent", {
    dateFormat: "Y-m-d", altInput: true, altFormat: "Y年n月j日",
    defaultDate: order.rent_date,
    onChange: (d) => { if (d[0]) editReturnPicker.set("minDate", d[0]); },
  });
  editReturnPicker = flatpickr("#edit-return", {
    dateFormat: "Y-m-d", altInput: true, altFormat: "Y年n月j日",
    defaultDate: order.return_date, minDate: order.rent_date,
  });

  function lockEditForm(lock) {
    const saveBtn = document.getElementById("btn-save");
    const stateEl = document.getElementById("edit-state");
    if (saveBtn) { saveBtn.disabled = lock; if (lock) saveBtn.textContent = "儲存中⋯"; else saveBtn.textContent = "儲存變更"; }
    if (stateEl) stateEl.disabled = lock;
    if (editRentPicker)   editRentPicker.set("clickOpens", !lock);
    if (editReturnPicker) editReturnPicker.set("clickOpens", !lock);
  }

  // Save button
  document.getElementById("btn-save").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    const rent_date   = document.getElementById("edit-rent").value;
    const return_date = document.getElementById("edit-return").value;
    const order_state = document.getElementById("edit-state").value;
    lockEditForm(true);
    try {
      const r = await fetch("api/update_order.php", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, rent_date, return_date, order_state }),
      });
      const data = await r.json();
      if (data.success) {
        loadDetail();
      } else {
        showMsg("edit-msg", data.message || "更新失敗", "error");
        lockEditForm(false);
      }
    } catch (e) {
      showMsg("edit-msg", "網路錯誤", "error");
      lockEditForm(false);
    }
  });
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text; el.className = "msg-box " + type;
}

async function loadDetail() {
  if (!order_id) { document.getElementById("detail-content").innerHTML = '<div style="color:var(--red);padding:20px;">缺少訂單編號</div>'; return; }
  try {
    const [orderRes, itemsRes] = await Promise.all([
      fetch(`api/order_detail.php?order_id=${order_id}`, { credentials: "same-origin" }),
      fetch("api/items.php"),
    ]);
    const orderData = await orderRes.json();
    const itemsData = await itemsRes.json();
    if (itemsData.success) allItems = itemsData.items;
    if (orderData.success) renderDetail(orderData.order);
    else { localStorage.removeItem("lensrent_user"); window.location.href = `login.html?redirect=order_detail.html?id=${order_id}`; }
  } catch (e) {
    document.getElementById("detail-content").innerHTML = '<div style="color:var(--red);padding:20px;">載入失敗，請重新整理</div>';
  }
}

loadDetail();
