chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  chrome.storage.local.get([String(tabId)], (res) => {
    const data = res[String(tabId)];
    if (!data || (!data.name && !data.color)) return;
    chrome.scripting.executeScript({
      target: { tabId },
      func: (name, color) => {
        window.dispatchEvent(new CustomEvent("_tab_namer_apply", { detail: { name, color } }));
      },
      args: [data.name, data.color]
    }).catch(() => {});
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(String(tabId));
});