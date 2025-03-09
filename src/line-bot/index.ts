import { Client, WebhookEvent } from '@line/bot-sdk';
import { generateDiary } from '../lib/diary/gemini-api';

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // URLのパスを取得
    const url = new URL(request.url);
    const path = url.pathname;

    console.log('Request received:', {
      path: path,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // /api/line-webhook エンドポイントまたはルートパスの処理
    if (path === '/api/line-webhook' || path === '/') {
      console.log('Webhook received:', {
        headers: Object.fromEntries(request.headers.entries()),
        url: request.url,
        method: request.method,
      });

      // リクエストボディを取得
      const body = await request.text();
      console.log('Request body:', body);

      try {
        // JSONをパース
        const webhookEvent = JSON.parse(body);
        console.log('Webhook event:', webhookEvent);

        // イベントを処理
        if (webhookEvent.events && Array.isArray(webhookEvent.events)) {
          for (const event of webhookEvent.events) {
            console.log('Processing event:', event);
            await handleEvent(event, env);
          }
        } else {
          console.log('No events found in webhook payload');
        }

        return new Response('OK', { status: 200 });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
      }
    }

    // その他のパスは404を返す
    return new Response('Not Found', { status: 404 });
  },
};

async function handleEvent(event: WebhookEvent, env: Env) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  console.log('Processing text:', event.message.text);

  // /diaryコマンドの処理
  if (event.message.text.startsWith('/diary')) {
    const keywords = event.message.text
      .slice('/diary'.length)
      .trim()
      .split(/[、,\s]+/)
      .filter(Boolean);

    console.log('Keywords:', keywords);

    if (keywords.length === 0) {
      await replyMessage(event.replyToken, 'キーワードを指定してください。例: /diary 高知 かつお', env);
      return;
    }

    console.log('Generating diary...');
    try {
      const diary = await generateDiary(keywords, env);
      await replyMessage(event.replyToken, diary, env);
    } catch (error) {
      console.error('Error generating diary:', error);
      await replyMessage(event.replyToken, '日記の生成に失敗しました。', env);
    }
    return;
  }
}

async function replyMessage(replyToken: string, text: string, env: Env) {
  const client = new Client({
    channelSecret: env.LINE_CHANNEL_SECRET,
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  await client.replyMessage(replyToken, {
    type: 'text',
    text: text,
  });
} 