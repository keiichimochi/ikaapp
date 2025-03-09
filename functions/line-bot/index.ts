import { fetchNews } from '../../src/lib/news/brave-api';
import { generateDiary } from '../../src/lib/diary/gemini-api';
import { saveDiary, getDiaryWithNews } from '../../src/lib/db/diary';

interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  BRAVE_API_KEY: string;
  CLAUDE_API_KEY: string;
  DB: any;
}

const HELP_MESSAGE = 
  "おっとぉ〜い！イガベザウルスだべ！\n\n" +
  "普通に話しかけてくれれば、キーワードから日記を書くべさ！\n\n" +
  "コマンドも使えるナリ：\n" +
  "/diary [キーワード] - キーワードから日記を生成\n" +
  "/subscribe - 毎日の日記配信を開始\n" +
  "/unsubscribe - 日記配信を停止\n" +
  "/help - このヘルプを表示\n\n" +
  "例えば「高知のかつお」って話しかけてみるべさ！";

// 署名検証関数
async function validateSignature(body: string, channelSecret: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const bodyData = encoder.encode(body);
  const signatureData = await crypto.subtle.sign('HMAC', key, bodyData);
  const calculatedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureData)));
  
  return calculatedSignature === signature;
}

// LINE Messaging APIへのメッセージ送信
async function replyMessage(replyToken: string, message: string, env: Env): Promise<boolean> {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('LINE API Error:', errorBody);
  }
  
  return response.ok;
}

interface LineEvent {
  type: string;
  message?: {
    type: string;
    text: string;
  };
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
}

interface LineWebhookRequest {
  events: LineEvent[];
}

// ユーザー情報をデータベースに保存
async function saveUser(db: any, lineId: string) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.prepare(
    'INSERT INTO line_users (id, line_id, subscribe, delivery_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, lineId, true, '08:00', now, now).run();
  
  return id;
}

// ユーザー情報を削除（購読解除）
async function removeUser(db: any, lineId: string) {
  await db.prepare(
    'UPDATE line_users SET subscribe = false, updated_at = ? WHERE line_id = ?'
  ).bind(new Date().toISOString(), lineId).run();
}

// メッセージ処理
async function processMessage(event: LineEvent, db: any, env: Env) {
  if (!event.message || event.message.type !== 'text') return;
  
  const text = event.message.text;
  console.log('Processing text:', text);  // デバッグログ追加
  
  // コマンド処理
  if (text.startsWith('/')) {
    await handleCommands(event, db, env);
    return;
  }

  // 通常のチャット処理
  try {
    console.log('Generating response...');
    const keywords = text.split(/[、,\s]+/).filter(Boolean);
    const diary = await generateDiary(keywords, env);
    await replyMessage(event.replyToken, diary, env);
  } catch (error) {
    console.error('Error processing message:', error);
    await replyMessage(event.replyToken, 
      'ごめんなさいだべ。ちょっと考えがまとまらなかったべ。もう一度話しかけてほしいがやナリ！', env);
  }
}

// コマンド処理
async function handleCommands(event: LineEvent, db: any, env: Env) {
  const text = event.message!.text;
  
  if (text.startsWith('/diary')) {
    const keywords = text.slice('/diary'.length).trim().split(/[、,\s]+/).filter(Boolean);
    if (keywords.length === 0) {
      await replyMessage(event.replyToken, 
        "キーワードを入力してほしいがやナリ！\n例: 高知 よさこい 祭り", env);
      return;
    }

    try {
      const diary = await generateDiary(keywords, env);
      await replyMessage(event.replyToken, diary, env);
    } catch (error) {
      console.error('Error generating diary:', error);
      await replyMessage(event.replyToken, 
        '日記の生成に失敗したがやナリ。もう一度試してほしいがやナリ！', env);
    }
  }
  else if (text === '/subscribe') {
    try {
      await saveUser(db, event.source.userId);
      await replyMessage(event.replyToken, 
        "毎日の日記配信を開始するがやナリ！", env);
    } catch (error) {
      console.error('Error subscribing user:', error);
      await replyMessage(event.replyToken, 
        "購読設定に失敗したがやナリ。もう一度試してほしいがやナリ！", env);
    }
  }
  else if (text === '/unsubscribe') {
    try {
      await removeUser(db, event.source.userId);
      await replyMessage(event.replyToken, 
        "日記配信を停止したがやナリ！", env);
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      await replyMessage(event.replyToken, 
        "購読解除に失敗したがやナリ。もう一度試してほしいがやナリ！", env);
    }
  }
  else if (text === '/help') {
    await replyMessage(event.replyToken, HELP_MESSAGE, env);
  }
}

// Webhookエンドポイント
export async function onRequest(context: { request: Request, env: Env }): Promise<Response> {
  try {
    // デバッグログを追加
    console.log('Webhook received:', {
      headers: Object.fromEntries(context.request.headers.entries()),
      url: context.request.url,
      method: context.request.method
    });

    // POSTリクエストのみを受け付ける
    if (context.request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = context.request.headers.get('x-line-signature');
    const body = await context.request.text();
    
    // リクエストボディのログ
    console.log('Request body:', body);
    
    // 署名検証をスキップ（一時的に）
    // if (!await validateSignature(body, context.env.LINE_CHANNEL_SECRET, signature)) {
    //   console.error('Signature validation failed');
    //   return new Response('Invalid signature', { status: 403 });
    // }

    const webhookEvent = JSON.parse(body);
    console.log('Webhook event:', webhookEvent);

    // メッセージイベントの処理
    if (webhookEvent.events && Array.isArray(webhookEvent.events)) {
      for (const event of webhookEvent.events) {
        console.log('Processing event:', event);
        await processMessage(event, context.env.DB, context.env);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 