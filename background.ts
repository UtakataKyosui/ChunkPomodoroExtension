export {}

chrome.runtime.onInstalled.addListener(() => {
  console.log("チャンクポモドーロセッター installed")
  
  // Initialize default settings
  chrome.storage.local.set({
    chunkDuration: 120, // 2 hours in minutes
    workDuration: 25,   // 25 minutes
    shortBreakDuration: 5,  // 5 minutes
    longBreakDuration: 15,  // 15 minutes
    currentChunk: null,
    currentPomodoro: null,
    timerState: 'stopped' // 'running', 'paused', 'stopped'
  })
})

// Handle timer alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    // Handle pomodoro completion
    handlePomodoroComplete()
  } else if (alarm.name === 'chunkTimer') {
    // Handle chunk completion
    handleChunkComplete()
  }
})

function handlePomodoroComplete() {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'ポモドーロ完了',
    message: 'ポモドーロが完了しました。休憩を取りましょう！'
  })
  
  // Update storage
  chrome.storage.local.get(['currentPomodoro'], (result) => {
    if (result.currentPomodoro) {
      // Switch to break mode or next pomodoro
      // Implementation depends on current state
    }
  })
}

function handleChunkComplete() {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'チャンク完了',
    message: 'チャンクが完了しました。お疲れ様でした！'
  })
  
  // Reset chunk state
  chrome.storage.local.set({
    currentChunk: null,
    timerState: 'stopped'
  })
}

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startTimer') {
    startTimer(request.duration, request.type)
  } else if (request.action === 'pauseTimer') {
    pauseTimer()
  } else if (request.action === 'stopTimer') {
    stopTimer()
  }
  
  sendResponse({ success: true })
})

function startTimer(duration: number, type: 'pomodoro' | 'chunk') {
  const alarmName = type === 'pomodoro' ? 'pomodoroTimer' : 'chunkTimer'
  
  chrome.alarms.create(alarmName, {
    delayInMinutes: duration
  })
  
  chrome.storage.local.set({
    timerState: 'running',
    timerStartTime: Date.now(),
    timerDuration: duration * 60 * 1000, // Convert to milliseconds
    timerType: type
  })
}

function pauseTimer() {
  chrome.alarms.clearAll()
  chrome.storage.local.set({ timerState: 'paused' })
}

function stopTimer() {
  chrome.alarms.clearAll()
  chrome.storage.local.set({ 
    timerState: 'stopped',
    currentChunk: null,
    currentPomodoro: null
  })
}