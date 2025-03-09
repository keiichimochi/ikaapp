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

    const systemPrompt = `宮城弁（〜だべ、〜べさ）を使う53歳の人物として、イカ、アガベ、テキーラ、イガベザウルスなどを話題に入れた短い日記を書いてください。口癖は「おっとぉ〜い！」です。`;

    const userPrompt = `キーワード：${keywords.join('、')}に関連する内容で書いてください。200文字程度でお願いします。`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    console.log('Sending request to Gemini API:', {
      model: 'gemini-2.0-flash-lite',
      prompt: prompt
    });

    const generationConfig: GenerationConfig = {
      temperature: 1.0,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 1024,
    };

    try {
      // タイムアウトを設定
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const resultPromise = model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const result = await Promise.race([resultPromise, timeoutPromise]);
      // @ts-ignore
      const response = result.response;
      const text = response.text();
      console.log('Generated diary content:', text);
      return text;

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