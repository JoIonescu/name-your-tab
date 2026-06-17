function updateTitle(tabIndex) {
  if (typeof tabIndex === "undefined") {
    return;
  }
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
}
function registerListener() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      updateTitle(request.tabIndex);
    });
  var titleObserver = new MutationObserver(function(mutations) {
    updateTitle(window.lastTabIndex);
  });
  var config = { attributes: true, childList: true, characterData: true };
  var titleEl = document.getElementsByTagName('title')[0];
  if (titleEl) {
    titleObserver.observe(titleEl, config);
  }
}
document.addEventListener("DOMContentLoaded", function(event) {
  registerListener();
});
