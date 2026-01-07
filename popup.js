document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");

  chrome.storage.sync.get(["blockShorts"], (result) => {
    toggle.checked = result.blockShorts !== false;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.sync.set({
      blockShorts: toggle.checked
    });
  });
});
