const fs = require('fs');
const path = require('path');
(async ()=>{
  const env = fs.readFileSync(path.join(__dirname,'..','.env'),'utf8');
  const chatLine = env.split(/\r?\n/).find(l=>l.startsWith('TELEGRAM_CHAT_ID='));
  const chatId = chatLine ? chatLine.split('=')[1].trim() : null;
  const body = {
    ticketId: 'TEST123',
    eventTitle: 'Evento de prueba',
    name: 'Usuario Prueba',
    email: 'test@example.com',
    phone: '+51 999 999 999',
    paymentMethod: 'Tarjeta',
    operationNumber: 'OP123'
  };
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  try{
    console.log('Posting notify to /api/telegram/notify with ticketId=', body.ticketId);
    const res = await fetchFn('http://127.0.0.1:3000/api/telegram/notify', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const json = await res.json();
    console.log('Response status', res.status, json);
  }catch(e){
    console.error('Error', e);
    process.exit(1);
  }
})();
