const DAILY_LIMIT = 15;
const MAX_CLICKS = 3;
const COOLDOWN_MS = 2 * 60 * 1000;

function $(id) {
  return document.getElementById(id);
}

function updateUI() {
  chrome.storage.local.get(["shortsState"], (res) => {
    const state = res.shortsState;
    const now = Date.now();

    if (!state) return;

    // STATUS
    if (now < state.allowedUntil) {
      $("statusBadge").textContent = "Allowed";
      $("statusBadge").className = "badge ok";
    } else {
      $("statusBadge").textContent = "Blocked";
      $("statusBadge").className = "badge blocked";
    }

    // DAILY USAGE
    $("minutesText").textContent = `${state.usedMinutes} / ${DAILY_LIMIT}`;
    const usagePercent = Math.min(
      (state.usedMinutes / DAILY_LIMIT) * 100,
      100
    );
    $("usageBar").style.width = `${usagePercent}%`;

    // UNLOCKS
    $("unlocksText").textContent = `${state.allowClicks} / ${MAX_CLICKS}`;

    // COOLDOWN
    if (now < state.cooldownUntil) {
      $("cooldownSection").style.display = "block";

      const remaining = state.cooldownUntil - now;
      const mins = Math.ceil(remaining / 60000);
      $("cooldownText").textContent = `${mins} min`;

      const percent =
        ((COOLDOWN_MS - remaining) / COOLDOWN_MS) * 100;
      $("cooldownBar").style.width = `${percent}%`;
    } else {
      $("cooldownSection").style.display = "none";
    }
  });
}

// Initial render
updateUI();

// Live updates
setInterval(updateUI, 1000);
