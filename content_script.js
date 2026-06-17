console.log("content script loaded on:", location.href);

function updateTitle(tabIndex) {
  console.log("updateTitle called with index:", tabIndex);
  if (typeof tabIndex === "undefined") return;
  if (typeof window.lastTitle === "undefined" || document.title != window.lastTitle) {
    window.originalTitle = document.title;
    setTitle(document.title, tabIndex);
  } else if (tabIndex != window.lastTabIndex) {
    setTitle(window.originalTitle, tabIndex);
  }
}
function setTitle(title, tabIndex) {
  var prefix = tabIndex < 8 ? (tabIndex + 1) + ' ' : '';
  document.title = prefix + title + ' <' + location.host + '>';
  window.lastTitle = document.title;
  window.lastTabIndex = tabIndex;
  console.log("title set to:", document.title);
}
function registerListener() {
  console.log("registerListener called");
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("message received:", request);
    updateTitle(request.tabIndex);
  });
  var titleEl = document.getElementsByTagName('title')[0];
  if (titleEl) {
    var titleObserver = new MutationObserver(function() {
      updateTitle(window.lastTabIndex);
    });
    titleObserver.observe(titleEl, { attributes: true, childList: true, characterData: true });
  }
}
document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOMContentLoaded fired");
  registerListener();
});
