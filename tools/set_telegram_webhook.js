const fs = require('fs');
const path = require('path');

async function main(){
  const envPath = path.join(__dirname, '..', '.env');
  if(!fs.existsSync(envPath)){
    console.error('.env not found');
    process.exit(1);
  }
  const env = fs.readFileSync(envPath, 'utf8');
  const tokenLine = env.split(/\r?\n/).find(l => l.startsWith('TELEGRAM_BOT_TOKEN='));
  if(!tokenLine){
    console.error('TELEGRAM_BOT_TOKEN not found in .env');
    process.exit(1);
  }
  const token = tokenLine.split('=')[1].trim();
  const webhookLine = env.split(/\r?\n/).find(l => l.startsWith('TELEGRAM_WEBHOOK_URL='));
  const webhookUrl = webhookLine
    ? webhookLine.split('=')[1].trim()
    : 'https://knee-mutable-shorthand.ngrok-free.dev/api/telegram/webhook';

  const fetchFn = global.fetch || (await import('node-fetch')).default;

  try{
    console.log('Setting webhook to', webhookUrl);
    const setRes = await fetchFn(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const setJson = await setRes.json();
    console.log('setWebhook response:', setJson);

    const infoRes = await fetchFn(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const infoJson = await infoRes.json();
    console.log('getWebhookInfo response:', infoJson);
  }catch(err){
    console.error('Error calling Telegram API', err);
    process.exit(1);
  }
}

main();
