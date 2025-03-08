import Anthropic from '@anthropic-ai/sdk';
import { NewsArticle } from '../news/brave-api';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateDiary(news: NewsArticle[]): Promise<string> {
  const newsContext = news.map(article => 
    `タイトル: ${article.title}\n説明: ${article.description}\n出典: ${article.source}\n`
  ).join('\n');

  const prompt = `以下のニュース記事を元に、kiyoshiという人物の視点から架空の面白おかしい日記を書いてください。

kiyoshiのキャラクター設定:
- 53歳、宮城県出身、千葉県旭市在住
- 口調：宮城弁（「〜だべ」「〜べさ」が特徴）
- 口癖：「おっとぉ〜い！」「日本をイカしたもんにするべ！」
- 特徴：イカが大好き、アガベを栽培してテキーラ製造を目指している、独自の政治活動
- 持ち物：イカの干物（お守り）、相棒のイガベザウルス（想像上の生き物）
- 陽気で発想豊か、行動力がある

実際にニュースの出来事を体験したかのように、創造的に脚色して書いてください。イカやアガベ、テキーラ、イガベザウルスなどを話題に取り入れるとよりキャラクターらしくなります。

ニュース記事:
${newsContext}

日付: ${new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  if (message.content[0].type === 'text') {
    return message.content[0].text;
  }
  
  throw new Error('Unexpected response from Claude API');
}

export interface GeneratedDiary {
  date: string;
  content: string;
  newsReferences: NewsArticle[];
} 