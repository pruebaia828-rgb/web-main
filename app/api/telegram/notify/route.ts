import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, getTelegramAdminChatId, formatTelegramValue } from '@/lib/telegram';

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

    const chatId = getTelegramAdminChatId();
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

    await sendTelegramMessage(chatId, message, replyMarkup);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram notify error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
