const COLORS = [
  { label: "None",   value: null,      hex: "#333333" },
  { label: "Red",    value: "#eb5757", hex: "#eb5757" },
  { label: "Orange", value: "#f0a500", hex: "#f0a500" },
  { label: "Yellow", value: "#f5e642", hex: "#f5e642" },
  { label: "Green",  value: "#4caf7d", hex: "#4caf7d" },
  { label: "Cyan",   value: "#56ccf2", hex: "#56ccf2" },
  { label: "Blue",   value: "#2f80ed", hex: "#2f80ed" },
  { label: "Purple", value: "#9b51e0", hex: "#9b51e0" },
  { label: "Pink",   value: "#eb57a0", hex: "#eb57a0" },
];

let currentTab = null;
let selectedColor = null;

const nameInput = document.getElementById("tab-name");
const colorPicker = document.getElementById("color-picker");
const btnApply = document.getElementById("btn-apply");
const btnReset = document.getElementById("btn-reset");
const statusEl = document.getElementById("status");
const hostnameEl = document.getElementById("hostname");
const headerDot = document.getElementById("header-dot");

// Build color swatches
COLORS.forEach(({ label, value, hex }) => {
  const swatch = document.createElement("div");
  swatch.className = "color-swatch";
  swatch.style.background = hex;
  swatch.title = label;
  swatch.dataset.value = value ?? "";
  swatch.addEventListener("click", () => {
    document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
    swatch.classList.add("selected");
    selectedColor = value;
    headerDot.style.background = hex;
  });
  colorPicker.appendChild(swatch);
});

// Load current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTab = tabs[0];
  if (!currentTab) return;

  try {
    const url = new URL(currentTab.url);
    hostnameEl.textContent = url.hostname || currentTab.url;
  } catch {
    hostnameEl.textContent = currentTab.url;
  }

  nameInput.value = currentTab.title || "";

  chrome.storage.local.get([String(currentTab.id)], (res) => {
    const saved = res[String(currentTab.id)];
    if (saved?.name) nameInput.value = saved.name;
    if (saved?.color) {
      selectedColor = saved.color;
      const match = COLORS.find(c => c.value === saved.color);
      if (match) {
        headerDot.style.background = match.hex;
        document.querySelectorAll(".color-swatch").forEach(s => {
          if (s.dataset.value === saved.color) s.classList.add("selected");
        });
      }
    } else {
      colorPicker.firstChild?.classList.add("selected");
    }
  });
});

// Apply
btnApply.addEventListener("click", () => {
  if (!currentTab) return;
  const name = nameInput.value.trim();

  chrome.storage.local.set({
    [String(currentTab.id)]: { name, color: selectedColor }
  });

  chrome.tabs.sendMessage(currentTab.id, {
    type: "apply",
    name: name || null,
    color: selectedColor || null
  }).then(() => {
    showStatus("Applied ✓");
  }).catch(() => {
    // Content script not ready — inject and retry
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content_script.js"]
    }).then(() => {
      setTimeout(() => {
        chrome.tabs.sendMessage(currentTab.id, {
          type: "apply",
          name: name || null,
          color: selectedColor || null
        }).catch(() => {});
      }, 100);
    }).catch(() => {});
    showStatus("Applied ✓");
  });
});

// Reset
btnReset.addEventListener("click", () => {
  if (!currentTab) return;
  chrome.storage.local.remove(String(currentTab.id));
  chrome.tabs.sendMessage(currentTab.id, { type: "reset" }).catch(() => {});

  selectedColor = null;
  headerDot.style.background = "#fff";
  document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
  colorPicker.firstChild?.classList.add("selected");
  nameInput.value = currentTab.title || "";

  showStatus("Reset ✓");
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnApply.click();
});

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.className = "status success";
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, 2000);
}
