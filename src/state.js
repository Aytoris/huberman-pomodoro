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

const DEFAULT_SETTINGS = {
    focusDuration: 50,
    restDuration: 10
};

// Simple state store
class StateManager {
    constructor() {
        this.currentState = STATES.IDLE;
        this.activeButtonIndex = null;
        this.completedSessions = this.loadProgress();
        this.settings = this.loadSettings();
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

    // Settings Management
    loadSettings() {
        const saved = localStorage.getItem('huberman-pomodoro-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    }

    saveSettings() {
        localStorage.setItem('huberman-pomodoro-settings', JSON.stringify(this.settings));
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        // Notify listeners if needed, though settings might not trigger state change directly
        // But UI might need to update (e.g. if we display duration somewhere)
    }
}

export const appState = new StateManager();

