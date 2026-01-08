const DAILY_LIMIT = 15;
const MAX_CLICKS = 3;

function updateUI(state) {
  const used = state.usedMinutes || 0;
  const clicks = state.allowClicks || 0;

  document.getElementById("minutesUsed").textContent = used;
  document.getElementById("clicksUsed").textContent = clicks;

  // Progress bar
  const percent = Math.min((used / DAILY_LIMIT) * 100, 100);
  document.getElementById("minutesBar").style.width = percent + "%";

  // Cooldown
  const now = Date.now();
  const cooldownEl = document.getElementById("cooldownStatus");

  if (now < state.cooldownUntil) {
    const mins = Math.ceil((state.cooldownUntil - now) / 60000);
    cooldownEl.textContent = `${mins} min left`;
  } else {
    cooldownEl.textContent = "None";
  }
}

// Load state from storage
chrome.storage.local.get(["shortsState"], (res) => {
  if (!res.shortsState) {
    updateUI({
      usedMinutes: 0,
      allowClicks: 0,
      cooldownUntil: 0
    });
    return;
  }

  updateUI(res.shortsState);
});
