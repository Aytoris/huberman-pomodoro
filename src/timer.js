/**
 * Timer Logic
 * Uses Date.now() to ensure accuracy even if throttled
 */
export class Timer {
    constructor(durationMinutes, onTick, onComplete) {
        this.duration = durationMinutes * 60 * 1000;
        this.remaining = this.duration;
        this.startTime = null;
        this.timerId = null;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = Date.now();
        this.endTime = this.startTime + this.remaining;

        this.tick();
    }

    tick() {
        if (!this.isRunning) return;

        const now = Date.now();
        this.remaining = Math.max(0, this.endTime - now);

        // Call tick callback with formatted time or percentage
        if (this.onTick) {
            this.onTick(this.remaining, this.duration);
        }

        if (this.remaining <= 0) {
            this.stop();
            if (this.onComplete) {
                this.onComplete();
            }
            return;
        }

        // Use requestAnimationFrame for smoother UI updates if needed, 
        // or setTimeout for battery saving. 
        // Since screen is black/static mostly, 1s interval is fine?
        // But specs say "screen off... then slowly turn on". 
        // We might need to know when it ends precisely.
        this.timerId = requestAnimationFrame(() => this.tick());
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.timerId);
    }

    cancel() {
        this.stop();
        this.remaining = this.duration; // Reset
    }
}
