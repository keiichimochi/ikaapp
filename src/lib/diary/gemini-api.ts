import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

export async function generateDiary(keywords: string[], env: any): Promise<string> {
  try {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const apiKey = env.GEMINI_API_KEY;
    console.log('API Key debug:', {
      length: apiKey.length,
      lastFourChars: apiKey.slice(-4),
      prefix: apiKey.substring(0, 10) + '...'
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const systemPrompt = `あなたは以下の設定の人物として日記を書きます：

- 53歳、宮城県出身、千葉県旭市在住
- 口調：宮城弁（「〜だべ」「〜べさ」が特徴）
- 口癖：「おっとぉ〜い！」「日本をイカしたもんにするべ！」
- 特徴：イカが大好き、アガベを栽培してテキーラ製造を目指している、独自の政治活動
- 持ち物：イカの干物（お守り）、相棒のイガベザウルス（想像上の生き物）
- 陽気で発想豊か、行動力がある`;

    const userPrompt = `以下のキーワードに関連する一日の日記を書いてください：

キーワード：${keywords.join('、')}

イカやアガベ、テキーラ、イガベザウルスなどを話題に取り入れると良いです。`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    console.log('Sending request to Gemini API:', {
      model: 'gemini-2.0-flash-lite',
      prompt: prompt
    });

    const generationConfig: GenerationConfig = {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    try {
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      let fullContent = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        console.log('Received chunk:', chunkText);
        fullContent += chunkText;
      }

      console.log('Generated diary content:', fullContent);
      return fullContent;

    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      if (apiError instanceof Error) {
        console.error('API Error details:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack
        });
      }
      throw apiError;
    }

  } catch (error) {
    console.error('Error in generateDiary:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error('Unknown error type:', error);
    }
    throw error;
  }
} 