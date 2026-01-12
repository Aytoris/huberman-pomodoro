/**
 * State definitions and management
 */

export const STATES = {
    IDLE: 'IDLE',
    FOCUS: 'FOCUS',
    FOCUS_END: 'FOCUS_END',
    REST: 'REST',
    COMPLETE: 'COMPLETE'
};

export const CONSTANTS = {
    FOCUS_DURATION_MIN: 50,
    REST_DURATION_MIN: 10,
    LONG_PRESS_DURATION_MS: 2000
};

// Simple state store
class StateManager {
    constructor() {
        this.currentState = STATES.IDLE;
        this.activeButtonIndex = null;
        this.completedSessions = this.loadProgress();
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(l => l(this.currentState, this));
    }

    setState(newState) {
        console.log(`State change: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
        this.notify();
    }

    setActiveButton(index) {
        this.activeButtonIndex = index;
    }

    completeSession() {
        if (this.activeButtonIndex !== null) {
            this.completedSessions.push(this.activeButtonIndex);
            this.activeButtonIndex = null;
            this.saveProgress();
            this.notify(); // To update UI checkmarks
        }
    }

    loadProgress() {
        const saved = localStorage.getItem('huberman-pomodoro-progress');
        return saved ? JSON.parse(saved) : [];
    }

    saveProgress() {
        localStorage.setItem('huberman-pomodoro-progress', JSON.stringify(this.completedSessions));
    }

    resetProgress() {
        this.completedSessions = [];
        this.saveProgress();
        this.notify();
    }

    isSessionCompleted(index) {
        return this.completedSessions.includes(index);
    }
}

export const appState = new StateManager();
