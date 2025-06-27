import React, { useState, useEffect } from "react"
import { Play, Pause, Square, Clock, Timer, Settings, CheckCircle } from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Progress } from "./components/ui/progress"
import "./styles/globals.css"

interface PomodoroState {
  currentSession: 'work' | 'shortBreak' | 'longBreak' | null;
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number; // seconds
  totalTime: number; // seconds
  currentTask: string;
  completedPomodoros: number;
  currentChunkTime: number; // minutes remaining in chunk
}

function IndexPopup() {
  const [state, setState] = useState<PomodoroState>({
    currentSession: null,
    isRunning: false,
    isPaused: false,
    remainingTime: 25 * 60, // 25 minutes
    totalTime: 25 * 60,
    currentTask: "作業に集中しましょう",
    completedPomodoros: 0,
    currentChunkTime: 120 // 2 hours
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    switch (state.currentSession) {
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
    if (state.totalTime === 0) return 0;
    return ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
  };

  const handleStartWork = () => {
    setState(prev => ({
      ...prev,
      currentSession: 'work',
      isRunning: true,
      isPaused: false,
      remainingTime: 25 * 60,
      totalTime: 25 * 60
    }));
  };

  const handleStartBreak = () => {
    const isLongBreak = state.completedPomodoros > 0 && state.completedPomodoros % 4 === 0;
    const breakTime = isLongBreak ? 15 * 60 : 5 * 60;
    
    setState(prev => ({
      ...prev,
      currentSession: isLongBreak ? 'longBreak' : 'shortBreak',
      isRunning: true,
      isPaused: false,
      remainingTime: breakTime,
      totalTime: breakTime
    }));
  };

  const handlePause = () => {
    setState(prev => ({
      ...prev,
      isPaused: true,
      isRunning: false
    }));
  };

  const handleResume = () => {
    setState(prev => ({
      ...prev,
      isPaused: false,
      isRunning: true
    }));
  };

  const handleStop = () => {
    setState(prev => ({
      ...prev,
      currentSession: null,
      isRunning: false,
      isPaused: false,
      remainingTime: 25 * 60,
      totalTime: 25 * 60
    }));
  };

  // Timer effect (simplified for demo)
  useEffect(() => {
    if (!state.isRunning || state.isPaused) return;

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.remainingTime <= 1) {
          // Session completed
          if (prev.currentSession === 'work') {
            return {
              ...prev,
              completedPomodoros: prev.completedPomodoros + 1,
              currentSession: null,
              isRunning: false,
              remainingTime: 25 * 60,
              totalTime: 25 * 60
            };
          } else {
            return {
              ...prev,
              currentSession: null,
              isRunning: false,
              remainingTime: 25 * 60,
              totalTime: 25 * 60
            };
          }
        }
        return {
          ...prev,
          remainingTime: prev.remainingTime - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused]);

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
            {!state.isRunning && !state.isPaused && (
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
            
            {state.isRunning && !state.isPaused && (
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

            {state.isPaused && (
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
            state.isRunning ? 'bg-green-100 text-green-800' : 
            state.isPaused ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            <Clock className="h-3 w-3" />
            <span>
              {state.isRunning ? '実行中' : state.isPaused ? '一時停止' : '待機中'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexPopup;