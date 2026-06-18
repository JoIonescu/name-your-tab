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
let originalTitle = null;

const nameInput = document.getElementById("name-input");
const colorsEl = document.getElementById("colors");
const btnApply = document.getElementById("btn-apply");
const btnReset = document.getElementById("btn-reset");
const statusEl = document.getElementById("status");
const hostEl = document.getElementById("host");

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

chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
  tab = t;
  try { hostEl.textContent = new URL(t.url).hostname; } catch { hostEl.textContent = t.url; }

  chrome.storage.local.get([String(t.id), "_orig_" + t.url], (res) => {
    const saved = res[String(t.id)];
    originalTitle = res["_orig_" + t.url] || t.title;
    nameInput.value = saved?.name || t.title;
    selectedColor = saved?.color || null;

    const match = [...document.querySelectorAll(".swatch")]
      .find(s => s.dataset.hex === (selectedColor || ""));
    if (match) match.classList.add("selected");
    else colorsEl.firstChild?.classList.add("selected");
  });
});

btnApply.addEventListener("click", () => {
  if (!tab) return;
  const name = nameInput.value.trim();

  chrome.storage.local.get("_orig_" + tab.url, (res) => {
    if (!res["_orig_" + tab.url]) {
      chrome.storage.local.set({ ["_orig_" + tab.url]: tab.title });
    }
  });

  chrome.storage.local.set({ [String(tab.id)]: { name, color: selectedColor } });

  chrome.tabs.sendMessage(tab.id, { type: "apply", name, color: selectedColor }, (res) => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["content_script.js"] },
        () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { type: "apply", name, color: selectedColor }, () => {});
          }, 200);
        }
      );
    }
    setStatus("Applied ✓");
  });
});

btnReset.addEventListener("click", () => {
  if (!tab) return;
  chrome.storage.local.remove(String(tab.id));
  chrome.tabs.sendMessage(tab.id, { type: "reset", originalTitle }, () => {});
  selectedColor = null;
  nameInput.value = originalTitle || tab.title;
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("selected"));
  colorsEl.firstChild?.classList.add("selected");
  setStatus("Reset ✓");
});

nameInput.addEventListener("keydown", e => { if (e.key === "Enter") btnApply.click(); });

function setStatus(msg) {
  statusEl.textContent = msg;
  statusEl.className = "status ok";
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, 2000);
}