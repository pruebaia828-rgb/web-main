const fs = require('fs');
const path = require('path');
(async ()=>{
  const envPath = path.join(__dirname,'..','.env');
  let port = 3000;
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath,'utf8');
    const m = env.split(/\r?\n/).find(l=>l.startsWith('PORT='));
    if (m) port = Number(m.split('=')[1].trim()) || 3000;
  }
  const fetchFn = global.fetch || (await import('node-fetch')).default;
  const url = `http://127.0.0.1:${port}/api/tickets`;
  const body = {
    event_id: 1,
    name: 'Prueba Rapida',
    email: 'prueba@example.com',
    phone: '+51999999999',
    payment_method: 'Efectivo',
    operation_number: null
  };
  try{
    console.log('POST', url, 'body=', body);
    const res = await fetchFn(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const text = await res.text();
    console.log('Status', res.status, 'Response:', text);
  }catch(e){
    console.error('Request failed', e.message || e);
    process.exit(1);
  }
})();
