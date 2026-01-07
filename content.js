(function () {
  const DAILY_LIMIT = 15;           // total minutes per day
  const ALLOW_TIME = 5;             // minutes per unlock
  const MAX_CLICKS = 3;              // max unlocks per day
  const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

  const today = new Date().toDateString();
  let lastUrl = location.href;
  let timerInterval = null;

  /* ---------------- TAB AUDIO CONTROL ---------------- */

  function muteTab() {
    chrome.runtime.sendMessage({ type: "MUTE_TAB" });
  }

  function unmuteTab() {
    chrome.runtime.sendMessage({ type: "UNMUTE_TAB" });
  }

  /* ---------------- STATE ---------------- */

  function defaultState() {
    return {
      date: today,
      usedMinutes: 0,
      allowClicks: 0,
      allowedUntil: 0,
      cooldownUntil: 0
    };
  }

  function loadState(cb) {
    chrome.storage.local.get(["shortsState"], (res) => {
      let state = res.shortsState || defaultState();

      if (state.date !== today) {
        state = defaultState();
        chrome.storage.local.set({ shortsState: state });
      }

      cb(state);
    });
  }

  function saveState(state) {
    chrome.storage.local.set({ shortsState: state });
  }

  /* ---------------- BLOCK SCREEN ---------------- */

  function showBlockedScreen(state) {
    muteTab(); // 🔇 GUARANTEED audio stop

    document.documentElement.innerHTML = `
      <head><title>Shorts Blocked</title></head>
      <body style="
        margin:0;
        height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        background:#0f0f0f;
        color:white;
        font-family:Arial;
        text-align:center;
      ">
        <div style="width:320px">
          <h1>🚫 Shorts Blocked</h1>
          <p>Used today: ${state.usedMinutes}/${DAILY_LIMIT} minutes</p>

          <button id="allowBtn" style="
            margin-top:16px;
            padding:12px;
            width:100%;
            font-size:14px;
            cursor:pointer;
          ">
            ▶ Allow 5 minutes
          </button>

          <p id="warning" style="color:#ffb347;margin-top:12px;"></p>
        </div>
      </body>
    `;

    const btn = document.getElementById("allowBtn");
    const warning = document.getElementById("warning");
    const now = Date.now();

    if (state.allowClicks >= MAX_CLICKS) {
      btn.disabled = true;
      warning.textContent = "⚠ Daily limit reached. Come back tomorrow.";
      return;
    }

    if (now < state.cooldownUntil) {
      btn.disabled = true;
      const mins = Math.ceil((state.cooldownUntil - now) / 60000);
      warning.textContent = `⏳ Take a break. Try again in ${mins} minute(s).`;
    }

    btn.onclick = () => {
      const now = Date.now();

      if (state.allowClicks >= MAX_CLICKS) {
        warning.textContent = "⚠ No more unlocks left today.";
        return;
      }

      if (now < state.cooldownUntil) {
        const mins = Math.ceil((state.cooldownUntil - now) / 60000);
        warning.textContent = `⏳ Please wait ${mins} minute(s).`;
        return;
      }

      unmuteTab(); // 🔊 allow sound again

      state.allowClicks += 1;
      state.usedMinutes += ALLOW_TIME;
      state.allowedUntil = now + ALLOW_TIME * 60 * 1000;
      state.cooldownUntil = state.allowedUntil + COOLDOWN_MS;

      saveState(state);
      location.reload();
    };
  }

  /* ---------------- TIMER OVERLAY ---------------- */

  function showTimerOverlay(state) {
    unmuteTab();
    clearInterval(timerInterval);

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;
      bottom:20px;
      right:20px;
      background:#111;
      color:white;
      padding:12px;
      border-radius:8px;
      width:220px;
      font-family:Arial;
      z-index:999999;
      box-shadow:0 0 10px rgba(0,0,0,0.5);
    `;

    overlay.innerHTML = `
      <div style="font-size:13px;margin-bottom:6px;">
        ⏱ Time left: <span id="timeText"></span>
      </div>
      <div style="background:#333;height:6px;border-radius:4px;">
        <div id="bar" style="
          background:#00ff99;
          height:6px;
          width:100%;
          border-radius:4px;
        "></div>
      </div>
    `;

    document.body.appendChild(overlay);

    function update() {
      const now = Date.now();
      const remaining = state.allowedUntil - now;

      if (remaining <= 0) {
        clearInterval(timerInterval);
        location.reload();
        return;
      }

      const total = ALLOW_TIME * 60 * 1000;
      const percent = (remaining / total) * 100;

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      document.getElementById("timeText").textContent =
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      document.getElementById("bar").style.width = `${percent}%`;
    }

    update();
    timerInterval = setInterval(update, 1000);
  }

  /* ---------------- CORE CHECK ---------------- */

  function check() {
    if (!location.pathname.startsWith("/shorts")) return;

    loadState((state) => {
      const now = Date.now();

      if (now < state.allowedUntil) {
        showTimerOverlay(state);
        return;
      }

      showBlockedScreen(state);
    });
  }

  // Initial run
  check();

  // SPA navigation handling
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      check();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
})();
