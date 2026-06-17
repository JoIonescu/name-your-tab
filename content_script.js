(function () {
  // Save original title once
  chrome.storage.local.get("_orig_" + location.href, (res) => {
    if (!res["_orig_" + location.href]) {
      chrome.storage.local.set({ ["_orig_" + location.href]: document.title });
    }
  });

  function applyName(name) {
    if (name) document.title = name;
  }

  function applyColor(hex) {
    if (!hex) return;
    // Remove existing injected favicon
    document.querySelectorAll("link[data-tab-namer]").forEach(el => el.remove());

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Draw colored circle
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = canvas.toDataURL();
    link.setAttribute("data-tab-namer", "true");
    document.head.appendChild(link);
  }

  function resetAll() {
    // Restore title
    chrome.storage.local.get("_orig_" + location.href, (res) => {
      if (res["_orig_" + location.href]) {
        document.title = res["_orig_" + location.href];
      }
    });
    // Remove injected favicon
    document.querySelectorAll("link[data-tab-namer]").forEach(el => el.remove());
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "apply") {
      applyName(request.name);
      applyColor(request.color);
    }
    if (request.type === "reset") {
      resetAll();
    }
  });
})();
