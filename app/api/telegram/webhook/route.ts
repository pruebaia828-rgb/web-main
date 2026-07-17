import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  answerCallbackQuery,
  clearTelegramMessageReplyMarkup,
  editTelegramMessageText,
  formatTelegramValue,
  getAllowedTelegramAdminIds,
  sendTelegramMessage,
} from '@/lib/telegram';
import QRCode from 'qrcode';

function parseTicketId(raw: string | undefined | null): string | null {
  const trimmed = raw?.toString().trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

async function isTelegramAdmin(userId: number) {
  const allowedIds = getAllowedTelegramAdminIds();
  if (allowedIds.includes(userId)) {
    return true;
  }

  const { data, error } = await supabaseAdmin
    .from('telegram_admins')
    .select('telegram_id')
    .eq('telegram_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking telegram admin', error);
    return false;
  }

  return !!data;
}

async function safeAnswerCallback(callbackId: string, text: string, showAlert = false) {
  try {
    await answerCallbackQuery(callbackId, text, showAlert);
  } catch (err) {
    console.error('safeAnswerCallback failed', err);
  }
}

async function safeEditTelegramMessageText(chatId: number | string, messageId: number, text: string) {
  try {
    await editTelegramMessageText(chatId, messageId, text);
  } catch (err) {
    console.error('safeEditTelegramMessageText failed', err);
  }
}

async function safeClearTelegramMessageReplyMarkup(chatId: number | string, messageId: number) {
  try {
    await clearTelegramMessageReplyMarkup(chatId, messageId);
  } catch (err) {
    console.error('safeClearTelegramMessageReplyMarkup failed', err);
  }
}

