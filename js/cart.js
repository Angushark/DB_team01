// ── cart.js ──────────────────────────────────────────────────────────────────
const fmt = n => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

// ── Flatpickr setup ───────────────────────────────────────────────────────────
if (flatpickr.l10ns && flatpickr.l10ns.zh_tw) flatpickr.localize(flatpickr.l10ns.zh_tw);
var rentPicker   = null;
var returnPicker = null;

function fmtPickerDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function updateTotalDisplay() {
  var daysEl   = document.getElementById("days-text");
  var totalEl  = document.getElementById("total-text");
  var subtotal = window._cartSubtotal || 0;
  var rentDate   = rentPicker   ? rentPicker.selectedDates[0]   : null;
  var returnDate = returnPicker ? returnPicker.selectedDates[0] : null;

  if (rentDate && returnDate) {
    var diff = Math.round((returnDate - rentDate) / 86400000);
    var days = Math.max(1, diff);
    if (daysEl)  daysEl.textContent  = days + " 天";
    if (totalEl) totalEl.textContent = fmt(subtotal * days);
  } else {
    if (daysEl)  daysEl.textContent  = "—";
    if (totalEl) totalEl.textContent = fmt(subtotal);
  }
}

function initDatePickers(blocked) {
  if (!blocked) blocked = [];
  if (rentPicker)   rentPicker.destroy();
  if (returnPicker) returnPicker.destroy();

  var disableFn = blocked.length ? function(date) {
    return blocked.some(function(r) {
      var from = new Date(r.from + "T00:00:00");
      var to   = new Date(r.to   + "T00:00:00");
      return date >= from && date < to;
    });
  } : null;

  rentPicker = flatpickr("#rent-date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "Y年n月j日（D）",
    minDate: "today",
    disable: disableFn ? [disableFn] : [],
    onChange: function(dates) {
      if (dates[0]) { returnPicker.set("minDate", dates[0]); updateTotalDisplay(); }
    },
  });

  returnPicker = flatpickr("#return-date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "Y年n月j日（D）",
    minDate: "today",
    disable: disableFn ? [disableFn] : [],
    onChange: function() { updateTotalDisplay(); },
  });

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  rentPicker.setDate(new Date(), false);
  returnPicker.setDate(tomorrow, false);
  updateTotalDisplay();
}

async function fetchAndInitPickers(cart) {
  var blocked = [];
  if (cart && cart.length > 0) {
    try {
      var ids = cart.map(function(c) { return c.item_id; }).join(",");
      var r = await fetch("api/item_unavailable_dates.php?item_ids=" + ids);
      var data = await r.json();
      if (data.success) blocked = data.blocked;
    } catch (e) {}
  }
  initDatePickers(blocked);
  var hint = document.getElementById("date-blocked-hint");
  if (hint) hint.style.display = blocked.length > 0 ? "block" : "none";
}

// ── Cart rendering ────────────────────────────────────────────────────────────
function showMsg(id, text, type) {
  var el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg-box " + type;
}

function renderCart(cart) {
  var panel      = document.getElementById("cart-panel");
  var btnClear   = document.getElementById("btn-clear");
  var subtotalEl = document.getElementById("subtotal-text");

  if (cart.length === 0) {
    panel.innerHTML = '<div style="text-align:center;padding:50px 20px;color:var(--t3);"><div style="font-size:40px;margin-bottom:10px;">🛒</div><p style="font-weight:600;">清單是空的</p><a href="index.html" style="color:var(--amber);font-weight:700;font-size:13px;">去瀏覽器材 →</a></div>';
    btnClear.style.display = "none";
    subtotalEl.textContent = "NT$ 0";
    window._cartSubtotal = 0;
    updateTotalDisplay();
    return;
  }

  var subtotal = cart.reduce(function(s, c) { return s + parseFloat(c.rental); }, 0);
  subtotalEl.textContent = fmt(subtotal);
  window._cartSubtotal = subtotal;
  updateTotalDisplay();
  btnClear.style.display = "inline-block";

  panel.innerHTML = '<table class="cart-table"><thead><tr><th>器材</th><th>編號</th><th>日租金</th><th></th></tr></thead><tbody>' +
    cart.map(function(item) {
      return '<tr><td style="font-weight:600;color:var(--t1);">' + item.name + '</td>' +
        '<td style="font-family:monospace;font-size:11px;color:var(--t3);">' + item.item_id + '</td>' +
        '<td style="font-family:monospace;color:var(--amber);">' + fmt(item.rental) + '</td>' +
        '<td><button class="btn-remove" data-id="' + item.item_id + '">移除</button></td></tr>';
    }).join("") +
    '</tbody></table>';
}

