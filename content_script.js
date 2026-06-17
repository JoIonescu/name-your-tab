(function () {
  const host = location.hostname || location.href;
  let tooltipTimeout;

  // --- Tooltip (hostname on hover) ---
  const tooltip = document.createElement("div");
  tooltip.id = "tab-namer-tooltip";
  tooltip.textContent = host;
  document.body.appendChild(tooltip);

  document.addEventListener("mousemove", (e) => {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      tooltip.classList.add("visible");
    }, 600);
  });

  document.addEventListener("mouseleave", () => {
    clearTimeout(tooltipTimeout);
    tooltip.classList.remove("visible");
  });

  document.addEventListener("mousedown", () => {
    clearTimeout(tooltipTimeout);
    tooltip.classList.remove("visible");
  });

  // --- Rename dialog (on double-click) ---
  const overlay = document.createElement("div");
  overlay.id = "tab-namer-overlay";
  document.body.appendChild(overlay);

  const dialog = document.createElement("div");
  dialog.id = "tab-namer-rename";
  dialog.innerHTML = `
    <label>Rename this tab</label>
    <input type="text" id="tab-namer-input" placeholder="Enter a name..." />
    <div class="actions">
      <button class="btn-reset">Reset</button>
      <button class="btn-cancel">Cancel</button>
      <button class="btn-confirm">Rename</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const input = dialog.querySelector("#tab-namer-input");
  const btnConfirm = dialog.querySelector(".btn-confirm");
  const btnCancel = dialog.querySelector(".btn-cancel");
  const btnReset = dialog.querySelector(".btn-reset");

  function openDialog() {
    input.value = document.title;
    overlay.classList.add("visible");
    dialog.classList.add("visible");
    setTimeout(() => { input.focus(); input.select(); }, 50);
  }

  function closeDialog() {
    overlay.classList.remove("visible");
    dialog.classList.remove("visible");
  }

  function applyName(name) {
    document.title = name;
    chrome.storage.local.set({ [location.href]: name });
    closeDialog();
  }

  function resetName() {
    chrome.storage.local.remove(location.href);
    chrome.storage.local.get("_original_" + location.href, (res) => {
      const orig = res["_original_" + location.href];
      if (orig) document.title = orig;
    });
    closeDialog();
  }

  btnConfirm.addEventListener("click", () => applyName(input.value));
  btnCancel.addEventListener("click", closeDialog);
  btnReset.addEventListener("click", resetName);
  overlay.addEventListener("click", closeDialog);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyName(input.value);
    if (e.key === "Escape") closeDialog();
  });

  document.addEventListener("dblclick", (e) => {
    if (e.target.closest("#tab-namer-rename") || e.target.closest("#tab-namer-overlay")) return;
    openDialog();
  });

  // --- Restore saved name on load ---
  chrome.storage.local.get(location.href, (res) => {
    if (res[location.href]) {
      // Save original before overwriting
      chrome.storage.local.set({ ["_original_" + location.href]: document.title });
      document.title = res[location.href];
    }
  });

  // Listen for service worker ping
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "tab_ready") {
      chrome.storage.local.get(location.href, (res) => {
        if (res[location.href]) document.title = res[location.href];
      });
    }
  });
})();
