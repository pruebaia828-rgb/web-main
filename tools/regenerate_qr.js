// Regenerate QR data URLs for approved tickets lacking valid QR images
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

(async () => {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id,status,qr_code')
    .eq('status','approved')
    .limit(1000);

  if (error) { console.error(error); process.exit(1); }

  const toUpdate = tickets.filter(t => !(t.qr_code && typeof t.qr_code === 'string' && t.qr_code.startsWith('data:image')));
  console.log('Tickets needing QR regeneration:', toUpdate.length);

  for (const t of toUpdate) {
    try {
      const payload = t.id;
      const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
      const { error: upErr } = await supabase
        .from('tickets')
        .update({ qr_code: dataUrl })
        .eq('id', t.id);
      if (upErr) console.error('Update error', t.id, upErr);
      else console.log('Updated QR for', t.id);
    } catch (e) {
      console.error('QR gen error', t.id, e);
    }
  }
  console.log('Done');
})();
