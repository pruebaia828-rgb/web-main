import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendTelegramMessage, getTelegramAdminChatId, getTelegramAdminChatIdsFromEnv, formatTelegramValue } from '@/lib/telegram';

async function getTelegramNotificationChatIds() {
  const chatIds = new Set<string | number>();

  for (const chatId of getTelegramAdminChatIdsFromEnv()) {
    chatIds.add(chatId);
  }

  const { data, error } = await supabaseAdmin.from('telegram_admins').select('telegram_id');
  if (!error && data) {
    for (const row of data) {
      if (row?.telegram_id != null) {
        chatIds.add(Number(row.telegram_id));
      }
    }
  }

  return Array.from(chatIds);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticketId,
      eventTitle,
      name,
      email,
      phone,
      paymentMethod,
      operationNumber,
    } = body as Record<string, unknown>;

    const normalizedTicketId = typeof ticketId === 'string' ? ticketId : ticketId != null ? String(ticketId) : '';

    if (!normalizedTicketId || !eventTitle || !name || !email || !paymentMethod) {
      return NextResponse.json({ error: 'Faltan datos del ticket para enviar la notificación de Telegram.' }, { status: 400 });
    }

    const chatIds = await getTelegramNotificationChatIds();
    const fallbackChatId = chatIds.length > 0 ? null : getTelegramAdminChatId();
    const notificationChatIds = chatIds.length > 0 ? chatIds : [fallbackChatId].filter((value): value is string | number => value !== null);

    const message = [
      '<b>Nuevo ticket pendiente</b>',
      `Evento: ${formatTelegramValue(eventTitle)}`,
      `Nombre: ${formatTelegramValue(name)}`,
      `Email: ${formatTelegramValue(email)}`,
      `Teléfono: ${formatTelegramValue(phone)}`,
      `Pago: ${formatTelegramValue(paymentMethod)}`,
      operationNumber ? `Operación: ${formatTelegramValue(operationNumber)}` : null,
      `ID: <code>${formatTelegramValue(normalizedTicketId)}</code>`,
      '',
      '<i>Aprueba o no apruebes este ticket desde los botones abajo.</i>',
    ]
      .filter(Boolean)
      .join('\n');

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: 'Aprobar ✅', callback_data: `approve:${normalizedTicketId}` },
          { text: 'No aprobar ❌', callback_data: `reject:${normalizedTicketId}` },
        ],
      ],
    };

    for (const chatId of notificationChatIds) {
      try {
        await sendTelegramMessage(chatId, message, replyMarkup);
      } catch (error) {
        console.error('Telegram notification failed for chat', chatId, error);
      }
    }

    return NextResponse.json({ ok: true, sentTo: notificationChatIds.length });
  } catch (error) {
    console.error('Telegram notify error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
