import { fetchNews } from '../../src/lib/news/brave-api';
import { generateDiary } from '../../src/lib/diary/claude-api';
import { saveDiary } from '../../src/lib/db/diary';

interface LineUser {
  id: string;
  line_id: string;
  subscribe: boolean;
  delivery_time: string;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

// トレンドキーワードを取得（実際にはBrave APIなどから取得する）
async function getTrendingKeywords(): Promise<string[]> {
  // 実際の実装では、トレンドAPIなどから取得する
  // 現在はダミーデータを返す
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // 曜日ごとに異なるキーワードを返す
  const keywordsByDay = [
    ['日本', '週末', 'イベント'],  // 日曜日
    ['経済', '株価', 'ビジネス'],  // 月曜日
    ['テクノロジー', 'AI', '科学'], // 火曜日
    ['エンタメ', '映画', '音楽'],  // 水曜日
    ['健康', 'スポーツ', '食事'],  // 木曜日
    ['政治', '国際', '社会'],      // 金曜日
    ['旅行', 'レジャー', '文化']   // 土曜日
  ];
  
  return keywordsByDay[dayOfWeek];
}

// LINEにプッシュメッセージを送信
async function pushMessageToLine(lineId: string, message: string) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: lineId,
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

// 購読ユーザーを取得
async function getSubscribedUsers(db: any, currentHour: string): Promise<LineUser[]> {
  const result = await db.prepare(
    'SELECT * FROM line_users WHERE subscribe = true AND delivery_time LIKE ?'
  ).bind(`${currentHour}:%`).all();
  
  return result.results as LineUser[];
}

// 定期実行関数
export async function scheduled(event: any, env: any, ctx: any) {
  // 現在の時刻を取得（UTC）
  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, '0');
  
  try {
    // 現在の時刻に配信設定しているユーザーを取得
    const users = await getSubscribedUsers(env.DB, currentHour);
    
    if (users.length === 0) {
      console.log(`No users scheduled for delivery at ${currentHour}:00 UTC`);
      return;
    }
    
    // トレンドキーワードを取得
    const keywords = await getTrendingKeywords();
    
    // ニュースを取得
    const news = await fetchNews(keywords);
    
    if (news.length === 0) {
      console.log('No news found for trending keywords');
      return;
    }
    
    // 日記を生成
    const content = await generateDiary(news);
    
    // データベースに保存
    const diary = await saveDiary(env.DB, content, news);
    
    // 各ユーザーに配信
    const message = `今日のトレンドキーワード「${keywords.join('、')}」から日記を生成したがやナリ！\n\n${content}`;
    
    for (const user of users) {
      try {
        await pushMessageToLine(user.line_id, message);
        console.log(`Successfully delivered diary to user ${user.line_id}`);
      } catch (error) {
        console.error(`Failed to deliver diary to user ${user.line_id}:`, error);
      }
    }
    
    console.log(`Daily diary delivery completed for ${users.length} users`);
  } catch (error) {
    console.error('Error in scheduled diary delivery:', error);
  }
} 