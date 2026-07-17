import { NextResponse } from 'next/server';
import * as QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ticketId = String(body.ticketId || '');

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID inválido' }, { status: 400 });
    }

    const qrDataUrl = await QRCode.toDataURL(ticketId, { width: 300, margin: 2 });
    return NextResponse.json({ qrDataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
