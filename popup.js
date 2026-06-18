btnApply.addEventListener("click", () => {
  if (!currentTab) return;
  const name = nameInput.value.trim();
  console.log("sending to tab:", currentTab.id, "name:", name);

  chrome.tabs.sendMessage(currentTab.id, { type: "apply", name }, (response) => {
    console.log("response:", response, chrome.runtime.lastError);
    showStatus(chrome.runtime.lastError ? "Error: " + chrome.runtime.lastError.message : "Applied ✓");
  });
});
