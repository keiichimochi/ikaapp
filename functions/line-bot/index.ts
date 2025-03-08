import { fetchNews } from '../../src/lib/news/brave-api';
import { generateDiary } from '../../src/lib/diary/claude-api';
import { saveDiary, getDiaryWithNews } from '../../src/lib/db/diary';

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

// LINE Messaging APIへの返信
async function replyToLine(replyToken: string, message: string) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
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
  
  return response.ok;
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
async function processMessage(event: LineEvent, db: any) {
  if (!event.message || event.message.type !== 'text') return;
  
  const text = event.message.text;
  
  // 日記生成コマンド
  if (text.startsWith('/diary')) {
    // キーワード抽出
    const keywords = text.replace('/diary', '').trim().split(/\s+/);
    
    if (keywords.length > 0 && keywords[0] !== '') {
      try {
        // 日記生成
        const news = await fetchNews(keywords);
        
        if (news.length === 0) {
          await replyToLine(event.replyToken, 
            "キーワードに関連するニュースが見つからなかったがやナリ！別のキーワードを試してほしいがやナリ！");
          return;
        }
        
        const content = await generateDiary(news);
        
        // データベースに保存
        const diary = await saveDiary(db, content, news);
        
        // LINEに返信
        await replyToLine(event.replyToken, 
          `今日の日記ができたがやナリ！\n\n${content}\n\n(キーワード: ${keywords.join(', ')})`);
      } catch (error) {
        console.error('Error generating diary:', error);
        await replyToLine(event.replyToken, 
          `エラーが発生したがやナリ: ${error instanceof Error ? error.message : '不明なエラー'}`);
      }
    } else {
      await replyToLine(event.replyToken, 
        "キーワードを入力してほしいがやナリ！\n例: /diary 高知 よさこい 祭り");
    }
  }
  // 購読コマンド
  else if (text === '/subscribe') {
    try {
      await saveUser(db, event.source.userId);
      await replyToLine(event.replyToken, 
        "毎日の日記配信を開始するがやナリ！");
    } catch (error) {
      console.error('Error subscribing user:', error);
      await replyToLine(event.replyToken, 
        "購読設定に失敗したがやナリ。もう一度試してほしいがやナリ！");
    }
  }
  // 購読解除コマンド
  else if (text === '/unsubscribe') {
    try {
      await removeUser(db, event.source.userId);
      await replyToLine(event.replyToken, 
        "日記配信を停止したがやナリ！");
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      await replyToLine(event.replyToken, 
        "購読解除に失敗したがやナリ。もう一度試してほしいがやナリ！");
    }
  }
  // ヘルプコマンド
  else if (text === '/help') {
    await replyToLine(event.replyToken, 
      "使い方ナリ：\n" +
      "/diary [キーワード] - キーワードから日記を生成\n" +
      "/subscribe - 毎日の日記配信を開始\n" +
      "/unsubscribe - 日記配信を停止\n" +
      "/help - このヘルプを表示");
  }
}

// Webhookエンドポイント
export async function onRequest(context: any) {
  const request = context.request;
  
  // LINE Webhookの検証
  if (request.method === 'GET') {
    return new Response('OK');
  }
  
  // POSTリクエスト処理
  try {
    const body = await request.json() as LineWebhookRequest;
    const events = body.events;
    
    for (const event of events) {
      // メッセージイベント処理
      if (event.type === 'message') {
        await processMessage(event, context.env.DB);
      }
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error', { status: 500 });
  }
} 