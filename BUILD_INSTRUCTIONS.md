# Build Instructions

このプロジェクトは、Chrome拡張機能のビルドとZipファイル生成に焦点を当てたCI/CDシステムを提供します。

## 🚀 ビルド方法

### 自動ビルド（推奨）

#### 1. GitHub Actionsで自動ビルド
```bash
# mainブランチまたはPRへのプッシュ時に自動実行
git push origin main
```

#### 2. 手動トリガー（バージョン指定）
1. GitHubリポジトリの「Actions」タブに移動
2. 「Build Chrome Extension」ワークフローを選択
3. 「Run workflow」をクリック
4. バージョンタイプを選択（patch/minor/major）
5. 「Run workflow」を実行

### ローカルビルド

```bash
# 開発環境でのビルド
npm run dev

# 本番用ビルド
npm run build:extension

# 個別実行
npm run build     # Plasmoビルド
npm run package   # Zipパッケージ生成
```

## 📦 成果物

### GitHub Actions成果物
- **Artifacts**: 各ビルドで生成されるZipファイル
- **保存期間**: 30日間
- **ダウンロード**: ActionsページからZipファイルをダウンロード

### リリース（mainブランチ手動トリガー時）
- **GitHubリリース**: タグ付きリリースを自動作成
- **バージョン管理**: package.jsonの自動更新
- **アセット**: Zipファイルをリリースに添付

## 🔧 ワークフロー詳細

### トリガー条件
- **プッシュ**: `main`、`build-to-zipfile-release`ブランチ
- **プルリクエスト**: `main`ブランチ向け
- **手動実行**: バージョン指定可能

### ビルドステップ
1. **環境準備**: Node.js 18、ImageMagick
2. **アイコン生成**: ポモドーロタイマーデザインのPNG作成
3. **依存関係**: TailwindCSS v4対応の`npm ci`
4. **ビルド**: Plasmoによる拡張機能ビルド
5. **パッケージ**: Zipファイル生成
6. **アップロード**: GitHub Artifactsに保存

### TailwindCSS v4設定
```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0-alpha.26",
    "tailwindcss": "^4.0.0-alpha.26"
  }
}
```

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

## 📁 ビルド構造

```
build/
└── chrome-mv3-prod/
    ├── manifest.json      # Chrome拡張機能マニフェスト
    ├── popup.html         # ポップアップページ
    ├── options.html       # 設定ページ
    ├── background.js      # サービスワーカー
    ├── assets/           # アイコンとリソース
    └── ...               # その他のビルド成果物
```

## 🔍 CI監視

自動エラー修正システムが組み込まれています：

```bash
# CI監視・自動修正を開始
npm run ci:monitor

# CI状態確認
npm run ci:status

# リアルタイム監視
npm run ci:watch
```

### 自動修正対応エラー
- TailwindCSS v4 PostCSS設定エラー
- tsconfig.json不足
- アイコン/アセット不足
- 依存関係エラー
- Plasmo設定問題

## 🛠️ 手動リリース

```bash
# パッチバージョン（1.0.0 → 1.0.1）
npm run release:patch

# マイナーバージョン（1.0.0 → 1.1.0）
npm run release:minor

# メジャーバージョン（1.0.0 → 2.0.0）
npm run release:major
```

## 📋 使用例

### 開発フロー
1. 機能開発・修正
2. PRを作成（自動ビルド・テスト）
3. PRマージ（mainブランチビルド）
4. 必要に応じて手動リリース

### テスト用ビルド取得
1. GitHub ActionsページでビルドJob確認
2. Artifactsセクションからzipダウンロード
3. Chrome拡張機能として読み込み

### リリース用ビルド
1. GitHub Actions → 「Build Chrome Extension」
2. 「Run workflow」→ バージョンタイプ選択
3. Releasesページから正式版ダウンロード

## ⚡ 高速化Tips

- **キャッシュ**: Node.jsモジュールは自動キャッシュ
- **並列処理**: 複数ステップの並列実行
- **差分ビルド**: 変更されたファイルのみ処理
- **アイコン最適化**: ImageMagickによる効率的な画像生成