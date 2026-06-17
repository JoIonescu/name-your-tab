chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    chrome.storage.local.get([String(tabId)], (res) => {
      const data = res[String(tabId)];
      if (data?.name) {
        chrome.tabs.sendMessage(tabId, { type: "apply", name: data.name }).catch(() => {});
      }
    });
  }
});

// When tab is closed, clean up storage
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(String(tabId));
});
