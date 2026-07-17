const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
(async ()=>{
  const env = fs.readFileSync(path.join(__dirname,'..','.env'),'utf8');
  const get = (k)=>{
    const m = env.split(/\r?\n/).find(l=>l.startsWith(k+'='));
    return m ? m.split('=')[1].trim() : undefined;
  }
  const url = get('SUPABASE_URL');
  const key = get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key){ console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1);} 
  const supabase = createClient(url, key);
  const ticket = {
    event_id: 1,
    name: 'Usuario Prueba',
    email: 'test@example.com',
    phone: '+51 999 999 999',
    status: 'pending'
  };
  try{
    const { data, error } = await supabase.from('tickets').insert(ticket).select('id').single();
    if(error) { console.error('Supabase error', error); process.exit(1);} 
    console.log('Inserted ticket id', data.id);
    const outPath = path.join(__dirname, 'last_ticket_id.txt');
    fs.writeFileSync(outPath, String(data.id), 'utf8');
    console.log('Saved id to', outPath);
  }catch(e){
    console.error('Exception', e);
    process.exit(1);
  }
  process.exit(0);
})();
