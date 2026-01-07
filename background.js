chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!sender.tab) return;

  if (msg.type === "MUTE_TAB") {
    chrome.tabs.update(sender.tab.id, { muted: true });
  }

  if (msg.type === "UNMUTE_TAB") {
    chrome.tabs.update(sender.tab.id, { muted: false });
  }
});