async function loadCart() {
  try {
    var r = await fetch("api/cart.php", { credentials: "same-origin" });
    var data = await r.json();
    if (data.success) {
      renderCart(data.cart);
      await fetchAndInitPickers(data.cart);
    }
  } catch (e) {
    document.getElementById("cart-panel").innerHTML = '<div style="color:var(--red);padding:20px;">載入失敗，請重新整理</div>';
    initDatePickers([]);
  }
}

async function removeItem(item_id, btn) {
  try {
    var r = await fetch("api/cart.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", item_id: item_id }),
    });
    var data = await r.json();
    if (data.success) {
      renderCart(data.cart);
      await fetchAndInitPickers(data.cart);
    } else {
      if (btn) { btn.disabled = false; btn.textContent = "移除"; }
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "移除"; }
  }
}

async function clearCart() {
  var clearBtn = document.getElementById("btn-clear");
  if (clearBtn) { clearBtn.disabled = true; clearBtn.textContent = "清空中⋯"; }
  try {
    var r = await fetch("api/cart.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    var data = await r.json();
    if (data.success) {
      renderCart([]);
      initDatePickers([]);
    } else {
      if (clearBtn) { clearBtn.disabled = false; clearBtn.textContent = "清空清單"; }
    }
  } catch (e) {
    if (clearBtn) { clearBtn.disabled = false; clearBtn.textContent = "清空清單"; }
  }
}

// ── Create order ──────────────────────────────────────────────────────────────
document.getElementById("btn-create").addEventListener("click", async function() {
  var user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
  if (!user) { showMsg("order-msg", "請先登入才能建立訂單", "error"); return; }

  var rent_date   = rentPicker   && rentPicker.selectedDates[0]   ? fmtPickerDate(rentPicker.selectedDates[0])   : "";
  var return_date = returnPicker && returnPicker.selectedDates[0] ? fmtPickerDate(returnPicker.selectedDates[0]) : "";
  if (!rent_date || !return_date) { showMsg("order-msg", "請選擇租借日期與歸還日期", "error"); return; }

  var btn = document.getElementById("btn-create");
  btn.disabled = true; btn.textContent = "建立中⋯";

  try {
    var resp = await fetch("api/create_order.php", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rent_date: rent_date, return_date: return_date }),
    });
    var text = await resp.text();
    var data;
    try { data = JSON.parse(text); } catch (_) {
      console.error("create_order non-JSON response:", text);
      showMsg("order-msg", "伺服器回應錯誤，請重試（詳見 console）", "error");
      btn.disabled = false; btn.textContent = "確認建立訂單";
      return;
    }
    if (data.success) {
      window.location.href = "order_detail.html?id=" + data.order_id + "&new=1";
    } else if (data.message === "請先登入") {
      localStorage.removeItem("lensrent_user");
      window.location.href = "login.html?redirect=cart.html";
    } else {
      showMsg("order-msg", data.message || "建立失敗", "error");
      btn.disabled = false; btn.textContent = "確認建立訂單";
    }
  } catch (e) {
    console.error("create_order fetch error:", e);
    showMsg("order-msg", "網路錯誤，請重試", "error");
    btn.disabled = false; btn.textContent = "確認建立訂單";
  }
});

// ── Events ────────────────────────────────────────────────────────────────────
document.addEventListener("click", function(e) {
  var btn = e.target.closest(".btn-remove[data-id]");
  if (btn && !btn.disabled) {
    btn.disabled = true;
    btn.textContent = "⋯";
    removeItem(btn.dataset.id, btn);
  }
});
document.getElementById("btn-clear").addEventListener("click", function() {
  if (confirm("確定清空購物車？")) clearCart();
});

// ── Login hint ────────────────────────────────────────────────────────────────
var user = JSON.parse(localStorage.getItem("lensrent_user") || "null");
if (!user) document.getElementById("login-hint").style.display = "block";

// ── Init ──────────────────────────────────────────────────────────────────────
loadCart();
