# IKA APP 仕様書

## 1. アプリケーション概要

### 1.1 プロジェクト名
- 名称：IKA APP
- 種類：PWA (Progressive Web Application)

### 1.2 目的
KIYOSHIキャラクターの世界観を楽しめるモバイルアプリケーションを提供する。特にKIYOSHIの日記を閲覧できる機能を中心に、ユーザーがKIYOSHIの独特な視点を体験できるプラットフォームを構築する。

### 1.3 ターゲットプラットフォーム
- iOS (Safari経由でインストール可能)
- Android (Chrome経由でインストール可能)
- デスクトップブラウザ（PWA対応ブラウザ）

## 2. 技術スタック

### 2.1 フロントエンド
- フレームワーク：Next.js (React)
- UI/CSSフレームワーク：Tailwind CSS
- PWA対応：next-pwa パッケージ
- アニメーション：Framer Motion
- アイコン：Heroicons

### 2.2 バックエンド
- サーバーレス実行環境：Cloudflare Workers
- データベース：Cloudflare D1 (SQLite at the edge)
- キャッシュ/補助ストレージ：Cloudflare KV
- 画像・メディア保存：Cloudflare R2

### 2.3 デプロイメント
- ホスティング：Cloudflare Pages
- CI/CD：GitHub Actions

## 3. 機能要件

### 3.1 コア機能：KIYOSHIの日記ビューア
- 日付別に日記エントリーを表示
- カレンダーインターフェースで過去の日記をブラウズ
- 日記エントリーには以下の情報を含む：
  - 日付
  - 天気
  - 本文
  - 関連キーワード（タグ）
  - 画像（オプション）
- KIYOSHIの特徴的な宮城弁話法の表現
- テキーラとイカに関する話題をハイライト表示

### 3.2 追加機能
- **宮城弁翻訳機能**：標準語⇔宮城弁の切り替え
- **検索機能**：キーワードによる日記検索
- **オフライン閲覧**：インターネット接続なしでも最近の日記を閲覧可能
- **シェア機能**：SNSや他のアプリへ日記内容を共有
- **通知機能**：新しい日記が公開された際に通知

### 3.3 UI/UX要件
- **テーマ**：イカとアガベをモチーフにしたデザイン
- **カラースキーム**：海をイメージしたブルー系と、アガベの緑色をアクセントに
- **フォント**：可読性の高い日本語フォント
- **アニメーション**：ページ遷移とイカのモチーフを取り入れたインタラクション
- **応答性**：様々な画面サイズに対応するレスポンシブデザイン

## 4. データモデル

### 4.1 日記エントリー
```
{
  id: string,          // 一意のID
  date: string,        // YYYY-MM-DD形式
  weather: string,     // 天気情報
  content: string,     // 日記本文（マークダウン形式）
  tags: string[],      // 関連キーワード
  images: string[],    // 画像のURL（オプション）
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4.2 タグ（キーワード）
```
{
  id: string,
  name: string,        // タグ名
  count: number        // 使用回数
}
```

## 5. API仕様

### 5.1 バックエンドAPI（Cloudflare Workers）
- GET /api/diary - 日記のリストを取得
- GET /api/diary/:id - 特定の日記エントリーを取得
- GET /api/diary/date/:date - 特定の日付の日記を取得
- GET /api/tags - すべてのタグを取得
- GET /api/search?q=:query - キーワードで日記を検索

### 5.2 データ更新API（管理者用）
- POST /api/admin/diary - 新しい日記エントリーを作成
- PUT /api/admin/diary/:id - 既存の日記エントリーを更新
- DELETE /api/admin/diary/:id - 日記エントリーを削除

## 6. PWA要件

### 6.1 インストール要件
- **マニフェストファイル**：アプリ名、アイコン、テーマカラーなどを定義
- **サービスワーカー**：オフライン機能とバックグラウンド同期のため
- **インストールプロンプト**：ユーザーがアプリをデバイスにインストールするためのガイド

### 6.2 オフライン対応
- 最近の日記エントリーをローカルストレージにキャッシュ
- オフライン時には、キャッシュされたコンテンツを表示
- オンラインに戻った際に自動的にコンテンツを更新

## 7. セキュリティ要件
- HTTPS通信の強制
- API呼び出しの適切な認証（JWT、APIキーなど）
- コンテンツ更新APIへの管理者認証
- XSS、CSRFなどの一般的な脆弱性に対する対策

## 8. 開発・展開計画

### 8.1 フェーズ1：基本機能実装
- プロジェクト設定とスケルトン構築
- 日記ビューアの基本UI実装
- Cloudflare Workersによるバックエンド構築
- D1データベースのセットアップと初期データ投入

### 8.2 フェーズ2：PWA化とUX改善
- PWA機能の実装（マニフェスト、サービスワーカー）
- オフライン機能の追加
- UIアニメーションの改善
- 検索機能とタグブラウズの実装

### 8.3 フェーズ3：追加機能と最適化
- 宮城弁翻訳機能の実装
- シェア機能の追加
- パフォーマンス最適化
- ユーザーフィードバックに基づく改善

## 9. 将来的な拡張計画
- イカダンス・チュートリアル機能
- アガベ成長シミュレーター
- KIYOSHI政策提言ジェネレーター
- AR機能「イガベザウルスを探せ！」
- KIYOSHIクエスト・ミニゲーム

## 10. リソース要件
- Next.jsとReactに精通した開発者
- Cloudflare Workersの経験を持つバックエンド開発者
- UIデザイナー（KIYOSHIの世界観を理解していることが望ましい）
- イラストレーター（アプリアイコンやUI要素）
- 日記コンテンツライター（宮城弁に精通していることが理想的）

---

本仕様書は初期バージョンであり、開発プロセスの過程で更新される可能性があります。特に、ユーザーフィードバックや技術的な制約に応じて機能の優先順位が変更される可能性があります。
