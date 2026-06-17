(function () {
  // Restore saved name on load
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "apply" && request.name) {
      document.title = request.name;
    }
    if (request.type === "reset") {
      chrome.storage.local.get("_orig_" + location.href, (res) => {
        if (res["_orig_" + location.href]) {
          document.title = res["_orig_" + location.href];
        }
      });
    }
  });

  // Save original title once
  chrome.storage.local.get("_orig_" + location.href, (res) => {
    if (!res["_orig_" + location.href]) {
      chrome.storage.local.set({ ["_orig_" + location.href]: document.title });
    }
  });
})();
