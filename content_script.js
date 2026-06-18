// Save original title once per URL
if (!sessionStorage.getItem("_tab_namer_orig")) {
  sessionStorage.setItem("_tab_namer_orig", document.title);
}

let _tab_namer_name = null;
let _tab_namer_color = null;
let _tab_namer_observer = null;

function applyName(name) {
  if (name && document.title !== name) {
    document.title = name;
  }
}

function applyFavicon(hex) {
  if (!hex) return;
  // Only inject if not already there
  const existing = document.querySelector("link[data-tab-namer]");
  if (existing && existing.dataset.color === hex) return;
  document.querySelectorAll("link[data-tab-namer]").forEach(e => e.remove());
  const canvas = document.createElement("canvas");
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = hex;
  ctx.fill();
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = canvas.toDataURL();
  link.setAttribute("data-tab-namer", "true");
  link.dataset.color = hex;
  // Remove any existing favicons first
  document.querySelectorAll("link[rel*='icon']:not([data-tab-namer])").forEach(e => e.remove());
  document.head.appendChild(link);
}

function startObserver() {
  if (_tab_namer_observer) _tab_namer_observer.disconnect();
  _tab_namer_observer = new MutationObserver(() => {
    if (_tab_namer_name) applyName(_tab_namer_name);
    if (_tab_namer_color) applyFavicon(_tab_namer_color);
  });
  _tab_namer_observer.observe(document.head, { childList: true, subtree: true });
  // Also watch title element directly
  const titleEl = document.querySelector("title");
  if (titleEl) {
    _tab_namer_observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
  }
}

function stopObserver() {
  if (_tab_namer_observer) {
    _tab_namer_observer.disconnect();
    _tab_namer_observer = null;
  }
}

// Listen for commands from popup/service worker
window.addEventListener("_tab_namer_apply", (e) => {
  _tab_namer_name = e.detail.name || null;
  _tab_namer_color = e.detail.color || null;
  if (_tab_namer_name) applyName(_tab_namer_name);
  if (_tab_namer_color) applyFavicon(_tab_namer_color);
  startObserver();
});

window.addEventListener("_tab_namer_reset", () => {
  _tab_namer_name = null;
  _tab_namer_color = null;
  stopObserver();
  document.querySelectorAll("link[data-tab-namer]").forEach(e => e.remove());
  const orig = sessionStorage.getItem("_tab_namer_orig");
  if (orig) document.title = orig;
});