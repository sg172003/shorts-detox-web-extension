const DAILY_LIMIT = 15;
const MAX_CLICKS = 3;

function $(id) {
  return document.getElementById(id);
}

chrome.storage.local.get(["shortsState"], (res) => {
  const state = res.shortsState;

  if (!state) {
    $("minutes").textContent = "0 / 15";
    $("unlocks").textContent = "0 / 3";
    $("cooldown").textContent = "Ready";
    $("status").textContent = "Blocked";
    $("status").className = "value blocked";
    return;
  }

  const now = Date.now();

  // Minutes used
  $("minutes").textContent = `${state.usedMinutes} / ${DAILY_LIMIT}`;

  // Unlocks
  $("unlocks").textContent = `${state.allowClicks} / ${MAX_CLICKS}`;

  // Cooldown
  if (now < state.cooldownUntil) {
    const mins = Math.ceil((state.cooldownUntil - now) / 60000);
    $("cooldown").textContent = `${mins} min`;
    $("cooldown").className = "value warn";
  } else {
    $("cooldown").textContent = "Ready";
    $("cooldown").className = "value ok";
  }

  // Status
  if (now < state.allowedUntil) {
    $("status").textContent = "Allowed";
    $("status").className = "value ok";
  } else {
    $("status").textContent = "Blocked";
    $("status").className = "value blocked";
  }
});
