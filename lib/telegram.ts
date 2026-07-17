function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : undefined;

export function normalizeTelegramChatId(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

function requireTelegramToken() {
  if (!TELEGRAM_API_URL) {
    throw new Error('TELEGRAM_BOT_TOKEN no está configurado');
  }
  return { apiUrl: TELEGRAM_API_URL };
}

function requireTelegramChatId() {
  const normalizedChatId = normalizeTelegramChatId(TELEGRAM_CHAT_ID);
  if (normalizedChatId === null || normalizedChatId === undefined || normalizedChatId === '') {
    throw new Error('TELEGRAM_CHAT_ID o TELEGRAM_ADMIN_CHAT_ID no está configurado');
  }
  return normalizedChatId;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  const { apiUrl } = requireTelegramToken();
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${apiUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${response.statusText} ${payload}`);
  }

  return response.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
  const { apiUrl } = requireTelegramToken();

  const response = await fetch(`${apiUrl}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram answerCallbackQuery failed: ${response.status} ${response.statusText} ${payload}`);
  }

  return response.json();
}

export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string
) {
  const { apiUrl } = requireTelegramToken();

  const response = await fetch(`${apiUrl}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram editMessageText failed: ${response.status} ${response.statusText} ${payload}`);
  }

  return response.json();
}

export async function clearTelegramMessageReplyMarkup(chatId: string | number, messageId: number) {
  const { apiUrl } = requireTelegramToken();

  const response = await fetch(`${apiUrl}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] },
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram editMessageReplyMarkup failed: ${response.status} ${response.statusText} ${payload}`);
  }

  return response.json();
}

export function formatTelegramValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return escapeHtml(String(value));
}

export function getTelegramAdminChatIdsFromEnv() {
  const raw = process.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => normalizeTelegramChatId(value.trim()))
    .filter((value): value is string | number => value !== null && value !== undefined && value !== '');
}

export function getTelegramAdminChatId() {
  return requireTelegramChatId();
}

export function getAllowedTelegramAdminIds() {
  const raw = process.env.TELEGRAM_ALLOWED_ADMIN_IDS ?? process.env.TELEGRAM_ADMIN_IDS;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((id) => Number.isInteger(id));
}
