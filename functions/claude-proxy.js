export async function onRequest(context) {
  const { request } = context;

  // CORSヘッダーの設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, anthropic-api-key',
  };

  // OPTIONSリクエスト（プリフライト）の処理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // APIキーの取得
    const apiKey = request.headers.get('anthropic-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // リクエストボディの取得
    const body = await request.json();

    console.log('Sending request to Anthropic API:', {
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2024-02-15'
      },
      body: body
    });

    // Anthropic APIへのリクエスト
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-api-key': apiKey,
        'anthropic-version': '2024-02-15'
      },
      body: JSON.stringify(body)
    });

    // レスポンスの取得
    const data = await response.json();

    // エラーレスポンスの場合
    if (!response.ok) {
      console.error('Anthropic API Error:', data);
      return new Response(JSON.stringify({
        error: {
          message: data.error?.message || 'Unknown error occurred',
          type: data.error?.type || 'unknown',
          status: response.status
        }
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 成功レスポンスの返送
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({
      error: {
        message: error.message,
        type: 'proxy_error'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
} 