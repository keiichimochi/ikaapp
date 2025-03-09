import { fetchNews } from '../../src/lib/news/brave-api';
import { generateDiary } from '../../src/lib/diary/claude-api';
import { saveDiary, getDiaryWithNews } from '../../src/lib/db/diary';

interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  BRAVE_API_KEY: string;
  CLAUDE_API_KEY: string;
  DB: any;
}

const HELP_MESSAGE = 
  "使い方ナリ：\n" +
  "/diary [キーワード] - キーワードから日記を生成\n" +
  "/subscribe - 毎日の日記配信を開始\n" +
  "/unsubscribe - 日記配信を停止\n" +
  "/help - このヘルプを表示";

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
  
  // 日記生成コマンド
  if (text.startsWith('/diary')) {
    // キーワード抽出
    const keywords = text.replace('/diary', '').trim().split(/\s+/);
    console.log('Keywords:', keywords);  // デバッグログ追加
    
    if (keywords.length > 0 && keywords[0] !== '') {
      try {
        console.log('Generating diary...');  // デバッグログ追加
        // 日記生成
        const diary = await generateDiary(keywords, env);
        
        // LINEで返信
        await replyMessage(event.replyToken, diary, env);
        
        return new Response('OK', { status: 200 });
        
      } catch (error) {
        console.error('Error processing message:', error);
        
        // エラーメッセージを返信
        const errorMessage = '申し訳ありません。日記の生成中にエラーが発生しました。しばらく時間をおいて再度お試しください。';
        await replyMessage(event.replyToken, errorMessage, env);
        
        return new Response('Error occurred', { status: 500 });
      }
    } else {
      await replyMessage(event.replyToken, 
        "キーワードを入力してほしいがやナリ！\n例: /diary 高知 よさこい 祭り", env);
    }
  }
  // 購読コマンド
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
  // 購読解除コマンド
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
  // ヘルプコマンド
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
    
    if (!await validateSignature(body, context.env.LINE_CHANNEL_SECRET, signature)) {
      console.error('Signature validation failed');
      return new Response('Invalid signature', { status: 403 });
    }

    const webhookEvent = JSON.parse(body);
    console.log('Webhook event:', webhookEvent);

    // メッセージイベントの処理
    for (const event of webhookEvent.events) {
      console.log('Processing event:', event);
      await processMessage(event, context.env.DB, context.env);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 