# CI Monitoring and Auto-Fix System

このプロジェクトには、GitHub ActionsのCIを自動監視し、一般的なビルドエラーを自動修正するシステムが含まれています。

## 機能

### 🔍 CI監視・自動修正スクリプト (`ci-monitor.sh`)
GitHub Actionsのビルドエラーを自動的に検出し、一般的な問題を修正してリトライします。

#### 対応エラー
- **TailwindCSS PostCSSエラー**: 新しいプラグイン構成に自動修正
- **tsconfig.json不足**: 適切な設定ファイルを自動生成
- **アイコン/アセットエラー**: SVGアイコンを自動生成
- **マニフェストエラー**: Chrome拡張機能の設定を修正
- **依存関係エラー**: パッケージの再インストール
- **コンパイルエラー**: 型定義の追加

### 🛠️ CI ユーティリティ (`ci-utils.sh`)
GitHub Actionsの状態確認とログ取得のためのヘルパーツール。

## 使用方法

### 1. 自動監視・修正
```bash
# CI を自動監視して失敗時に修正を試行
npm run ci:monitor

# または直接実行
./scripts/ci-monitor.sh
```

### 2. CI状態確認
```bash
# 最新のCI実行状況を確認
npm run ci:status

# リアルタイムでCI状態を監視
npm run ci:watch

# ログを取得
npm run ci:logs
```

### 3. 手動ユーティリティ
```bash
# 特定のRunのログを取得
./scripts/ci-utils.sh get_logs 123456

# 実行中のワークフローをキャンセル
./scripts/ci-utils.sh cancel_runs

# ワークフローを手動トリガー
./scripts/ci-utils.sh trigger_workflow release.yml patch
```

## 自動修正の流れ

1. **監視開始**: 指定ブランチの最新ワークフロー実行を監視
2. **失敗検出**: ビルドが失敗した場合、ログを自動取得
3. **エラー分析**: ログから既知のエラーパターンを検索
4. **自動修正**: 検出されたエラーに対する修正を適用
5. **コミット**: 修正をコミットしてプッシュ
6. **リトライ**: 新しいビルドを待機して結果を確認
7. **繰り返し**: 成功するまで最大5回リトライ

## 設定

### 環境変数
スクリプト内の設定値を変更して動作をカスタマイズできます：

```bash
# scripts/ci-monitor.sh
REPO_OWNER="UtakataKyosui"
REPO_NAME="ChunkPomodoroExtension"
BRANCH_NAME="build-to-zipfile-release"
MAX_RETRIES=5
```

### 必要な権限
- GitHub CLI (`gh`) がインストールされていること
- リポジトリへの読み取り・書き込み権限
- GitHub Actionsへのアクセス権限

## 例: 実際の使用シナリオ

### シナリオ1: PR作成後の自動監視
```bash
# PRを作成した後、CIを監視開始
npm run ci:monitor

# 出力例:
# 🔍 Starting CI Monitor for UtakataKyosui/ChunkPomodoroExtension...
# 🔄 Attempt 1/5
# ❌ Build failed. Analyzing logs...
# ❌ Found TailwindCSS PostCSS plugin error
# 🔧 Fixing TailwindCSS PostCSS configuration...
# ✅ TailwindCSS PostCSS configuration fixed
# 💾 Committing fixes...
# ✅ Fixes pushed to build-to-zipfile-release
```

### シナリオ2: CI状態の定期確認
```bash
# 30秒間隔でCI状態を監視
npm run ci:watch

# または5分間隔で監視
./scripts/ci-utils.sh watch 300
```

### シナリオ3: エラーログの確認
```bash
# 最新の実行ログを確認
npm run ci:logs

# 特定のRun IDのログを確認
./scripts/ci-utils.sh get_logs 123456789
```

## トラブルシューティング

### よくある問題

1. **GitHub CLI認証エラー**
   ```bash
   gh auth login
   ```

2. **権限不足エラー**
   - リポジトリの`Settings > Actions > General`でワークフロー権限を確認
   - Personal Access Tokenの権限を確認

3. **スクリプト実行権限エラー**
   ```bash
   chmod +x scripts/*.sh
   ```

### デバッグモード

詳細なログを出力するには：
```bash
export DEBUG=1
./scripts/ci-monitor.sh
```

## 拡張

新しいエラーパターンを追加するには、`scripts/ci-monitor.sh`の`analyze_and_fix`関数に条件を追加：

```bash
# 新しいエラーパターンの検出
if echo "$logs" | grep -q "your-error-pattern"; then
    echo -e "${RED}❌ Found your custom error${NC}"
    fix_your_custom_error
    fixes_applied=true
fi
```

対応する修正関数も追加：
```bash
fix_your_custom_error() {
    echo -e "${BLUE}🔧 Fixing your custom error...${NC}"
    # 修正処理
    echo -e "${GREEN}✅ Your custom error fixed${NC}"
}
```