import './style.css';
import { appState, STATES } from './state.js';
import { Timer } from './timer.js';
import { requestWakeLock, releaseWakeLock } from './wakelock.js';
import { UI } from './ui.js';

// Timer instance
let currentTimer = null;

// Initial Draw
UI.updateButtons(appState.completedSessions);

/**
 * Settings Modal Logic
 */
const settingsModal = document.getElementById('settings-modal');
const focusInput = document.getElementById('focus-duration');
const restInput = document.getElementById('rest-duration');
const focusVal = document.getElementById('focus-val');
const restVal = document.getElementById('rest-val');

// Open Settings
document.getElementById('settings-btn').addEventListener('click', () => {
  // Load current values
  const { focusDuration, restDuration } = appState.settings;
  focusInput.value = focusDuration;
  restInput.value = restDuration;
  focusVal.innerText = focusDuration;
  restVal.innerText = restDuration;

  settingsModal.classList.remove('hidden');
});

// Close Settings (Save)
document.getElementById('close-settings-btn').addEventListener('click', () => {
  const newFocus = parseInt(focusInput.value);
  const newRest = parseInt(restInput.value);

  appState.updateSettings({
    focusDuration: newFocus,
    restDuration: newRest
  });

  settingsModal.classList.add('hidden');
});

// Slider Inputs
focusInput.addEventListener('input', (e) => {
  focusVal.innerText = e.target.value;
});

restInput.addEventListener('input', (e) => {
  restVal.innerText = e.target.value;
});


/**
 * Event Listeners
 */

// 1. Session Buttons
document.querySelectorAll('.session-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const index = parseInt(btn.dataset.index);
    startSession(index);
  });
});

// 2. Reset Button
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset all progress?')) {
    appState.resetProgress();
    UI.updateButtons(appState.completedSessions);
  }
});

// 3. Overlay Interactions (Tap to transition / Long Press to cancel)
const overlay = document.getElementById('overlay-view');

// Transition Logic (Tap)
overlay.addEventListener('click', (e) => {
  // If long press cancelled, don't trigger click?
  // Browser usually handles click after mouseup.
  // We should differentiate. But for now, let's just check state.

  // Logic depends on State
  if (appState.currentState === STATES.FOCUS_END) {
    startRest();
  } else if (appState.currentState === STATES.COMPLETE) {
    finishSession();
  }
});

// Double Click/Tap to Cancel (Focus Mode & Rest Mode)
overlay.addEventListener('dblclick', (e) => {
  if (appState.currentState === STATES.FOCUS || appState.currentState === STATES.REST) {
    cancelSession();
  }
});

// Auto-hide Cursor Logic
let cursorTimeout;
document.addEventListener('mousemove', () => {
  document.body.classList.remove('no-cursor');
  clearTimeout(cursorTimeout);

  // Hide after 3 seconds of inactivity
  cursorTimeout = setTimeout(() => {
    document.body.classList.add('no-cursor');
  }, 3000);
});


/**
 * Logic Flows
 */

async function startSession(index) {
  if (appState.isSessionCompleted(index)) {
    // Toggle off? Spec: "If pressing it again, reset it to default state."
    // But only if we are in Main Page?
    // Wait, spec says: "If user clicks [after session], go back to main page... highlight in green... If pressing it again, reset it to default state."
    // This implies clicking on the main menu button resets it.
    // So we should handle that logic here.
    // We need to remove it from completed list.
    const idxInList = appState.completedSessions.indexOf(index);
    if (idxInList > -1) {
      appState.completedSessions.splice(idxInList, 1);
      appState.saveProgress();
      UI.updateButtons(appState.completedSessions);
      return;
    }
  }

  // Start Focus
  appState.setActiveButton(index);
  appState.setState(STATES.FOCUS);

  UI.showOverlay(STATES.FOCUS);
  await requestWakeLock();

  // Request Immersive Fullscreen
  if (document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.warn('Fullscreen denied:', e);
    }
  }

  // Start Timer (Dynamic Duration)
  const duration = appState.settings.focusDuration;

  currentTimer = new Timer(duration, null, () => {
    // Focus Complete
    onFocusComplete();
  });
  currentTimer.start();
}

function onFocusComplete() {
  appState.setState(STATES.FOCUS_END); // Custom state
  UI.showOverlay(STATES.FOCUS_END);
  // Timer is done, but Wake Lock stays? Spec: "slowly turn on... purple... If user taps... display REST_TIMER"
  // So yes, wait for tap.
}

function startRest() {
  appState.setState(STATES.REST);
  UI.showOverlay(STATES.REST);

  // Start Rest Timer (Dynamic Duration)
  const duration = appState.settings.restDuration;

  currentTimer = new Timer(duration, (remaining, total) => {
    const secs = Math.ceil(remaining / 1000);
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    UI.updateTimer(mm, ss);
  }, () => {
    // Rest Complete
    onRestComplete();
  });
  currentTimer.start();
}

function onRestComplete() {
  appState.setState(STATES.COMPLETE);
  UI.showOverlay(STATES.COMPLETE);
}

function finishSession() {
  appState.completeSession(); // Marks button as checked, saves, updates UI
  appState.setState(STATES.IDLE);
  UI.hideOverlay();
  releaseWakeLock();
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.log(err));
  }
  // UI.updateButtons called by listener?
  // We didn't subscribe UI to state changes in StateManager yet strictly, 
  // but StateManager calls listeners.
  // Ideally we subscribe UI.updateButtons to StateManager?
  // Or just call it here.
  UI.updateButtons(appState.completedSessions);
}

async function cancelSession() {
  if (confirm('Are you sure you want to cancel the session?')) {
    if (currentTimer) currentTimer.cancel();
    appState.setState(STATES.IDLE);
    UI.hideOverlay();
    releaseWakeLock();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
  } else {
    // If not cancelled, re-enter fullscreen if lost (some interactions might exit it)
    // Request Immersive Fullscreen
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {
        console.warn('Fullscreen denied:', e);
      }
    }
  }
}




