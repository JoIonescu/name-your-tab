const COLORS = [
  { label: "None",    value: null,      hex: "#333" },
  { label: "Red",     value: "red",     hex: "#eb5757" },
  { label: "Orange",  value: "orange",  hex: "#f0a500" },
  { label: "Yellow",  value: "yellow",  hex: "#f5e642" },
  { label: "Green",   value: "green",   hex: "#4caf7d" },
  { label: "Cyan",    value: "cyan",    hex: "#56ccf2" },
  { label: "Blue",    value: "blue",    hex: "#2f80ed" },
  { label: "Purple",  value: "purple",  hex: "#9b51e0" },
  { label: "Pink",    value: "pink",    hex: "#eb57a0" },
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

// Load current tab data
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
          if (s.dataset.value === (saved.color ?? "")) s.classList.add("selected");
        });
      }
    } else {
      // Select "None" by default
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

  // Rename the tab title
  if (name) {
    chrome.tabs.sendMessage(currentTab.id, { type: "apply", name }).catch(() => {});
  }

  // Color via tab group
  if (selectedColor) {
    chrome.tabs.group({ tabIds: [currentTab.id] }, (groupId) => {
      if (chrome.runtime.lastError) return;
      chrome.tabGroups.update(groupId, { color: selectedColor }).catch(() => {});
    });
  } else {
    // Ungroup if color is reset to none
    chrome.tabs.ungroup([currentTab.id]).catch(() => {});
  }

  showStatus("Applied ✓");
});

// Reset
btnReset.addEventListener("click", () => {
  if (!currentTab) return;
  chrome.storage.local.remove(String(currentTab.id));
  chrome.tabs.sendMessage(currentTab.id, { type: "reset" }).catch(() => {});
  chrome.tabs.ungroup([currentTab.id]).catch(() => {});

  selectedColor = null;
  headerDot.style.background = "#fff";
  document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
  colorPicker.firstChild?.classList.add("selected");

  showStatus("Reset to original");
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnApply.click();
});

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.className = "status success";
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, 2000);
}
