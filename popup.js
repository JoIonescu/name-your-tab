const COLORS = [
  { label: "None",   hex: null },
  { label: "Red",    hex: "#eb5757" },
  { label: "Orange", hex: "#f0a500" },
  { label: "Yellow", hex: "#f5e642" },
  { label: "Green",  hex: "#4caf7d" },
  { label: "Cyan",   hex: "#56ccf2" },
  { label: "Blue",   hex: "#2f80ed" },
  { label: "Purple", hex: "#9b51e0" },
  { label: "Pink",   hex: "#eb57a0" },
];

let tab = null;
let selectedColor = null;

const nameInput = document.getElementById("name-input");
const colorsEl = document.getElementById("colors");
const btnApply = document.getElementById("btn-apply");
const btnReset = document.getElementById("btn-reset");
const statusEl = document.getElementById("status");
const hostEl = document.getElementById("host");

// Build swatches
COLORS.forEach(({ label, hex }) => {
  const s = document.createElement("div");
  s.className = "swatch";
  s.style.background = hex || "#333";
  s.title = label;
  s.dataset.hex = hex || "";
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach(x => x.classList.remove("selected"));
    s.classList.add("selected");
    selectedColor = hex;
  });
  colorsEl.appendChild(s);
});

function setFaviconInTab(tabId, hex) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (color) => {
      document.querySelectorAll("link[data-tab-namer]").forEach(e => e.remove());
      if (!color) return;
      const canvas = document.createElement("canvas");
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = canvas.toDataURL();
      link.setAttribute("data-tab-namer", "true");
      document.head.appendChild(link);
    },
    args: [hex]
  });
}

function setTitleInTab(tabId, name) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (n) => { if (n) document.title = n; },
    args: [name]
  });
}

function resetInTab(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      document.querySelectorAll("link[data-tab-namer]").forEach(e => e.remove());
      const orig = sessionStorage.getItem("_tab_namer_orig");
      if (orig) document.title = orig;
    }
  });
}

// Init
chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
  tab = t;
  try { hostEl.textContent = new URL(t.url).hostname; } catch { hostEl.textContent = t.url; }

  chrome.storage.local.get(String(t.id), (res) => {
    const saved = res[String(t.id)];
    nameInput.value = saved?.name || t.title;
    selectedColor = saved?.color || null;

    const match = [...document.querySelectorAll(".swatch")]
      .find(s => s.dataset.hex === (selectedColor || ""));
    if (match) match.classList.add("selected");
    else colorsEl.firstChild?.classList.add("selected");
  });
});

btnApply.addEventListener("click", async () => {
  if (!tab) return;
  const name = nameInput.value.trim();

  chrome.storage.local.set({ [String(tab.id)]: { name, color: selectedColor } });

  try {
    await setTitleInTab(tab.id, name);
    await setFaviconInTab(tab.id, selectedColor);
    setStatus("Applied ✓");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
});

btnReset.addEventListener("click", async () => {
  if (!tab) return;
  chrome.storage.local.remove(String(tab.id));
  selectedColor = null;
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("selected"));
  colorsEl.firstChild?.classList.add("selected");

  try {
    await resetInTab(tab.id);
    nameInput.value = tab.title;
    setStatus("Reset ✓");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
});

nameInput.addEventListener("keydown", e => { if (e.key === "Enter") btnApply.click(); });

function setStatus(msg) {
  statusEl.textContent = msg;
  statusEl.className = "status ok";
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, 2000);
}
