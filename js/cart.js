// ── cart.js ──────────────────────────────────────────────────────────────────
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg-box " + type;
}

function renderCart(cart) {
  const panel = document.getElementById("cart-panel");
  const btnClear = document.getElementById("btn-clear");
  const subtotalText = document.getElementById("subtotal-text");

  if (cart.length === 0) {
    panel.innerHTML = `<div style="text-align:center;padding:50px 20px;color:var(--t3);">
      <div style="font-size:40px;margin-bottom:10px;">🛒</div>
      <p style="font-weight:600;">清單是空的</p>
      <a href="index.html" style="color:var(--amber);font-weight:700;font-size:13px;">去瀏覽器材 →</a>
    </div>`;
    btnClear.style.display = "none";
    subtotalText.textContent = "NT$ 0";
    return;
  }

  const subtotal = cart.reduce((s, c) => s + parseFloat(c.rental), 0);
  subtotalText.textContent = fmt(subtotal);
  btnClear.style.display = "inline-block";

  panel.innerHTML = `<table class="cart-table">
    <thead><tr><th>器材</th><th>編號</th><th>日租金</th><th></th></tr></thead>
    <tbody>
      ${cart.map(item => `<tr>
        <td style="font-weight:600;color:var(--t1);">${item.name}</td>
        <td style="font-family:monospace;font-size:11px;color:var(--t3);">${item.item_id}</td>
        <td style="font-family:monospace;color:var(--amber);">${fmt(item.rental)}</td>
        <td><button class="btn-remove" data-id="${item.item_id}">移除</button></td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

async function loadCart() {
  try {
    const r = await fetch("api/cart.php", { credentials: "same-origin" });
    const data = await r.json();
    if (data.success) renderCart(data.cart);
  } catch (e) {
    document.getElementById("cart-panel").innerHTML = '<div style="color:var(--red);padding:20px;">載入失敗，請重新整理</div>';
  }
}

async function removeItem(item_id) {
  const r = await fetch("api/cart.php", {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", item_id }),
  });
  const data = await r.json();
  if (data.success) renderCart(data.cart);
}

async function clearCart() {
  const r = await fetch("api/cart.php", {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "clear" }),
  });
  const data = await r.json();
  if (data.success) renderCart([]);
}

// ── Flatpickr setup ───────────────────────────────────────────────────────────
flatpickr.localize(flatpickr.l10ns.zh_tw);
const rentPicker = flatpickr("#rent-date", {
  dateFormat: "Y-m-d", altInput: true, altFormat: "Y年n月j日（D）",
  defaultDate: "today", minDate: "today",
  onChange: (dates) => { if (dates[0]) returnPicker.set("minDate", dates[0]); },
});
const returnPicker = flatpickr("#return-date", {
  dateFormat: "Y-m-d", altInput: true, altFormat: "Y年n月j日（D）",
  defaultDate: new Date(Date.now() + 3 * 864e5), minDate: "today",
});

// ── Create order ──────────────────────────────────────────────────────────────
document.getElementById("btn-create").addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  if (!user) { showMsg("order-msg", "請先登入才能建立訂單", "error"); return; }

  const rent_date   = document.getElementById("rent-date").value;
  const return_date = document.getElementById("return-date").value;
  if (!rent_date || !return_date) { showMsg("order-msg", "請選擇租借日期與歸還日期", "error"); return; }

  const btn = document.getElementById("btn-create");
  btn.disabled = true; btn.textContent = "建立中⋯";

  try {
    const r = await fetch("api/create_order.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rent_date, return_date }),
    });
    const data = await r.json();
    if (data.success) {
      window.location.href = `order_detail.html?id=${data.order_id}&new=1`;
    } else {
      showMsg("order-msg", data.message || "建立失敗", "error");
      btn.disabled = false; btn.textContent = "確認建立訂單";
    }
  } catch (e) {
    showMsg("order-msg", "網路錯誤，請重試", "error");
    btn.disabled = false; btn.textContent = "確認建立訂單";
  }
});

// ── Events ────────────────────────────────────────────────────────────────────
document.addEventListener("click", e => {
  const btn = e.target.closest(".btn-remove[data-id]");
  if (btn) removeItem(btn.dataset.id);
});
document.getElementById("btn-clear").addEventListener("click", () => {
  if (confirm("確定清空租借清單？")) clearCart();
});

// ── Login hint ────────────────────────────────────────────────────────────────
const user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
if (!user) document.getElementById("login-hint").style.display = "block";

// ── Init ──────────────────────────────────────────────────────────────────────
loadCart();
