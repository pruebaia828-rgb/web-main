import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      name,
      email,
      phone,
      payment_method,
      operation_number,
      status = 'pending',
      is_used = false,
    } = body;

    if (!event_id || !name || !email) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const ticket = {
      event_id,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone || null,
      payment_method: payment_method || null,
      operation_number: operation_number || null,
      status,
      is_used,
    };

    const { data, error } = await supabaseAdmin.from('tickets').insert(ticket).select('id').single();
    if (error) {
      console.error('Server ticket insert error', error);
      return NextResponse.json({ ok: false, error: error.message || 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('API /api/tickets error', err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
