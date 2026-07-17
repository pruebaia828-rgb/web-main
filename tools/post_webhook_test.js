(async () => {
  const url = 'https://knee-mutable-shorthand.ngrok-free.dev/api/telegram/webhook';
  const payload = {
    message: {
      message_id: 1,
      from: { id: 8656334687, first_name: 'Test' },
      chat: { id: 8656334687 },
      text: '/start'
    }
  };

  const fetchFn = global.fetch || (await import('node-fetch')).default;

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('HEADERS', JSON.stringify(Object.fromEntries(res.headers.entries())));
    console.log('BODY', text);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
