export interface NotificationOptions {
  title: string;
  message: string;
  iconPath?: string;
  buttons?: NotificationButton[];
  priority?: number;
  silent?: boolean;
}

export interface NotificationButton {
  title: string;
  iconUrl?: string;
}

export interface NotificationCallbacks {
  onClicked?: (notificationId: string) => void;
  onButtonClicked?: (notificationId: string, buttonIndex: number) => void;
  onClosed?: (notificationId: string, byUser: boolean) => void;
}

export class NotificationManager {
  private callbacks: NotificationCallbacks;
  private activeNotifications: Map<string, NotificationOptions> = new Map();

  constructor(callbacks: NotificationCallbacks = {}) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.onClicked.addListener((notificationId: string) => {
        this.callbacks.onClicked?.(notificationId);
      });

      chrome.notifications.onButtonClicked.addListener(
        (notificationId: string, buttonIndex: number) => {
          this.callbacks.onButtonClicked?.(notificationId, buttonIndex);
        }
      );

      chrome.notifications.onClosed.addListener(
        (notificationId: string, byUser: boolean) => {
          this.activeNotifications.delete(notificationId);
          this.callbacks.onClosed?.(notificationId, byUser);
        }
      );
    }
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      return new Promise((resolve) => {
        chrome.permissions.request(
          { permissions: ['notifications'] },
          (granted) => resolve(granted)
        );
      });
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async hasPermission(): Promise<boolean> {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      return new Promise((resolve) => {
        chrome.permissions.contains(
          { permissions: ['notifications'] },
          (hasPermission) => resolve(hasPermission)
        );
      });
    }

    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }

    return false;
  }

  async showNotification(options: NotificationOptions): Promise<string> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    const notificationId = this.generateNotificationId();
    this.activeNotifications.set(notificationId, options);

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      return this.showChromeNotification(notificationId, options);
    } else {
      return this.showWebNotification(notificationId, options);
    }
  }

  private async showChromeNotification(
    notificationId: string,
    options: NotificationOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const chromeOptions: chrome.notifications.NotificationOptions = {
        type: 'basic',
        iconUrl: options.iconPath || '/assets/icon-48.png',
        title: options.title,
        message: options.message,
        priority: options.priority || 0,
        silent: options.silent || false
      };

      if (options.buttons && options.buttons.length > 0) {
        chromeOptions.buttons = options.buttons.map(button => ({
          title: button.title,
          iconUrl: button.iconUrl
        }));
      }

      chrome.notifications.create(notificationId, chromeOptions, (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id || notificationId);
        }
      });
    });
  }

  private async showWebNotification(
    notificationId: string,
    options: NotificationOptions
  ): Promise<string> {
    const notification = new Notification(options.title, {
      body: options.message,
      icon: options.iconPath || '/assets/icon-48.png',
      silent: options.silent || false
    });

    notification.onclick = () => {
      this.callbacks.onClicked?.(notificationId);
    };

    notification.onclose = () => {
      this.activeNotifications.delete(notificationId);
      this.callbacks.onClosed?.(notificationId, true);
    };

    return notificationId;
  }

  async clearNotification(notificationId: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      return new Promise((resolve) => {
        chrome.notifications.clear(notificationId, () => {
          this.activeNotifications.delete(notificationId);
          resolve();
        });
      });
    }

    this.activeNotifications.delete(notificationId);
  }

  async clearAllNotifications(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      return new Promise((resolve) => {
        chrome.notifications.getAll((notifications) => {
          const clearPromises = Object.keys(notifications).map(id =>
            new Promise<void>((resolve) => {
              chrome.notifications.clear(id, () => resolve());
            })
          );
          Promise.all(clearPromises).then(() => {
            this.activeNotifications.clear();
            resolve();
          });
        });
      });
    }

    this.activeNotifications.clear();
  }

  getActiveNotifications(): Map<string, NotificationOptions> {
    return new Map(this.activeNotifications);
  }
}

export function createNotificationManager(callbacks?: NotificationCallbacks): NotificationManager {
  return new NotificationManager(callbacks);
}

export function createWorkSessionCompleteNotification(): NotificationOptions {
  return {
    title: 'ポモドーロタイマー',
    message: '作業セッションが完了しました！休憩を取りましょう。',
    buttons: [
      { title: '休憩開始' },
      { title: '続行' }
    ]
  };
}

export function createBreakCompleteNotification(): NotificationOptions {
  return {
    title: 'ポモドーロタイマー',
    message: '休憩時間が終了しました！次の作業を始めましょう。',
    buttons: [
      { title: '作業開始' },
      { title: 'スキップ' }
    ]
  };
}

export function createChunkCompleteNotification(completedPomodoros: number): NotificationOptions {
  return {
    title: 'チャンクポモドーロセッター',
    message: `チャンクが完了しました！${completedPomodoros}個のポモドーロを完了しました。`,
    buttons: [
      { title: '統計を見る' },
      { title: '新しいチャンク開始' }
    ]
  };
}

export function createRemindNotification(sessionType: 'work' | 'break'): NotificationOptions {
  const isWork = sessionType === 'work';
  return {
    title: 'ポモドーロタイマー',
    message: isWork 
      ? 'まだ作業中ですか？休憩を取ることをお勧めします。'
      : 'まだ休憩中ですか？作業を再開することをお勧めします。',
    buttons: [
      { title: isWork ? '休憩開始' : '作業開始' },
      { title: '後で' }
    ]
  };
}

export async function playNotificationSound(soundFile: string = 'notification.mp3'): Promise<void> {
  try {
    const audio = new Audio(`/assets/sounds/${soundFile}`);
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

export function vibrate(pattern: number | number[] = 200): boolean {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
}