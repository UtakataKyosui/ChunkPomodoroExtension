import { 
  PomodoroManager, 
  PomodoroSession, 
  PomodoroSettings, 
  PomodoroCallbacks,
  PomodoroType,
  DEFAULT_POMODORO_SETTINGS,
  createPomodoroManager 
} from './pomodoro';
import { 
  NotificationManager, 
  createNotificationManager,
  createWorkSessionCompleteNotification,
  createBreakCompleteNotification,
  createChunkCompleteNotification,
  playNotificationSound,
  vibrate
} from './notifications';
import { PomodoroStorage, createPomodoroStorage } from './storage';
import { formatTime } from './timer';

export interface ChunkData {
  id: string;
  startTime: Date;
  duration: number; // minutes
  endTime: Date | null;
  tasks: TaskData[];
  pomodoroSessions: PomodoroSession[];
  status: 'active' | 'completed' | 'paused';
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  estimatedPomodoros: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  chunkId: string;
}

export interface PomodoroExecutorCallbacks {
  onSessionStart?: (session: PomodoroSession) => void;
  onSessionComplete?: (session: PomodoroSession) => void;
  onSessionPause?: (session: PomodoroSession) => void;
  onSessionResume?: (session: PomodoroSession) => void;
  onSessionStop?: (session: PomodoroSession) => void;
  onTick?: (session: PomodoroSession, remaining: number, formatted: string) => void;
  onChunkComplete?: (chunk: ChunkData) => void;
  onChunkStart?: (chunk: ChunkData) => void;
  onTaskComplete?: (task: TaskData) => void;
  onStatisticsUpdate?: (stats: any) => void;
  onError?: (error: Error) => void;
}

export class PomodoroExecutor {
  private pomodoroManager: PomodoroManager;
  private notificationManager: NotificationManager;
  private storage: PomodoroStorage;
  private callbacks: PomodoroExecutorCallbacks;
  private currentChunk: ChunkData | null = null;
  private tasks: TaskData[] = [];
  private isInitialized = false;

  constructor(callbacks: PomodoroExecutorCallbacks = {}) {
    this.callbacks = callbacks;
    this.storage = createPomodoroStorage({
      onError: (error) => this.callbacks.onError?.(error)
    });
    this.setupManagers();
  }

