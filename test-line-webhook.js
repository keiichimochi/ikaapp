// LINE Webhookテスト用スクリプト
const http = require('http');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 環境変数の読み込み
require('dotenv').config();

// テスト用のLINE Webhookイベント
const createWebhookEvent = (text) => {
  const timestamp = Date.now();
  return {
    destination: 'U30dd3dc564d4d35a256938c581330b98',
    events: [
      {
        type: 'message',
        message: {
          type: 'text',
          id: '12345678901234',
          quoteToken: 'ePDILpcDuZy_ZgZe8ZltIke4MVs738Ds1alzwwLTrvu8',
          text: text
        },
        webhookEventId: '01JNTEB2GVN7G1D53XBSSWGA5S',
        deliveryContext: {
          isRedelivery: false
        },
        timestamp: timestamp,
        source: {
          type: 'user',
          userId: 'U03bad4c3f5635f723a9e04e00e0d775a'
        },
        replyToken: '6cfc1bf5e7624bd5bc3552af04ba8d30',
        mode: 'active'
      }
    ]
  };
};

// 署名の生成
const generateSignature = (body, channelSecret) => {
  const signature = crypto
    .createHmac('SHA256', channelSecret)
    .update(Buffer.from(JSON.stringify(body)))
    .digest('base64');
  return signature;
};

// ローカルでwranglerを起動
const startLocalWorker = async () => {
  console.log('🚀 ローカルでwranglerを起動するナリ...');
  
  // spawnを使用してプロセスを起動（execよりも制御しやすい）
  const wranglerProcess = spawn('npx', ['wrangler', 'dev', 'src/line-bot/index.ts', '--local', '--port', '8787'], {
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  let isReady = false;
  
  // 標準出力と標準エラー出力を表示
  wranglerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`wrangler stdout: ${output}`);
    
    // wranglerが起動完了したかチェック
    if (output.includes('Listening at http://localhost:8787')) {
      isReady = true;
    }
  });
  
  wranglerProcess.stderr.on('data', (data) => {
    console.error(`wrangler stderr: ${data.toString()}`);
  });
  
  // プロセスが終了したときの処理
  wranglerProcess.on('close', (code) => {
    console.log(`wranglerプロセスが終了したナリ。終了コード: ${code}`);
  });
  
  // wranglerが起動するのを待つ（最大30秒）
  console.log('⏳ wranglerの起動を待っているナリ...');
  for (let i = 0; i < 30; i++) {
    if (isReady) {
      console.log('✅ wranglerが起動完了したナリ！');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (i % 5 === 0) {
      console.log(`⏳ まだwranglerの起動を待っているナリ... (${i}秒経過)`);
    }
  }
  
  if (!isReady) {
    console.log('⚠️ wranglerの起動タイムアウトナリ。それでもリクエストを送信するナリ...');
  }
  
  return wranglerProcess;
};

// Webhookリクエストを送信
const sendWebhookRequest = async (text) => {
  try {
    const webhookEvent = createWebhookEvent(text);
    const body = JSON.stringify(webhookEvent);
    
    // 署名の生成
    const signature = generateSignature(webhookEvent, process.env.LINE_CHANNEL_SECRET || 'dummy-secret');
    
    // POSTリクエストのオプション
    const options = {
      hostname: 'localhost',
      port: 8787,
      path: '/api/line-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': signature,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    console.log('📤 リクエスト送信先:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('📤 リクエストボディ:', body);
    
    // リクエストの送信
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`ステータスコード: ${res.statusCode}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('レスポンス:', responseData);
          resolve(responseData);
        });
      });
      
      req.on('error', (error) => {
        console.error('リクエストエラー:', error);
        reject(error);
      });
      
      // リクエストボディの送信
      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error('エラー発生:', error);
    throw error;
  }
};

// メイン処理
const main = async () => {
  try {
    // コマンドライン引数からテキストを取得
    const text = process.argv[2] || '/diary 高知かつお';
    
    console.log(`📝 テスト用テキスト: "${text}"`);
    
    // ローカルでwranglerを起動
    const wranglerProcess = await startLocalWorker();
    
    // wranglerが起動するのを待つ
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🔍 Webhookリクエストを送信するナリ...');
    try {
      await sendWebhookRequest(text);
    } catch (error) {
      console.error('リクエスト送信中にエラーが発生したナリ:', error);
    }
    
    // 30秒後にプロセスを終了
    console.log('⏳ 30秒後にプロセスを終了するナリ...');
    setTimeout(() => {
      console.log('🛑 テスト終了、wranglerを停止するナリ...');
      wranglerProcess.kill();
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生したナリ:', error);
    process.exit(1);
  }
};

// スクリプトの実行
main(); 