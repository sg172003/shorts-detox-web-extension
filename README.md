# 📵 Shorts Detox – Control Short-Form Content Consumption

**Shorts Detox** is a Chrome extension that helps you **reduce excessive consumption of short-form video content** like **YouTube Shorts** and **Instagram Reels** by enforcing **daily time limits, cooldowns, and intentional breaks**.

This extension is designed to be:
- 🚀 Lightweight
- 🧠 Behavior-focused (not aggressive blocking)
- 🧩 SPA-safe (works smoothly on modern web apps)
- 📊 Transparent with live usage stats



## ✨ Features

### ⏱ Smart Time Limiting
- **15 minutes/day** total limit (configurable in code)
- **5 minutes per unlock**
- Maximum **3 unlocks per day**

### ⛔ Intelligent Blocking
- Shorts/Reels are **blocked by default**
- Full-screen overlay prevents accidental consumption
- Audio is fully muted when blocked

### 🔄 Cooldown Mechanism
- **2-minute cooldown** after each 5-minute session
- Unlock button is disabled during cooldown
- Automatically re-enabled when cooldown ends (no refresh needed)

### 📊 Live Popup Dashboard
- Daily usage progress bar
- Unlocks used / remaining
- Cooldown progress indicator
- Real-time status: **Allowed / Blocked**
- Updates every second while popup is open

### 🎯 Supported Platforms
- ✅ YouTube Shorts
- ✅ Instagram Reels (full-screen only)



## 🧠 How It Works (High-Level)

1. When you open Shorts/Reels:
   - Content is blocked immediately
   - Audio is muted
2. You must **intentionally click “Allow 5 minutes”**
3. During allowed time:
   - Timer & progress bar are shown
4. After time expires:
   - Content is blocked again
   - Cooldown is enforced
5. All usage data is stored locally in Chrome

No servers.  
No tracking.  
No ads.

##🧪 Tested On

-Google Chrome (latest)
-YouTube Shorts (SPA)
-Instagram Reels (SPA)
-Desktop environments

##🚀 Future Improvements

-Separate limits per platform
-Customizable limits via popup
-Additional platforms (Facebook Reels, etc.)
-Chrome Web Store release
-Analytics: “Time saved today”