  private setupManagers(): void {
    const pomodoroCallbacks: PomodoroCallbacks = {
      onSessionStart: (session) => {
        this.handleSessionStart(session);
      },
      onSessionComplete: (session) => {
        this.handleSessionComplete(session);
      },
      onSessionPause: (session) => {
        this.handleSessionPause(session);
      },
      onSessionResume: (session) => {
        this.handleSessionResume(session);
      },
      onSessionStop: (session) => {
        this.handleSessionStop(session);
      },
      onTick: (session, remaining) => {
        this.handleTick(session, remaining);
      },
      onCycleComplete: (completedSessions) => {
        this.handleCycleComplete(completedSessions);
      }
    };

    this.pomodoroManager = createPomodoroManager(DEFAULT_POMODORO_SETTINGS, pomodoroCallbacks);

    this.notificationManager = createNotificationManager({
      onClicked: (notificationId) => {
        this.handleNotificationClick(notificationId);
      },
      onButtonClicked: (notificationId, buttonIndex) => {
        this.handleNotificationButtonClick(notificationId, buttonIndex);
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Request notification permission
      await this.notificationManager.requestPermission();

      // Load saved settings
      const savedSettings = await this.storage.getSettings();
      if (savedSettings) {
        this.pomodoroManager.updateSettings(savedSettings);
      }

      // Load current session if exists
      const currentSession = await this.storage.getCurrentSession();
      if (currentSession) {
        // Restore session state
        await this.restoreSession(currentSession);
      }

      // Load current chunk if exists
      const currentChunk = await this.storage.getCurrentChunk();
      if (currentChunk) {
        this.currentChunk = currentChunk;
      }

      // Load tasks
      this.tasks = await this.storage.getTasks();

      this.isInitialized = true;
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async restoreSession(sessionData: any): Promise<void> {
    try {
      // Validate session data
      if (!sessionData || !sessionData.id || !sessionData.type) {
        throw new Error('Invalid session data for restoration');
      }

      // Calculate elapsed time and remaining time
      const now = Date.now();
      const startTime = new Date(sessionData.startTime).getTime();
      const elapsed = now - startTime;
      const originalDuration = sessionData.duration;
      const remaining = Math.max(0, originalDuration - elapsed);

      // If session has expired, mark as completed
      if (remaining <= 0) {
        console.log('Session expired during restoration, marking as completed');
        // Don't restore, session has already completed
        return;
      }

      // Create a new timer with remaining time for the session
      const currentSession = {
        id: sessionData.id,
        type: sessionData.type as PomodoroType,
        duration: originalDuration,
        startTime: new Date(startTime),
        endTime: null,
        completed: false,
        taskId: sessionData.taskId || null
      };

      // Restore the timer state in PomodoroManager
      if (sessionData.isRunning && !sessionData.isPaused) {
        // Create a new session that continues from where it left off
        this.pomodoroManager.startWorkSession(sessionData.taskId);
        
        // Update the internal timer to reflect the correct remaining time
        const timer = (this.pomodoroManager as any).timer;
        if (timer) {
          timer.state.remaining = remaining;
          timer.state.startTime = startTime;
        }
      }

      console.log(`Session restored: ${sessionData.type} session with ${Math.floor(remaining / 1000)}s remaining`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  private handleSessionStart(session: PomodoroSession): void {
    this.saveCurrentSession(session);
    this.callbacks.onSessionStart?.(session);
    
    if (session.type === 'work') {
      playNotificationSound('work-start.mp3');
    } else {
      playNotificationSound('break-start.mp3');
    }
    
    vibrate(200);
  }

  private async handleSessionComplete(session: PomodoroSession): Promise<void> {
    // Save completed session
    const sessions = await this.storage.getSessions();
    sessions.push(session);
    await this.storage.saveSessions(sessions);
    await this.storage.clearCurrentSession();

    // Update current chunk
    if (this.currentChunk) {
      this.currentChunk.pomodoroSessions.push(session);
      await this.storage.saveCurrentChunk(this.currentChunk);
    }

    // Show notification
    if (session.type === 'work') {
      await this.notificationManager.showNotification(
        createWorkSessionCompleteNotification()
      );
      // Mark task as completed if it was a work session
      if (session.taskId) {
        await this.completeTask(session.taskId);
      }
    } else {
      await this.notificationManager.showNotification(
        createBreakCompleteNotification()
      );
    }

    // Play completion sound
    playNotificationSound(session.type === 'work' ? 'work-complete.mp3' : 'break-complete.mp3');
    vibrate([200, 100, 200]);

    this.callbacks.onSessionComplete?.(session);
    await this.updateStatistics();
  }

  private handleSessionPause(session: PomodoroSession): void {
    this.saveCurrentSession(session);
    this.callbacks.onSessionPause?.(session);
  }

  private handleSessionResume(session: PomodoroSession): void {
    this.saveCurrentSession(session);
    this.callbacks.onSessionResume?.(session);
  }

  private handleSessionStop(session: PomodoroSession): void {
    this.storage.clearCurrentSession();
    this.callbacks.onSessionStop?.(session);
  }

  private handleTick(session: PomodoroSession, remaining: number): void {
    const formatted = formatTime(remaining);
    this.callbacks.onTick?.(session, remaining, formatted);
  }

  private handleCycleComplete(completedSessions: number): void {
    if (this.currentChunk) {
      const chunkPomodoroCount = this.currentChunk.pomodoroSessions.filter(
        s => s.type === 'work' && s.completed
      ).length;
      
      if (chunkPomodoroCount >= this.getExpectedPomodorosForChunk()) {
        this.completeCurrentChunk();
      }
    }
  }

  private handleNotificationClick(notificationId: string): void {
    // Handle notification click - could open popup or focus extension
    console.log('Notification clicked:', notificationId);
  }

  private handleNotificationButtonClick(notificationId: string, buttonIndex: number): void {
    // Handle notification button clicks
    if (buttonIndex === 0) {
      // First button - usually "Start next session"
      if (this.pomodoroManager.getNextSessionType() === 'work') {
        this.startWorkSession();
      } else {
        this.startBreakSession();
      }
    } else if (buttonIndex === 1) {
      // Second button - usually "Skip" or "Continue"
      // Could implement skip logic here
    }
  }

  private async saveCurrentSession(session: PomodoroSession): Promise<void> {
    try {
      await this.storage.saveCurrentSession(session);
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  private getExpectedPomodorosForChunk(): number {
    if (!this.currentChunk) return 0;
    
    const totalEstimated = this.currentChunk.tasks.reduce(
      (sum, task) => sum + task.estimatedPomodoros, 0
    );
    
    return Math.max(totalEstimated, Math.floor(this.currentChunk.duration / 25)); // Default to 25min pomodoros
  }

  async startWorkSession(taskId?: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      this.pomodoroManager.startWorkSession(taskId);
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  async startBreakSession(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      this.pomodoroManager.startBreakSession();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  pauseSession(): void {
    try {
      this.pomodoroManager.pauseSession();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  resumeSession(): void {
    try {
      this.pomodoroManager.resumeSession();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  stopSession(): void {
    try {
      this.pomodoroManager.stopSession();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  skipSession(): void {
    try {
      this.pomodoroManager.skipSession();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  async startNewChunk(duration: number = 120): Promise<ChunkData> {
    try {
      const chunk: ChunkData = {
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        duration,
        endTime: null,
        tasks: [],
        pomodoroSessions: [],
        status: 'active'
      };

      this.currentChunk = chunk;
      await this.storage.saveCurrentChunk(chunk);
      this.callbacks.onChunkStart?.(chunk);
      
      return chunk;
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async completeCurrentChunk(): Promise<void> {
    if (!this.currentChunk) return;

    try {
      this.currentChunk.status = 'completed';
      this.currentChunk.endTime = new Date();

      // Save to chunk history
      const chunks = await this.storage.getChunks();
      chunks.push(this.currentChunk);
      await this.storage.saveChunks(chunks);

      // Show completion notification
      const completedPomodoros = this.currentChunk.pomodoroSessions.filter(
        s => s.type === 'work' && s.completed
      ).length;
      
      await this.notificationManager.showNotification(
        createChunkCompleteNotification(completedPomodoros)
      );

      this.callbacks.onChunkComplete?.(this.currentChunk);
      
      // Clear current chunk
      this.currentChunk = null;
      await this.storage.clearCurrentChunk();

      await this.updateStatistics();
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  async addTask(title: string, description: string, estimatedPomodoros: number, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<TaskData> {
    try {
      const task: TaskData = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        estimatedPomodoros,
        priority,
        completed: false,
        chunkId: this.currentChunk?.id || ''
      };

      this.tasks.push(task);
      
      if (this.currentChunk) {
        this.currentChunk.tasks.push(task);
        await this.storage.saveCurrentChunk(this.currentChunk);
      }

      await this.storage.saveTasks(this.tasks);
      return task;
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async completeTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      task.completed = true;
      await this.storage.saveTasks(this.tasks);
      this.callbacks.onTaskComplete?.(task);
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  private async updateStatistics(): Promise<void> {
    try {
      const sessions = await this.storage.getSessions();
      const chunks = await this.storage.getChunks();
      
      const stats = {
        totalSessions: sessions.length,
        completedWorkSessions: sessions.filter(s => s.type === 'work' && s.completed).length,
        totalChunks: chunks.length,
        completedChunks: chunks.filter(c => c.status === 'completed').length,
        totalTasks: this.tasks.length,
        completedTasks: this.tasks.filter(t => t.completed).length,
        lastUpdated: new Date()
      };

      await this.storage.saveStatistics(stats);
      this.callbacks.onStatisticsUpdate?.(stats);
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  // Getter methods
  getCurrentSession(): PomodoroSession | null {
    return this.pomodoroManager.getCurrentSession();
  }

  getCurrentChunk(): ChunkData | null {
    return this.currentChunk ? { ...this.currentChunk } : null;
  }

  getTasks(): TaskData[] {
    return [...this.tasks];
  }

  getSettings(): PomodoroSettings {
    return this.pomodoroManager.getSettings();
  }

  getRemainingTime(): number {
    return this.pomodoroManager.getRemainingTime();
  }

  getFormattedRemainingTime(): string {
    return this.pomodoroManager.getFormattedRemainingTime();
  }

  isSessionActive(): boolean {
    return this.pomodoroManager.isSessionActive();
  }

  isSessionRunning(): boolean {
    return this.pomodoroManager.isSessionRunning();
  }

  isSessionPaused(): boolean {
    return this.pomodoroManager.isSessionPaused();
  }

  async updateSettings(newSettings: Partial<PomodoroSettings>): Promise<void> {
    try {
      this.pomodoroManager.updateSettings(newSettings);
      await this.storage.saveSettings(this.pomodoroManager.getSettings());
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  async exportData(): Promise<string> {
    return await this.storage.exportData();
  }

  async importData(jsonData: string): Promise<void> {
    await this.storage.importData(jsonData);
    await this.initialize(); // Reload data after import
  }

  destroy(): void {
    this.pomodoroManager.destroy();
    this.currentChunk = null;
    this.tasks = [];
    this.isInitialized = false;
  }
}

export function createPomodoroExecutor(callbacks?: PomodoroExecutorCallbacks): PomodoroExecutor {
  return new PomodoroExecutor(callbacks);
}