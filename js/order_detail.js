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
<<<<<<< HEAD

const STATE_MAP = {
  unpaid:    "未付款",
  confirmed: "訂單成立",
  completed: "訂單完成",
  cancelled: "不成立",
};
const order_id = new URLSearchParams(location.search).get("id");
=======
const STATE_MAP = {
  unpaid:    "未付款", confirmed: "訂單成立",
  completed: "訂單完成", cancelled: "不成立",
};
const order_id = new URLSearchParams(location.search).get("id");
let allItems = [];
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
let editRentPicker = null;
let editReturnPicker = null;

flatpickr.localize(flatpickr.l10ns.zh_tw);

function renderDetail(order) {
<<<<<<< HEAD
  const user    = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  const isAdmin = user?.roles?.isAdmin === true;
  const isOwner = String(order.renter_id) === String(user?.member_id);

  const st   = STATE_MAP[order.order_state] || order.order_state;
  const days = Math.max(1, Math.round((new Date(order.return_date) - new Date(order.rent_date)) / 864e5));

=======
  const user  = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  const isAdmin = user?.roles?.isAdmin === true;

  const st = STATE_MAP[order.order_state] || order.order_state;
  const days = Math.max(1, Math.round((new Date(order.return_date) - new Date(order.rent_date)) / 864e5));
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
  const itemRows = order.items.length
    ? order.items.map(i => `<tr>
        <td style="font-family:monospace;font-size:11px;color:var(--t3);">${i.item_id}</td>
        <td style="font-weight:500;">${i.name}</td>
        <td>${i.type}</td>
        <td>${i.brand}</td>
        <td style="font-family:monospace;color:var(--amber);">${fmt(i.rental)}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--t3);">尚無明細</td></tr>`;

<<<<<<< HEAD
  // ── 付款面板：Renter 且訂單為 unpaid ────────────────────────────────
  const payPanel = (!isAdmin && isOwner && order.order_state === 'unpaid') ? `
    <div class="panel" id="pay-panel">
      <div class="panel__title">付款</div>
      <div id="pay-msg" class="msg-box"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:12px;color:var(--t3);margin-bottom:4px;">訂單金額</div>
          <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--amber);">${fmt(order.total_rental)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--t3);margin-bottom:4px;">錢包餘額</div>
          <div style="font-family:var(--font-mono);font-size:16px;font-weight:600;" id="wallet-balance-display">查詢中⋯</div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button id="btn-pay" class="btn-primary">確認付款</button>
        <a href="wallet.html" class="btn-secondary">前往儲值</a>
        <span style="font-size:12px;color:var(--t3);">付款後訂單狀態將更新為「訂單成立」</span>
      </div>
    </div>` : "";

  // ── Admin 編輯面板 ────────────────────────────────────────────────────
=======
  // Edit panel: Admin only
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
  const editPanel = isAdmin ? `
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
    </div>` : "";

  document.getElementById("detail-content").innerHTML = `
<<<<<<< HEAD
    ${location.search.includes("new=1") ? '<div class="msg-box success" style="display:block;">✓ 訂單已建立成功！請付款以確認訂單。</div>' : ""}

=======
    ${location.search.includes("new=1") ? '<div class="msg-box success" style="display:block;">✓ 訂單已建立成功！</div>' : ""}

    <!-- Order Info -->
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0;">訂單 #${order.order_id}</h1>
      <span class="order-state-badge order-state--${order.order_state}">${st}</span>
    </div>
<<<<<<< HEAD

=======
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
    <div class="panel">
      <div class="info-grid">
        <div><div class="info-item__label">租借人</div><div class="info-item__value">${order.renter_name}</div></div>
        <div><div class="info-item__label">訂單總金額</div><div class="info-item__value" style="color:var(--amber);">${fmt(order.total_rental)}</div></div>
        <div><div class="info-item__label">租借日期</div><div class="info-item__value">${order.rent_date}</div></div>
        <div><div class="info-item__label">歸還日期</div><div class="info-item__value">${order.return_date}</div></div>
        <div><div class="info-item__label">租借天數</div><div class="info-item__value">${days} 天</div></div>
      </div>
    </div>

<<<<<<< HEAD
    ${payPanel}
    ${editPanel}

=======
    ${editPanel}

    <!-- Items -->
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
    <div class="panel">
      <div class="panel__title">訂單明細</div>
      <div id="items-msg" class="msg-box"></div>
      <table class="items-table">
        <thead><tr><th>編號</th><th>名稱</th><th>類型</th><th>品牌</th><th>日租金</th></tr></thead>
        <tbody id="items-tbody">${itemRows}</tbody>
      </table>
    </div>`;

<<<<<<< HEAD
  // ── 付款按鈕邏輯 ─────────────────────────────────────────────────────
  if (!isAdmin && isOwner && order.order_state === 'unpaid') {
    // 先顯示目前錢包餘額
    fetch("api/wallet.php", { credentials: "same-origin" })
      .then(r => r.json())
      .then(data => {
        const el = document.getElementById("wallet-balance-display");
        if (!el) return;
        const balance = data.balance || 0;
        const enough  = balance >= parseFloat(order.total_rental);
        el.textContent = fmt(balance);
        el.style.color = enough ? "var(--green)" : "var(--red)";
        if (!enough) {
          const payBtn = document.getElementById("btn-pay");
          if (payBtn) { payBtn.disabled = true; payBtn.title = "餘額不足，請先儲值"; }
          showMsg("pay-msg", `錢包餘額不足，尚差 ${fmt(parseFloat(order.total_rental) - balance)}，請先儲值。`, "error");
        }
      }).catch(() => {
        const el = document.getElementById("wallet-balance-display");
        if (el) el.textContent = "無法取得";
      });

    // 付款按鈕
    document.getElementById("btn-pay").addEventListener("click", async () => {
      const btn = document.getElementById("btn-pay");
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = "付款中⋯";
      try {
        const r = await fetch("api/wallet_pay.php", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id }),
        });
        const data = await r.json();
        if (data.success) {
          loadDetail();
        } else {
          showMsg("pay-msg", data.message || "付款失敗", "error");
          btn.disabled = false; btn.textContent = "確認付款";
        }
      } catch(e) {
        showMsg("pay-msg", "網路錯誤", "error");
        btn.disabled = false; btn.textContent = "確認付款";
      }
    });
  }

  // ── Admin 編輯邏輯 ────────────────────────────────────────────────────
=======
  // Init flatpickr and save handler only for Admin
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
  if (isAdmin) {
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
      if (saveBtn) { saveBtn.disabled = lock; saveBtn.textContent = lock ? "儲存中⋯" : "儲存變更"; }
      if (stateEl) stateEl.disabled = lock;
      if (editRentPicker)   editRentPicker.set("clickOpens", !lock);
      if (editReturnPicker) editReturnPicker.set("clickOpens", !lock);
    }

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
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text; el.className = "msg-box " + type;
}

async function loadDetail() {
<<<<<<< HEAD
  if (!order_id) {
    document.getElementById("detail-content").innerHTML = '<div style="color:var(--red);padding:20px;">缺少訂單編號</div>';
    return;
  }
  try {
    const res       = await fetch(`api/order_detail.php?order_id=${order_id}`, { credentials: "same-origin" });
    const orderData = await res.json();
=======
  if (!order_id) { document.getElementById("detail-content").innerHTML = '<div style="color:var(--red);padding:20px;">缺少訂單編號</div>'; return; }
  try {
    const [orderRes, itemsRes] = await Promise.all([
      fetch(`api/order_detail.php?order_id=${order_id}`, { credentials: "same-origin" }),
      fetch("api/items.php"),
    ]);
    const orderData = await orderRes.json();
    const itemsData = await itemsRes.json();
    if (itemsData.success) allItems = itemsData.items;
>>>>>>> 85cee922cbe908c7b091f9001c975395b602f3a4
    if (orderData.success) renderDetail(orderData.order);
    else { localStorage.removeItem("lensrent_user"); window.location.href = `login.html?redirect=order_detail.html?id=${order_id}`; }
  } catch (e) {
    document.getElementById("detail-content").innerHTML = '<div style="color:var(--red);padding:20px;">載入失敗，請重新整理</div>';
  }
}

loadDetail();
