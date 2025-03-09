export async function testWebhook(replyToken: string) {
  try {
    const response = await replyMessage(replyToken, 'テストメッセージナリ！');
    console.log('Test message sent:', response);
    return response;
  } catch (error) {
    console.error('Test message failed:', error);
    throw error;
  }
} 