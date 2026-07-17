'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Users, Loader2, Copy, Check, Smartphone, Banknote, Ticket as TicketIcon, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Event, Settings } from '@/types/database';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [yapeNumber, setYapeNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      // Try to fetch event with related images. If the relation/table doesn't exist (migration not applied),
      // fall back to a simple fetch to avoid blocking the page.
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, event_images(url)')
          .eq('id', id)
          .maybeSingle();

        if (eventError || !eventData) throw new Error(eventError?.message || 'No event with images');

        const mapped = {
          ...(eventData as any),
          images: (eventData as any).event_images ? (eventData as any).event_images.map((r: any) => r.url) : [],
        } as Event;
        setEvent(mapped);
      } catch (err) {
        // Fallback: fetch event without joining event_images
        const { data: simpleEvent, error: simpleError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (simpleError || !simpleEvent) {
          setError('Evento no encontrado');
          setLoading(false);
          return;
        }
        setEvent(simpleEvent as Event);
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('yape_number')
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setYapeNumber((settingsData as Settings).yape_number || '');
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Evento no encontrado'}</p>
        <button onClick={() => router.push('/')} className="rounded-lg gradient-neon px-6 py-3 font-semibold text-white">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      {/* Glassmorphism Header */}
      <nav className="sticky top-0 z-50 border-b border-border/20 bg-background/30 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <a href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img src="/images/image.png" alt="Dulcinea Club" className="h-10 w-auto object-contain" />
          </a>
          <a href="/mis-entradas" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Mis Entradas
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Event Info */}
          <div>
            {(event.images && event.images.length > 0) ? (
              <div className="mb-6">
                <div className="overflow-hidden rounded-2xl border border-border/50 glow-sm">
                  <img src={event.images[0]} alt={event.title} className="w-full object-cover" />
                </div>
                {event.images.length > 1 && (
                  <div className="mt-3 flex gap-2">
                    {event.images.map((u, i) => (
                      <img key={u} src={u} alt={`thumb-${i}`} className="h-16 w-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              event.flyer_url && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-border/50 glow-sm">
                  <img src={event.flyer_url} alt={event.title} className="w-full object-cover" />
                </div>
              )
            )}
            <h1 className="font-display text-4xl font-bold">{event.title}</h1>
            {event.description && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{event.description}</p>
            )}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{new Date(event.event_date).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-primary" />
                <span>Capacidad: {event.capacity} personas</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TicketIcon className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-neon">S/ {Number(event.price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div>
            <RegisterTicketForm eventId={event.id} eventTitle={event.title} yapeNumber={yapeNumber} />
          </div>
        </div>
      </main>
    </div>
  );
}

function RegisterTicketForm({ eventId, eventTitle, yapeNumber }: { eventId: string; eventTitle: string; yapeNumber: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Yape' | 'Efectivo'>('Yape');
  const [operationNumber, setOperationNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const copyYape = async () => {
    try {
      await navigator.clipboard.writeText(yapeNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = yapeNumber;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const ticketData: Record<string, unknown> = {
      event_id: eventId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim() || null,
      payment_method: paymentMethod,
      status: 'pending',
      is_used: false,
    };

    if (paymentMethod === 'Yape') {
      ticketData.operation_number = operationNumber.trim();
    }

    // Use server-side API to create ticket (supabase Admin) to avoid RLS issues
    let insertedId = null;
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: ticketData.event_id,
          name: ticketData.name,
          email: ticketData.email,
          phone: ticketData.phone,
          payment_method: ticketData.payment_method,
          operation_number: ticketData.operation_number,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        console.error('Server ticket create failed', json);
        setError(process.env.NODE_ENV === 'production' ? 'Error al registrar tu ticket. Verifica los datos e inténtalo de nuevo.' : `Error al registrar tu ticket: ${json.error || 'server error'}`);
        setSubmitting(false);
        return;
      }
      insertedId = json.id;
    } catch (e) {
      console.error('Ticket create request failed', e);
      setError('Error al registrar tu ticket. Verifica los datos e inténtalo de nuevo.');
      setSubmitting(false);
      return;
    }

    try {
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: insertedId,
          eventTitle,
          name: ticketData.name,
          email: ticketData.email,
          phone: ticketData.phone,
          paymentMethod: ticketData.payment_method,
          operationNumber: ticketData.operation_number,
        }),
      });
    } catch (notifyError) {
      console.error('Telegram notification failed', notifyError);
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center glow-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="h-10 w-10 text-green-400" />
        </div>
        <h3 className="font-display text-2xl font-bold text-green-400">¡Ticket Registrado!</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu solicitud de compra para <span className="font-semibold text-foreground">{eventTitle}</span> ha sido recibida.
          El equipo de Dulcinea Club revisará tu pago y aprobará tu entrada.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes revisar el estado de tu entrada en la página <a href="/mis-entradas" className="text-primary underline">Mis Entradas</a>.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Registrar otro ticket
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-8 backdrop-blur-xl glow-sm">
      <h2 className="mb-6 font-display text-2xl font-bold">Comprar Entrada</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nombre completo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Teléfono</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {/* Payment Method */}
        <div>
          <label className="mb-2 block text-sm font-medium">Método de pago</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('Yape')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                paymentMethod === 'Yape'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Yape
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Efectivo')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                paymentMethod === 'Efectivo'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Banknote className="h-4 w-4" />
              Efectivo
            </button>
          </div>
        </div>

        {/* Yape Info */}
        {paymentMethod === 'Yape' && yapeNumber && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-muted-foreground">Envía el pago al siguiente número de Yape:</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-display text-xl font-bold text-neon">{yapeNumber}</span>
              </div>
              <button
                type="button"
                onClick={copyYape}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Número de operación de Yape</label>
              <input value={operationNumber} onChange={(e) => setOperationNumber(e.target.value)} required
                placeholder="Ej: 123456789"
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg gradient-neon px-4 py-3 font-semibold text-white transition-all hover:glow-md disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <TicketIcon className="h-5 w-5" />}
          {submitting ? 'Registrando...' : 'Registrar ticket'}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Tu ticket quedará pendiente hasta que el equipo apruebe tu pago.
        </p>
      </form>
    </div>
  );
}
