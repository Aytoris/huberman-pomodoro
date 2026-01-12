import './style.css';
import { appState, STATES, CONSTANTS } from './state.js';
import { Timer } from './timer.js';
import { requestWakeLock, releaseWakeLock } from './wakelock.js';
import { UI } from './ui.js';

// Timer instance
let currentTimer = null;
let longPressTimer = null;

// Initial Draw
UI.updateButtons(appState.completedSessions);

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

// Cancel Logic (Long Press)
const startLongPress = (e) => {
  // Only allow cancel if we are in a running state (FOCUS or REST)
  // Actually, allowing cancel anytime in overlay is good.
  longPressTimer = setTimeout(() => {
    cancelSession();
  }, CONSTANTS.LONG_PRESS_DURATION_MS);
};

const endLongPress = (e) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

overlay.addEventListener('mousedown', startLongPress);
overlay.addEventListener('touchstart', startLongPress, { passive: true });
overlay.addEventListener('mouseup', endLongPress);
overlay.addEventListener('touchend', endLongPress);

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

// Double Click/Tap to Cancel (Focus Mode)
overlay.addEventListener('dblclick', (e) => {
  if (appState.currentState === STATES.FOCUS) {
    cancelSession();
  }
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

  // Start Timer (50 min)
  // For debugging: 50 min. If needed, we can speed up.
  const duration = CONSTANTS.FOCUS_DURATION_MIN;

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

  // Start Rest Timer (10 min)
  const duration = CONSTANTS.REST_DURATION_MIN;

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
  // UI.updateButtons called by listener?
  // We didn't subscribe UI to state changes in StateManager yet strictly, 
  // but StateManager calls listeners.
  // Ideally we subscribe UI.updateButtons to StateManager?
  // Or just call it here.
  UI.updateButtons(appState.completedSessions);
}

function cancelSession() {
  if (currentTimer) currentTimer.cancel();
  appState.setState(STATES.IDLE);
  UI.hideOverlay();
  releaseWakeLock();
  alert('Session Cancelled');
}



