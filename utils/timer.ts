export interface TimerState {
  id: string;
  duration: number; // milliseconds
  remaining: number; // milliseconds
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
}

export interface TimerCallbacks {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export class Timer {
  private state: TimerState;
  private callbacks: TimerCallbacks;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly tickInterval = 1000; // 1 second

  constructor(duration: number, callbacks: TimerCallbacks = {}) {
    this.state = {
      id: this.generateId(),
      duration,
      remaining: duration,
      isRunning: false,
      isPaused: false,
      startTime: null,
      pauseTime: null
    };
    this.callbacks = callbacks;
  }

  private generateId(): string {
    return `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private tick(): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    const now = Date.now();
    const elapsed = now - (this.state.startTime || now);
    this.state.remaining = Math.max(0, this.state.duration - elapsed);

    this.callbacks.onTick?.(this.state.remaining);

    if (this.state.remaining <= 0) {
      this.complete();
    }
  }

  private complete(): void {
    this.state.isRunning = false;
    this.state.remaining = 0;
    this.clearInterval();
    this.callbacks.onComplete?.();
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.startTime = Date.now();
    
    this.intervalId = setInterval(() => this.tick(), this.tickInterval);
    this.callbacks.onStart?.();
  }

  pause(): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.state.isPaused = true;
    this.state.pauseTime = Date.now();
    this.clearInterval();
    this.callbacks.onPause?.();
  }

  resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) return;

    const pauseDuration = Date.now() - (this.state.pauseTime || 0);
    this.state.startTime = (this.state.startTime || 0) + pauseDuration;
    this.state.isPaused = false;
    this.state.pauseTime = null;

    this.intervalId = setInterval(() => this.tick(), this.tickInterval);
    this.callbacks.onResume?.();
  }

  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.remaining = this.state.duration;
    this.state.startTime = null;
    this.state.pauseTime = null;
    this.clearInterval();
    this.callbacks.onStop?.();
  }

  reset(newDuration?: number): void {
    this.stop();
    if (newDuration !== undefined) {
      this.state.duration = newDuration;
    }
    this.state.remaining = this.state.duration;
  }

  getState(): Readonly<TimerState> {
    return { ...this.state };
  }

  getRemainingTime(): number {
    return this.state.remaining;
  }

  getRemainingMinutes(): number {
    return Math.ceil(this.state.remaining / (1000 * 60));
  }

  getRemainingSeconds(): number {
    return Math.ceil((this.state.remaining % (1000 * 60)) / 1000);
  }

  getFormattedTime(): string {
    const minutes = this.getRemainingMinutes();
    const seconds = this.getRemainingSeconds();
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  isRunning(): boolean {
    return this.state.isRunning && !this.state.isPaused;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  destroy(): void {
    this.stop();
    this.callbacks = {};
  }
}

export function createTimer(duration: number, callbacks?: TimerCallbacks): Timer {
  return new Timer(duration, callbacks);
}

export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

export function millisecondsToMinutes(milliseconds: number): number {
  return Math.floor(milliseconds / (1000 * 60));
}

export function millisecondsToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}