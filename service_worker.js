// Reapply saved name/color when a tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  chrome.storage.local.get([String(tabId)], (res) => {
    const data = res[String(tabId)];
    if (!data) return;
    chrome.scripting.executeScript({
      target: { tabId },
      func: (name, color) => {
        if (name) document.title = name;
        if (color) {
          document.querySelectorAll("link[data-tab-namer]").forEach(e => e.remove());
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
        }
      },
      args: [data.name, data.color]
    }).catch(() => {});
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(String(tabId));
});
