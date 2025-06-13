import { Timer, TimerCallbacks, minutesToMilliseconds } from './timer';

export type PomodoroType = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  type: PomodoroType;
  duration: number; // milliseconds
  startTime: Date;
  endTime: Date | null;
  completed: boolean;
  taskId: string | null;
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // number of work sessions before long break
}

export interface PomodoroCallbacks {
  onSessionStart?: (session: PomodoroSession) => void;
  onSessionComplete?: (session: PomodoroSession) => void;
  onSessionPause?: (session: PomodoroSession) => void;
  onSessionResume?: (session: PomodoroSession) => void;
  onSessionStop?: (session: PomodoroSession) => void;
  onTick?: (session: PomodoroSession, remaining: number) => void;
  onCycleComplete?: (completedSessions: number) => void;
}

export class PomodoroManager {
  private settings: PomodoroSettings;
  private callbacks: PomodoroCallbacks;
  private currentSession: PomodoroSession | null = null;
  private timer: Timer | null = null;
  private sessionHistory: PomodoroSession[] = [];
  private workSessionsCompleted = 0;

  constructor(settings: PomodoroSettings, callbacks: PomodoroCallbacks = {}) {
    this.settings = settings;
    this.callbacks = callbacks;
  }

  private generateSessionId(): string {
    return `pomodoro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSession(type: PomodoroType, taskId?: string): PomodoroSession {
    const duration = this.getSessionDuration(type);
    return {
      id: this.generateSessionId(),
      type,
      duration,
      startTime: new Date(),
      endTime: null,
      completed: false,
      taskId: taskId || null
    };
  }

  private getSessionDuration(type: PomodoroType): number {
    switch (type) {
      case 'work':
        return minutesToMilliseconds(this.settings.workDuration);
      case 'shortBreak':
        return minutesToMilliseconds(this.settings.shortBreakDuration);
      case 'longBreak':
        return minutesToMilliseconds(this.settings.longBreakDuration);
    }
  }

  private getTimerCallbacks(): TimerCallbacks {
    return {
      onTick: (remaining: number) => {
        if (this.currentSession) {
          this.callbacks.onTick?.(this.currentSession, remaining);
        }
      },
      onComplete: () => {
        this.completeCurrentSession();
      },
      onStart: () => {
        if (this.currentSession) {
          this.callbacks.onSessionStart?.(this.currentSession);
        }
      },
      onPause: () => {
        if (this.currentSession) {
          this.callbacks.onSessionPause?.(this.currentSession);
        }
      },
      onResume: () => {
        if (this.currentSession) {
          this.callbacks.onSessionResume?.(this.currentSession);
        }
      },
      onStop: () => {
        if (this.currentSession) {
          this.callbacks.onSessionStop?.(this.currentSession);
        }
      }
    };
  }

  private completeCurrentSession(): void {
    if (!this.currentSession) return;

    this.currentSession.completed = true;
    this.currentSession.endTime = new Date();
    this.sessionHistory.push({ ...this.currentSession });

    if (this.currentSession.type === 'work') {
      this.workSessionsCompleted++;
    }

    this.callbacks.onSessionComplete?.(this.currentSession);

    if (this.currentSession.type === 'work') {
      this.callbacks.onCycleComplete?.(this.workSessionsCompleted);
    }

    this.currentSession = null;
    this.timer = null;
  }

  startWorkSession(taskId?: string): void {
    if (this.isSessionActive()) {
      throw new Error('Cannot start new session while another is active');
    }

    this.currentSession = this.createSession('work', taskId);
    this.timer = new Timer(this.currentSession.duration, this.getTimerCallbacks());
    this.timer.start();
  }

  startBreakSession(): void {
    if (this.isSessionActive()) {
      throw new Error('Cannot start new session while another is active');
    }

    const breakType = this.shouldTakeLongBreak() ? 'longBreak' : 'shortBreak';
    this.currentSession = this.createSession(breakType);
    this.timer = new Timer(this.currentSession.duration, this.getTimerCallbacks());
    this.timer.start();
  }

  pauseSession(): void {
    if (!this.timer || !this.isSessionActive()) {
      throw new Error('No active session to pause');
    }
    this.timer.pause();
  }

  resumeSession(): void {
    if (!this.timer || !this.isSessionActive()) {
      throw new Error('No active session to resume');
    }
    this.timer.resume();
  }

  stopSession(): void {
    if (!this.timer || !this.currentSession) {
      throw new Error('No active session to stop');
    }

    this.timer.stop();
    this.currentSession = null;
    this.timer = null;
  }

  skipSession(): void {
    if (!this.currentSession) {
      throw new Error('No active session to skip');
    }

    this.completeCurrentSession();
  }

  private shouldTakeLongBreak(): boolean {
    return this.workSessionsCompleted > 0 && 
           this.workSessionsCompleted % this.settings.longBreakInterval === 0;
  }

  getNextSessionType(): PomodoroType {
    if (!this.currentSession) {
      return 'work';
    }

    if (this.currentSession.type === 'work') {
      return this.shouldTakeLongBreak() ? 'longBreak' : 'shortBreak';
    }

    return 'work';
  }

  getCurrentSession(): PomodoroSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getSessionHistory(): PomodoroSession[] {
    return [...this.sessionHistory];
  }

  getTodaysSessions(): PomodoroSession[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.sessionHistory.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
  }

  getWorkSessionsCompletedToday(): number {
    return this.getTodaysSessions().filter(session => 
      session.type === 'work' && session.completed
    ).length;
  }

  getTotalWorkSessionsCompleted(): number {
    return this.sessionHistory.filter(session => 
      session.type === 'work' && session.completed
    ).length;
  }

  getRemainingTime(): number {
    return this.timer?.getRemainingTime() || 0;
  }

  getFormattedRemainingTime(): string {
    return this.timer?.getFormattedTime() || '00:00';
  }

  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  isSessionRunning(): boolean {
    return this.timer?.isRunning() || false;
  }

  isSessionPaused(): boolean {
    return this.timer?.isPaused() || false;
  }

  updateSettings(newSettings: Partial<PomodoroSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PomodoroSettings {
    return { ...this.settings };
  }

  reset(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }
    this.currentSession = null;
    this.workSessionsCompleted = 0;
  }

  destroy(): void {
    if (this.timer) {
      this.timer.destroy();
    }
    this.currentSession = null;
    this.timer = null;
    this.sessionHistory = [];
    this.workSessionsCompleted = 0;
  }
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4
};

export function createPomodoroManager(
  settings: PomodoroSettings = DEFAULT_POMODORO_SETTINGS,
  callbacks?: PomodoroCallbacks
): PomodoroManager {
  return new PomodoroManager(settings, callbacks);
}

export function getSessionTypeDisplayName(type: PomodoroType): string {
  switch (type) {
    case 'work':
      return '作業';
    case 'shortBreak':
      return '短い休憩';
    case 'longBreak':
      return '長い休憩';
  }
}

export function calculateProductivityScore(sessions: PomodoroSession[]): number {
  const completedWorkSessions = sessions.filter(s => s.type === 'work' && s.completed).length;
  const totalWorkSessions = sessions.filter(s => s.type === 'work').length;
  
  if (totalWorkSessions === 0) return 0;
  
  return Math.round((completedWorkSessions / totalWorkSessions) * 100);
}