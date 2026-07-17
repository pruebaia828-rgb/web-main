const fs = require('fs');
const path = require('path');
(async ()=>{
  const env = fs.readFileSync(path.join(__dirname,'..','.env'),'utf8');
  const chatLine = env.split(/\r?\n/).find(l=>l.startsWith('TELEGRAM_CHAT_ID='));
  const chatId = chatLine ? chatLine.split('=')[1].trim() : null;
  let ticketId = '1';
  const lastPath = path.join(__dirname, 'last_ticket_id.txt');
  if (fs.existsSync(lastPath)) {
    ticketId = fs.readFileSync(lastPath,'utf8').trim();
    console.log('Using ticket id from', lastPath, ticketId);
  } else {
    console.log('No last_ticket_id.txt found, using default ticket id 1');
  }

  const payload = {
    callback_query: {
      id: 'test-cb-1',
      from: { id: Number(chatId), first_name: 'AdminTest' },
      data: `approve:${ticketId}`,
      message: {
        message_id: 9999,
        chat: { id: Number(chatId) }
      }
    }
  };
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  try{
    console.log('Posting callback to /api/telegram/webhook with data=', payload.callback_query.data);
    const res = await fetchFn('http://127.0.0.1:3000/api/telegram/webhook', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log('Response status', res.status, text);
  }catch(e){
    console.error('Error', e);
    process.exit(1);
  }
})();
