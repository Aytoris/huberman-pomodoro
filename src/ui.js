/**
 * UI Manipulation functions
 */
import { STATES } from './state.js';

const menuView = document.getElementById('menu-view');
const overlayView = document.getElementById('overlay-view');
const timerDisplay = document.getElementById('timer-display');
const messageDisplay = document.getElementById('message-display');
const buttons = document.querySelectorAll('.session-btn');

export const UI = {
    updateButtons(completedSessions) {
        buttons.forEach((btn, index) => {
            // Index is string in DOM dataset?
            if (completedSessions.includes(index)) {
                btn.classList.add('completed');
            } else {
                btn.classList.remove('completed');
            }
        });
    },

    showOverlay(state) {
        menuView.classList.add('hidden');
        overlayView.classList.remove('hidden');

        // Reset classes
        overlayView.className = 'view'; // active

        switch (state) {
            case STATES.FOCUS:
                overlayView.classList.add('focus-running');
                timerDisplay.style.display = 'none'; // "screen off"
                messageDisplay.innerText = '';
                break;
            case STATES.FOCUS_END: // Custom state for purple phase
                overlayView.classList.add('focus-end');
                timerDisplay.style.display = 'none';
                messageDisplay.innerText = 'Tap to Start Rest';
                break;
            case STATES.REST:
                overlayView.classList.add('rest-running');
                timerDisplay.style.display = 'block';
                messageDisplay.innerText = 'Resting...';
                break;
            case STATES.COMPLETE: // Rest End -> Red
                overlayView.classList.add('rest-end');
                timerDisplay.style.display = 'none';
                messageDisplay.innerText = 'Session Complete. Tap to Return.';
                break;
        }
    },

    hideOverlay() {
        overlayView.classList.add('hidden');
        menuView.classList.remove('hidden');
    },

    updateTimer(mm, ss) {
        timerDisplay.innerText = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }
};
