# Project Knowledge: チャンクポモドーロセッター

## 既知の実装パターン

### Chrome Extension Best Practices
- Manifest V3 準拠
- Service Worker でのバックグラウンド処理
- `chrome.storage.local` を使用したデータ永続化
- `chrome.alarms` API による正確なタイミング制御

### Plasmo Framework 特有の実装
- 自動的なmanifest.json生成
- React/TypeScript のネイティブサポート
- ホットリロード機能
- 自動バンドリング

### タイマー実装の注意点
- ブラウザのスリープ/ウェイク サイクル対応
- Service Worker での状態管理
- 拡張機能の有効/無効化対応
- ストレージ制限への対応

## 技術的な課題と解決策

### 1. バックグラウンドタイマーの精度
**課題**: Service Worker でのタイマー精度確保
**解決策**: 
- `chrome.alarms` API 使用
- ストレージでの状態永続化
- 定期的な同期チェック

### 2. データ永続化
**課題**: chrome.storage の制限
**解決策**:
- データ構造の最適化
- 古いデータの自動削除
- バックアップ/復元機能

### 3. 通知管理
**課題**: 適切な通知タイミング
**解決策**:
- ユーザー設定の尊重
- 通知許可の管理
- 音声/視覚的フィードバック

## 開発環境設定

### 必要なツール
- Node.js (LTS版)
- Chrome ブラウザ
- 開発者モード有効化
- Plasmo CLI

### 開発コマンド
```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run package # Chrome Web Store 用パッケージ作成
```

### デバッグ方法
1. Chrome 拡張機能ページで「Developer mode」を有効化
2. `build/chrome-mv3-dev` フォルダを読み込み
3. ポップアップ、オプション、バックグラウンドをそれぞれ検査

## UI/UX 設計原則

### デザイン方針
- ミニマルで集中を妨げないインターフェース
- 必要な機能への素早いアクセス
- タイマー状態の明確な視覚的フィードバック
- 一貫したアイコンとカラースキーム

### レスポンシブ対応
- 標準ポップアップサイズ (400x600px) 最適化
- 異なる画面解像度対応
- アクセシビリティ準拠

### 国際化対応
- 日本語（メイン）
- 英語（サブ）
- `chrome.i18n` API 使用

## パフォーマンス最適化

### メモリ使用量
- バックグラウンドスクリプトのメモリフットプリント最小化
- イベントリスナーの適切なクリーンアップ
- 大きなデータセットの効率的な構造化

### バッテリー影響
- バックグラウンドでの最小限のCPU使用
- 効率的なタイマー実装
- 不要なネットワークリクエストの回避

## セキュリティ考慮事項

### データ保護
- 全データのローカル保存
- 機密情報の追跡なし
- 通知の適切な許可管理

### Chrome セキュリティ
- Content Security Policy 準拠
- eval() やインラインスクリプトの回避
- ユーザー入力の適切なサニタイゼーション

## 既知の制約事項

### Chrome Extension 制限
- ストレージ容量制限 (sync: 100KB, local: 10MB)
- バックグラウンド実行時間制限
- 通知頻度制限

### Plasmo Framework 制限
- 特定のChrome API の制約
- 自動生成されるmanifest.json の制限
- カスタムビルド設定の複雑さ

## 今後の拡張予定

### 短期的改善
- タスク管理機能の強化
- 統計レポートの詳細化
- カスタムサウンド対応

### 長期的展望
- 他ブラウザ対応
- モバイルアプリ連携
- AI による生産性分析

## リソース・参考資料

### 公式ドキュメント
- [Chrome Extensions Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Plasmo Framework Documentation](https://docs.plasmo.com/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

### 関連ライブラリ
- React Hooks for state management
- TypeScript interfaces for type safety
- Chrome APIs for extension functionality