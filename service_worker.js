// GA_MEASUREMENT_ID and GA_API_SECRET come from analytics_config.js (loaded via importScripts)
importScripts("analytics_config.js");

const GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

async function getClientId() {
  return new Promise((resolve) => {
    chrome.storage.local.get("_ga_client_id", (res) => {
      if (res._ga_client_id) {
        resolve(res._ga_client_id);
      } else {
        const id = `${Math.random().toString(36).slice(2)}.${Date.now()}`;
        chrome.storage.local.set({ _ga_client_id: id });
        resolve(id);
      }
    });
  });
}

async function sendEvent(name, params = {}) {
  try {
    const clientId = await getClientId();
    await fetch(GA_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name, params }]
      })
    });
  } catch (e) {}
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    sendEvent("extension_installed");
  } else if (details.reason === "update") {
    sendEvent("extension_updated", { version: chrome.runtime.getManifest().version });
  }
});

chrome.action.onClicked.addListener(() => {
  sendEvent("popup_opened");
});

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

// Allow popup to request analytics events via messaging
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "track") {
    sendEvent(request.name, request.params || {});
  }
});