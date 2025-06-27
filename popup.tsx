import React, { useState, useEffect, useRef } from "react"
import { Play, Pause, Square, Clock, Timer, Settings, CheckCircle } from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Progress } from "./components/ui/progress"
import { PomodoroManager, createPomodoroManager, DEFAULT_POMODORO_SETTINGS, PomodoroSession, PomodoroType } from "./utils/pomodoro"
import "./styles/globals.css"

interface PomodoroState {
  currentSession: PomodoroSession | null;
  remainingTime: number; // milliseconds
  currentTask: string;
  completedPomodoros: number;
  currentChunkTime: number; // minutes remaining in chunk
}

function IndexPopup() {
  const pomodoroManager = useRef<PomodoroManager | null>(null);
  const [state, setState] = useState<PomodoroState>({
    currentSession: null,
    remainingTime: 25 * 60 * 1000, // 25 minutes in milliseconds
    currentTask: "作業に集中しましょう",
    completedPomodoros: 0,
    currentChunkTime: 120 // 2 hours
  });

  // Initialize PomodoroManager
  useEffect(() => {
    pomodoroManager.current = createPomodoroManager(DEFAULT_POMODORO_SETTINGS, {
      onTick: (session, remaining) => {
        setState(prev => ({
          ...prev,
          remainingTime: remaining
        }));
      },
      onSessionStart: (session) => {
        setState(prev => ({
          ...prev,
          currentSession: session
        }));
      },
      onSessionComplete: (session) => {
        if (session.type === 'work') {
          setState(prev => ({
            ...prev,
            completedPomodoros: prev.completedPomodoros + 1,
            currentSession: null,
            remainingTime: 25 * 60 * 1000
          }));
        } else {
          setState(prev => ({
            ...prev,
            currentSession: null,
            remainingTime: 25 * 60 * 1000
          }));
        }
      },
      onSessionPause: (session) => {
        setState(prev => ({ ...prev, currentSession: session }));
      },
      onSessionResume: (session) => {
        setState(prev => ({ ...prev, currentSession: session }));
      },
      onSessionStop: (session) => {
        setState(prev => ({
          ...prev,
          currentSession: null,
          remainingTime: 25 * 60 * 1000
        }));
      }
    });

    return () => {
      if (pomodoroManager.current) {
        pomodoroManager.current.destroy();
      }
    };
  }, []);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    if (!state.currentSession) {
      return 'ポモドーロタイマー';
    }
    switch (state.currentSession.type) {
      case 'work':
        return '作業時間';
      case 'shortBreak':
        return '短い休憩';
      case 'longBreak':
        return '長い休憩';
      default:
        return 'ポモドーロタイマー';
    }
  };

  const getProgressPercent = () => {
    if (!state.currentSession) return 0;
    const totalTime = state.currentSession.duration;
    if (totalTime === 0) return 0;
    return ((totalTime - state.remainingTime) / totalTime) * 100;
  };

  const handleStartWork = () => {
    if (pomodoroManager.current) {
      try {
        pomodoroManager.current.startWorkSession();
      } catch (error) {
        console.error('Failed to start work session:', error);
      }
    }
  };

  const handleStartBreak = () => {
    if (pomodoroManager.current) {
      try {
        pomodoroManager.current.startBreakSession();
      } catch (error) {
        console.error('Failed to start break session:', error);
      }
    }
  };

  const handlePause = () => {
    if (pomodoroManager.current) {
      try {
        pomodoroManager.current.pauseSession();
      } catch (error) {
        console.error('Failed to pause session:', error);
      }
    }
  };

  const handleResume = () => {
    if (pomodoroManager.current) {
      try {
        pomodoroManager.current.resumeSession();
      } catch (error) {
        console.error('Failed to resume session:', error);
      }
    }
  };

  const handleStop = () => {
    if (pomodoroManager.current) {
      try {
        pomodoroManager.current.stopSession();
      } catch (error) {
        console.error('Failed to stop session:', error);
      }
    }
  };


  return (
    <div className="w-96 p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">チャンクポモドーロ</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Timer Card */}
      <Card className="mb-4">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">{getSessionTitle()}</CardTitle>
          <CardDescription>{state.currentTask}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">
              {formatTime(state.remainingTime)}
            </div>
            <Progress value={getProgressPercent()} className="h-2" />
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-2">
            {!state.currentSession && (
              <>
                <Button onClick={handleStartWork} className="flex items-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>作業開始</span>
                </Button>
                <Button onClick={handleStartBreak} variant="secondary" className="flex items-center space-x-2">
                  <Timer className="h-4 w-4" />
                  <span>休憩</span>
                </Button>
              </>
            )}
            
            {state.currentSession && pomodoroManager.current?.isSessionRunning() && (
              <>
                <Button onClick={handlePause} variant="secondary" className="flex items-center space-x-2">
                  <Pause className="h-4 w-4" />
                  <span>一時停止</span>
                </Button>
                <Button onClick={handleStop} variant="destructive" className="flex items-center space-x-2">
                  <Square className="h-4 w-4" />
                  <span>停止</span>
                </Button>
              </>
            )}

            {state.currentSession && pomodoroManager.current?.isSessionPaused() && (
              <>
                <Button onClick={handleResume} className="flex items-center space-x-2">
                  <Play className="h-4 w-4" />
                  <span>再開</span>
                </Button>
                <Button onClick={handleStop} variant="destructive" className="flex items-center space-x-2">
                  <Square className="h-4 w-4" />
                  <span>停止</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{state.completedPomodoros}</div>
            <div className="text-xs text-muted-foreground">完了ポモドーロ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-secondary-foreground">{Math.floor(state.currentChunkTime / 60)}h {state.currentChunkTime % 60}m</div>
            <div className="text-xs text-muted-foreground">チャンク残り時間</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Task */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>現在のタスク</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{state.currentTask}</p>
        </CardContent>
      </Card>

      {/* Session Status */}
      {state.currentSession && (
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            pomodoroManager.current?.isSessionRunning() ? 'bg-green-100 text-green-800' : 
            pomodoroManager.current?.isSessionPaused() ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            <Clock className="h-3 w-3" />
            <span>
              {pomodoroManager.current?.isSessionRunning() ? '実行中' : 
               pomodoroManager.current?.isSessionPaused() ? '一時停止' : '待機中'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexPopup;