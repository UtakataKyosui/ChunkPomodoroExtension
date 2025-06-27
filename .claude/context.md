# Project Context: チャンクポモドーロセッター Chrome Extension

## Project Overview

**プロジェクト名**: チャンクポモドーロセッター (Chunk Pomodoro Setter)  
**プロジェクトタイプ**: Chrome Extension  
**開発フレームワーク**: Plasmo Framework  
**主要技術**: TypeScript, React, Chrome Extension APIs

## 目的・コンセプト

2時間のチャンク（時間ブロック）とポモドーロテクニックを組み合わせた時間管理システムを提供するChrome拡張機能。

### 核心機能
- **チャンク管理**: 2時間の時間ブロック（30分-4時間でユーザー設定可能）
- **ポモドーロ統合**: チャンク内での25分/5分の作業・休憩サイクル
- **タスク組織化**: 定義されたチャンク内でのタスク完了

## アーキテクチャ

### Chrome Extension構造 (Plasmo Framework)
```
/
├── package.json           # プロジェクト設定
├── popup.tsx              # 拡張機能ポップアップUI (React)
├── popup.css              # ポップアップスタイル
├── options.tsx            # 設定ページ (React)
├── options.css            # オプションページスタイル
├── background.ts          # Service Worker (TypeScript)
├── content/               # コンテンツスクリプト（必要に応じて）
├── assets/                # アイコン、サウンド、画像
├── utils/                 # 共有ユーティリティ
│   ├── storage.ts         # データ永続化
│   ├── timer.ts           # タイマーロジック
│   ├── notifications.ts   # 通知システム
│   └── analytics.ts       # 統計追跡
└── build/                 # Plasmoによって生成
    ├── chrome-mv3-dev/    # 開発ビルド
    └── chrome-mv3-prod/   # 本番ビルド
```

## 技術スタック

### フロントエンド
- **React**: UIコンポーネント
- **TypeScript**: 型安全性
- **CSS**: スタイリング
- **Plasmo Framework**: Chrome拡張機能開発フレームワーク

### Chrome Extension APIs
- `chrome.storage.local`: データ永続化
- `chrome.alarms`: 正確なタイミング管理
- `chrome.notifications`: デスクトップ通知
- `chrome.runtime`: バックグラウンド処理

### 開発ツール
- **Plasmo**: 自動マニフェスト生成、ホットリロード
- **npm**: パッケージ管理
- **DevContainer**: 一貫した開発環境

## データモデル

### Chunk Data Structure
```typescript
interface Chunk {
  id: string;
  startTime: Date;
  duration: number; // 分単位 (デフォルト: 120)
  endTime: Date;
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
  status: 'active' | 'completed' | 'paused';
}
```

### Task Data Structure
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  estimatedPomodoros: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  chunkId: string;
}
```

### Pomodoro Session Data Structure
```typescript
interface PomodoroSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // 分単位
  startTime: Date;
  endTime: Date;
  completed: boolean;
  taskId: string | null;
}
```

## 開発フェーズ

### フェーズ1: コアインフラストラクチャ
1. プロジェクトセットアップ
2. ストレージシステム実装
3. タイマーエンジン構築

### フェーズ2: UIコンポーネント
1. ポップアップインターフェース
2. オプションページ
3. 統計ダッシュボード

### フェーズ3: 高度な機能
1. 通知システム
2. タスク管理
3. 分析・レポート

## パフォーマンス目標

- ポップアップ表示: 500ms以内
- バックグラウンド処理: 最小限のメモリ使用量
- バッテリー影響: 最小限のCPU使用

## セキュリティ・プライバシー

- 全データローカル保存（外部サーバーなし）
- 機密情報追跡なし
- Chrome Web Store ポリシー準拠

## 対象ユーザー

- **メインターゲット**: 生産性向上を求める知識労働者
- **年齢層**: 20-40歳
- **使用環境**: Chrome ブラウザ使用者

## 競合優位性

- チャンクとポモドーロの統合
- シンプルで直感的なUI
- オフライン対応
- プライバシー重視設計