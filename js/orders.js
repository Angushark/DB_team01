// ── orders.js ─────────────────────────────────────────────────────────────────
const STATE_MAP = {
  unpaid:    { label: "未付款",   cls: "unpaid" },
  confirmed: { label: "訂單成立", cls: "confirmed" },
  completed: { label: "訂單完成", cls: "completed" },
  cancelled: { label: "不成立",   cls: "cancelled" },
};
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

function renderOrders(orders) {
  const el = document.getElementById("orders-content");
  if (!orders.length) {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--t3);">
      
      <p style="font-weight:600;">目前沒有訂單</p>
      <a href="index.html" style="color:var(--amber);font-weight:700;font-size:13px;">去瀏覽器材 →</a>
    </div>`;
    return;
  }
  el.innerHTML = orders.map(o => {
    const st = STATE_MAP[o.order_state] || { label: o.order_state, cls: "unpaid" };
    return `<div class="order-card">
      <div class="order-card__header">
        <span class="order-card__id">訂單 #${o.order_id}</span>
        <span class="order-state-badge order-state--${st.cls}">${st.label}</span>
      </div>
      <div class="order-card__dates">租借期間：${o.rent_date} → ${o.return_date}</div>
      <div class="order-card__total">${fmt(o.total_rental)}</div>
      <div class="order-card__actions">
        <a href="order_detail.html?id=${o.order_id}" class="btn-action btn-action--view">查看 / 編輯</a>
        <button class="btn-action btn-action--delete" data-id="${o.order_id}">刪除</button>
      </div>
    </div>`;
  }).join("");
}

async function loadOrders() {
  const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  if (!user) {
    document.getElementById("orders-content").innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--t3);">
        <div style="font-size:40px;margin-bottom:10px;">🔒</div>
        <p style="font-weight:600;margin-bottom:8px;">請先登入</p>
        <a href="login.html" style="color:var(--amber);font-weight:700;">前往登入 →</a>
      </div>`;
    return;
  }
  try {
    const r = await fetch("api/orders.php", { credentials: "same-origin" });
    const data = await r.json();
    if (data.success) renderOrders(data.orders);
    else { localStorage.removeItem("lensrent_user"); window.location.href = "login.html?redirect=orders.html"; }
  } catch (e) {
    document.getElementById("orders-content").innerHTML = `<div style="color:var(--red);padding:20px;">載入失敗，請重新整理</div>`;
  }
}

async function deleteOrder(order_id, btn) {
  try {
    const r = await fetch("api/delete_order.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id }),
    });
    const data = await r.json();
    if (data.success) {
      loadOrders();
    } else {
      if (btn) { btn.disabled = false; btn.textContent = "刪除"; }
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "刪除"; }
  }
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-action--delete[data-id]");
  if (!btn || btn.disabled) return;
  if (!confirm(`確定刪除訂單 #${btn.dataset.id}？`)) return;
  btn.disabled = true;
  btn.textContent = "刪除中⋯";
  deleteOrder(btn.dataset.id, btn);
});

loadOrders();
