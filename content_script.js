chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "apply") {
    if (request.name) {
      document.title = request.name;
    }
    sendResponse({ ok: true });
  }
});
