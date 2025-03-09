# KIYOSHI日記ビューア

キーワードからニュースを取得し、Claude APIを使って日記を自動生成するアプリケーションです。

## 機能

- キーワードからニュース記事を取得
- ニュース記事を元に日記を自動生成
- 生成した日記の保存と閲覧
- PWA対応（予定）
- LINE BOT連携（予定）

## 技術スタック

- Next.js
- TypeScript
- Cloudflare Pages
- Cloudflare D1 (SQLite at the edge)
- Brave Search API
- Claude API

## LINE BOT機能

LINE BOTを通じて日記の生成と配信を行うことができます。

### 主な機能

- キーワードから日記を生成
- 毎日のトレンドキーワードから日記を自動生成
- 定期配信機能

### コマンド一覧

| コマンド | 説明 | 例 |
|---------|------|-----|
| `/diary [キーワード]` | キーワードから日記を生成 | `/diary 高知 よさこい 祭り` |
| `/subscribe` | 毎日の日記配信を開始 | `/subscribe` |
| `/unsubscribe` | 日記配信を停止 | `/unsubscribe` |
| `/help` | ヘルプを表示 | `/help` |

## セットアップ

### 環境変数

`.env.sample`をコピーして`.env`を作成し、必要な環境変数を設定してください。

```
BRAVE_API_KEY=your_brave_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_CLIENT_ID=your_cloudflare_client_id
CLOUDFLARE_CLIENT_SECRET=your_cloudflare_client_secret
LINE_CHANNEL_SECRET=da35f6b7dd77d058cd0f8a143409058e
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

### 開発環境の起動

```bash
npm install
npm run dev
```

### デプロイ

```bash
npm run build
npx wrangler pages deploy .next
```

## LINE BOTのセットアップ

1. [LINE Developers](https://developers.line.biz/)でチャネルを作成
2. Webhook URLを設定: `https://line-bot.kiyoshi-diary.pages.dev/`
3. チャネルアクセストークンを取得し、環境変数に設定
4. マイグレーションを実行: `npx wrangler d1 migrations apply DB`

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
