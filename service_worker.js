console.log("service worker loaded");

function updateTabName(tab) {
  console.log("updateTabName called for tab:", tab.id, "index:", tab.index);
  chrome.tabs.sendMessage(tab.id, {"tabIndex": tab.index}).catch(error => {
    console.log("sendMessage error:", error);
  });
}
function updateAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    console.log("updateAllTabs - found tabs:", tabs.length);
    for(var i = 0; i < tabs.length; i++) {
      updateTabName(tabs[i]);
    }
  });
}
chrome.tabs.onCreated.addListener(function() { updateAllTabs(); });
chrome.tabs.onMoved.addListener(function() { updateAllTabs(); });
chrome.tabs.onRemoved.addListener(function() { updateAllTabs(); });
chrome.tabs.onDetached.addListener(function() { updateAllTabs(); });
chrome.tabs.onAttached.addListener(function() { updateAllTabs(); });
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { updateTabName(tab); });
