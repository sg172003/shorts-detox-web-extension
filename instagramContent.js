(function () {
  const DAILY_LIMIT = 15;
  const ALLOW_TIME = 5;
  const MAX_CLICKS = 3;
  const COOLDOWN_MS = 2 * 60 * 1000;

  const today = new Date().toDateString();

  let overlay = null;
  let timerOverlay = null;
  let timerInterval = null;
  let isBlocked = false;

  let cachedState = null;

  let lastCheckTime = 0;
  const OBSERVER_THROTTLE_MS = 200;

  // ---------- helpers ----------

  function isReelsPage() {
    return location.pathname.startsWith("/reel/") ||
           location.pathname.startsWith("/reels/");
  }

  function getVideos() {
    return document.querySelectorAll("video");
  }

  function muteAllVideos() {
    if (!isBlocked) return;
    getVideos().forEach(v => {
      if (!v.paused) v.pause();
      v.muted = true;
    });
  }

  function unmuteAllVideos() {
    getVideos().forEach(v => {
      v.muted = false;
    });
  }

  // ---------- state ----------

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
    if (cachedState) {
      cb(cachedState);
      return;
    }

    chrome.storage.local.get(["shortsState"], (res) => {
      let state = res.shortsState || defaultState();

      if (state.date !== today) {
        state = defaultState();
        chrome.storage.local.set({ shortsState: state });
      }

      cachedState = state;
      cb(state);
    });
  }

  function saveState(state) {
    cachedState = state;
    chrome.storage.local.set({ shortsState: state });
  }

  // ---------- TIMER UI ----------

  function isTimerVisible() {
    return !!document.getElementById("igTimeText");
  }

  function removeTimerUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    if (timerOverlay) {
      timerOverlay.remove();
      timerOverlay = null;
    }
  }

  function showTimerUI(state) {
    if (timerInterval && isTimerVisible()) return;

    if (timerOverlay) {
      timerOverlay.remove();
      timerOverlay = null;
    }

    timerOverlay = document.createElement("div");
    timerOverlay.id = "ig-timer-overlay";
    timerOverlay.style.cssText = `
      position:fixed;
      top:20px;
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

    timerOverlay.innerHTML = `
      <div style="font-size:13px;margin-bottom:6px;">
        ⏱ Time left: <span id="igTimeText"></span>
      </div>
      <div style="background:#333;height:6px;border-radius:4px;">
        <div id="igBar" style="
          background:#00ff99;
          height:6px;
          width:100%;
          border-radius:4px;
        "></div>
      </div>
    `;

    document.body.appendChild(timerOverlay);

    function update() {
      const remaining = state.allowedUntil - Date.now();

      if (remaining <= 0) {
        removeTimerUI();
        showBlockedOverlay(state);
        return;
      }

      const percent = (remaining / (ALLOW_TIME * 60000)) * 100;
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);

      const t = document.getElementById("igTimeText");
      const b = document.getElementById("igBar");

      if (t && b) {
        t.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        b.style.width = `${percent}%`;
      }
    }

    update();
    if (!timerInterval) timerInterval = setInterval(update, 1000);
  }

  // ---------- BLOCK OVERLAY ----------

  function showBlockedOverlay(state) {
    isBlocked = true;
    muteAllVideos();
    removeTimerUI();

    if (overlay) return;

    overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:#0f0f0f;
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-family:Arial;
      text-align:center;
    `;

    overlay.innerHTML = `
      <div style="width:320px">
        <h1>🚫 Reels Blocked</h1>
        <p>Used today: ${state.usedMinutes}/${DAILY_LIMIT} minutes</p>
        <button id="allowBtn" style="
          margin-top:12px;
          padding:12px;
          width:100%;
          font-size:14px;
          cursor:pointer;
          background:#ffffff;
          color:#000000;
          border:none;
          border-radius:6px;
          font-weight:600;
        ">
          ▶ Allow 5 minutes
        </button>
        <p id="warning" style="color:#ffb347;margin-top:12px;"></p>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = overlay.querySelector("#allowBtn");
    const warning = overlay.querySelector("#warning");

    function setDisabled(disabled) {
      btn.disabled = disabled;
      btn.style.opacity = disabled ? "0.5" : "1";
      btn.style.cursor = disabled ? "not-allowed" : "pointer";
    }

    const now = Date.now();

    if (state.allowClicks >= MAX_CLICKS) {
      setDisabled(true);
      warning.textContent = "⚠ Daily limit reached.";
      return;
    }

    if (now < state.cooldownUntil) {
      setDisabled(true);
      const mins = Math.ceil((state.cooldownUntil - now) / 60000);
      warning.textContent = `⏳ Please wait ${mins} minute(s).`;

      setTimeout(() => {
        loadState((latest) => {
          if (Date.now() >= latest.cooldownUntil && overlay) {
            setDisabled(false);
            warning.textContent = "";
          }
        });
      }, state.cooldownUntil - now);

      return;
    }

    btn.onclick = () => {
      isBlocked = false;

      state.allowClicks += 1;
      state.usedMinutes += ALLOW_TIME;
      state.allowedUntil = Date.now() + ALLOW_TIME * 60 * 1000;
      state.cooldownUntil = state.allowedUntil + COOLDOWN_MS;

      saveState(state);

      overlay.remove();
      overlay = null;

      unmuteAllVideos();
      showTimerUI(state);
    };
  }

  // ---------- CORE ----------

  function check() {
    if (!isReelsPage()) return;

    loadState((state) => {
      if (Date.now() < state.allowedUntil) {
        isBlocked = false;
        unmuteAllVideos();
        showTimerUI(state);
      } else {
        showBlockedOverlay(state);
      }
    });
  }

  check();

  // ---------- OBSERVER ----------

  const observer = new MutationObserver(() => {
    const now = Date.now();
    if (now - lastCheckTime < OBSERVER_THROTTLE_MS) return;
    lastCheckTime = now;

    if (isReelsPage()) {
      if (isBlocked) muteAllVideos();
      check();
    } else {
      removeTimerUI();
      isBlocked = false;
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });
})();