async function listTelegramAdmins() {
  const { data, error } = await supabaseAdmin
    .from('telegram_admins')
    .select('telegram_id, full_name')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error listing telegram admins', error);
    return [];
  }

  return data || [];
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return NextResponse.json({ ok: true, message: 'Telegram webhook is live' });
  }

  return NextResponse.json({ ok: true, message: 'Telegram webhook is live' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Telegram webhook body:', JSON.stringify(body));
    const callbackQuery = body?.callback_query;
    const incomingMessage = body?.message;

    if (incomingMessage?.text?.startsWith('/')) {
      const user = incomingMessage.from;
      const telegramId = Number(user?.id);
      const chatId = incomingMessage.chat?.id;
      const text = incomingMessage.text.trim();
      const [command, ...args] = text.split(' ');
      const arg = args.join(' ').trim();

      if (!telegramId || !chatId) {
        return NextResponse.json({ ok: true });
      }

      if (command === '/start' || command === '/help') {
        await sendTelegramMessage(
          chatId,
          `Hola 👋\n\nEstos son los comandos disponibles:\n` +
            `/myid - mostrar tu Telegram ID\n` +
            `/admins - ver admins autorizados\n` +
            `/addme - agregarte como admin si no hay ninguno\n` +
            `/addadmin &lt;telegram_id&gt; - agregar otro admin\n` +
            `/removeadmin &lt;telegram_id&gt; - remover un admin`
        );
        return NextResponse.json({ ok: true });
      }

      if (command === '/myid') {
        await sendTelegramMessage(chatId, `Tu Telegram ID es <code>${telegramId}</code>.`);
        return NextResponse.json({ ok: true });
      }

      if (command === '/admins') {
        const admins = await listTelegramAdmins();
        if (admins.length === 0) {
          await sendTelegramMessage(chatId, 'Actualmente no hay administradores registrados. El primer admin puede agregarse con /addme.');
          return NextResponse.json({ ok: true });
        }

        const lines = admins.map((admin) => {
          const name = admin.full_name ? `${formatTelegramValue(admin.full_name)} ` : '';
          return `• ${name}<code>${admin.telegram_id}</code>`;
        });
        await sendTelegramMessage(chatId, `<b>Admins autorizados</b>\n${lines.join('\n')}`);
        return NextResponse.json({ ok: true });
      }

      if (command === '/addme') {
        const admins = await listTelegramAdmins();
        if (admins.length > 0) {
          const allowed = await isTelegramAdmin(telegramId);
          if (!allowed) {
            await sendTelegramMessage(chatId, 'No estás autorizado para agregar administradores.');
            return NextResponse.json({ ok: true });
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('telegram_admins')
          .upsert({ telegram_id: telegramId, full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() });

        if (insertError) {
          await sendTelegramMessage(chatId, `No se pudo agregar tu ID como administrador: ${insertError.message}`);
          return NextResponse.json({ ok: true });
        }

        await sendTelegramMessage(chatId, `Tu ID <code>${telegramId}</code> ahora está autorizado como administrador.`);
        return NextResponse.json({ ok: true });
      }

      if (command === '/addadmin' || command === '/removeadmin') {
        const allowed = await isTelegramAdmin(telegramId);
        if (!allowed) {
          await sendTelegramMessage(chatId, 'No estás autorizado para administrar administradores.');
          return NextResponse.json({ ok: true });
        }

        const targetId = Number(arg);
        if (!targetId) {
          await sendTelegramMessage(chatId, `Uso: ${command} &lt;telegram_id&gt;.`);
          return NextResponse.json({ ok: true });
        }

        if (command === '/addadmin') {
          const { error: insertError } = await supabaseAdmin
            .from('telegram_admins')
            .upsert({ telegram_id: targetId });

          if (insertError) {
            await sendTelegramMessage(chatId, `No se pudo agregar al administrador: ${insertError.message}`);
            return NextResponse.json({ ok: true });
          }

          await sendTelegramMessage(chatId, `ID <code>${targetId}</code> agregado como administrador.`);
          return NextResponse.json({ ok: true });
        }

        if (command === '/removeadmin') {
          const { error: deleteError } = await supabaseAdmin
            .from('telegram_admins')
            .delete()
            .eq('telegram_id', targetId);

          if (deleteError) {
            await sendTelegramMessage(chatId, `No se pudo remover al administrador: ${deleteError.message}`);
            return NextResponse.json({ ok: true });
          }

          await sendTelegramMessage(chatId, `ID <code>${targetId}</code> ya no es administrador.`);
          return NextResponse.json({ ok: true });
        }
      }
    }

    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const callbackData = callbackQuery.data as string | undefined;
    const callbackId = callbackQuery.id as string;
    const message = callbackQuery.message;
    const from = callbackQuery.from;

    if (!callbackData || !message || !message.chat || !message.message_id || !from || from.id == null) {
      return NextResponse.json({ ok: true });
    }

    const adminId = Number(from.id);
    const allowed = await isTelegramAdmin(adminId);
    if (!allowed) {
      await safeAnswerCallback(callbackId, 'No estás autorizado para aprobar o rechazar tickets.', true);
      return NextResponse.json({ ok: true });
    }

    const [action, ticketIdString] = callbackData.split(':');
    const ticketId = parseTicketId(ticketIdString);
    if (!action || !ticketId) {
      await safeAnswerCallback(callbackId, 'ID de ticket inválido en el botón.', true);
      return NextResponse.json({ ok: true });
    }

    const ticketResponse = await supabaseAdmin
      .from('tickets')
      .select('id,status,qr_code')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketResponse.error || !ticketResponse.data) {
      await safeAnswerCallback(callbackId, 'No se encontró el ticket para procesar esta acción.', true);
      return NextResponse.json({ ok: true });
    }

    if (action === 'approve') {
      const normalizedTicketId = String(ticketId).trim();
      const qrDataUrl = await QRCode.toDataURL(normalizedTicketId, { width: 300, margin: 2 });
      const { error } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'approved', qr_code: qrDataUrl })
        .eq('id', ticketId);

      if (error) {
        await safeAnswerCallback(callbackId, 'Error al aprobar el ticket. Intenta de nuevo.', true);
        return NextResponse.json({ ok: true });
      }

      await safeEditTelegramMessageText(
        message.chat.id,
        message.message_id,
        `<b>Ticket aprobado</b>\nID: <code>${formatTelegramValue(ticketId)}</code>\nAprueba el usuario en la app de Dulcinea Club.`
      );
      await safeClearTelegramMessageReplyMarkup(message.chat.id, message.message_id);
      await safeAnswerCallback(callbackId, 'Ticket aprobado correctamente.');
      console.log('Ticket approved via Telegram callback:', ticketId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('tickets')
        .update({ status: 'pending', qr_code: null })
        .eq('id', ticketId);

      await safeEditTelegramMessageText(
        message.chat.id,
        message.message_id,
        `<b>Ticket no aprobado</b>\nID: <code>${formatTelegramValue(ticketId)}</code>\nEl ticket permanece en estado pendiente.`
      );
      await safeClearTelegramMessageReplyMarkup(message.chat.id, message.message_id);
      await safeAnswerCallback(callbackId, 'Ticket marcado como no aprobado.');
      console.log('Ticket rejected via Telegram callback:', ticketId);
      return NextResponse.json({ ok: true });
    }

    await safeAnswerCallback(callbackId, 'Acción no reconocida.');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
