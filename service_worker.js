console.log("service worker loaded");

function updateTabName(tab) {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, {"tabIndex": tab.index}).catch(() => {});
}

function updateAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    console.log("updating all tabs:", tabs.length);
    for (var i = 0; i < tabs.length; i++) {
      updateTabName(tabs[i]);
    }
  });
}

// Run immediately when service worker wakes
updateAllTabs();

chrome.tabs.onCreated.addListener(updateAllTabs);
chrome.tabs.onMoved.addListener(updateAllTabs);
chrome.tabs.onRemoved.addListener(updateAllTabs);
chrome.tabs.onDetached.addListener(updateAllTabs);
chrome.tabs.onAttached.addListener(updateAllTabs);
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    updateAllTabs();
  }
});
