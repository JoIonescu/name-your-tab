chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "apply") {
    if (request.name) document.title = request.name;
    if (request.color) setFavicon(request.color);
    else removeFavicon();
    sendResponse({ ok: true });
    return false;
  }
  if (request.type === "reset") {
    if (request.originalTitle) document.title = request.originalTitle;
    removeFavicon();
    sendResponse({ ok: true });
    return false;
  }
});

function setFavicon(hex) {
  removeFavicon();
  const canvas = document.createElement("canvas");
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = hex;
  ctx.fill();
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = canvas.toDataURL();
  link.setAttribute("data-tab-namer", "true");
  document.head.appendChild(link);
}

function removeFavicon() {
  document.querySelectorAll("link