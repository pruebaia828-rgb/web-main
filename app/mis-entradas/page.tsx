'use client';

import { useState } from 'react';
import { Search, Loader2, TicketIcon, Calendar, QrCode, Mail, CheckCircle2, XCircle } from 'lucide-react';

interface TicketResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  payment_method: string;
  operation_number: string | null;
  status: string;
  qr_code: string | null;
  is_used: boolean;
  created_at: string;
  events: {
    id: number;
    title: string;
    event_date: string;
    price: number;
  };
}

export default function MisEntradasPage() {
  const [email, setEmail] = useState('');
  const [tickets, setTickets] = useState<TicketResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/lookup-tickets?email=${encodeURIComponent(email.toLowerCase().trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al buscar entradas');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTickets(data.tickets || []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar entradas');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Glassmorphism Header */}
      <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Dulcinea Club" className="h-8 w-8" />
            <span className="font-display text-lg font-bold">
              Dulcinea <span className="text-neon">Club</span>
            </span>
          </a>
          <a href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Inicio
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon/20 bg-primary/10 animate-pulse-glow">
            <TicketIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Mis Entradas</h1>
          <p className="mt-2 text-muted-foreground">Ingresa tu correo para ver tus tickets aprobados y sus códigos QR</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full rounded-lg border border-input bg-background/50 py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg gradient-neon px-6 py-3 font-semibold text-white transition-all hover:glow-md disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div>
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center">
                <TicketIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No se encontraron entradas</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No hay tickets aprobados para <span className="font-medium text-foreground">{email}</span>.
                  Si acabas de comprar, espera a que el equipo apruebe tu pago.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Se encontraron <span className="font-bold text-foreground">{tickets.length}</span> entrada(s) aprobada(s)
                </p>
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketResult }) {
  const hasValidQr = ticket.qr_code?.startsWith('data:image');

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl glow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* QR Code */}
        <div className="flex items-center justify-center bg-white p-6 sm:w-48 sm:flex-shrink-0">
          {hasValidQr ? (
            <img src={ticket.qr_code ?? ''} alt="QR Code" width={160} height={160} className="rounded-lg" />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-100">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Ticket Info */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-bold">{ticket.events?.title || 'Evento'}</h3>
              {ticket.events?.event_date && (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(ticket.events.event_date).toLocaleDateString('es-PE', {
                    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
            </div>
            {ticket.is_used ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                <XCircle className="h-3 w-3" /> Usado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Válido
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre:</span>
              <span className="font-medium text-foreground">{ticket.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-foreground">{ticket.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago:</span>
              <span className="font-medium text-foreground">{ticket.payment_method}</span>
            </div>
            {ticket.operation_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operación:</span>
                <span className="font-medium text-foreground">{ticket.operation_number}</span>
              </div>
            )}
            {ticket.events?.price != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio:</span>
                <span className="font-bold text-neon">S/ {Number(ticket.events.price).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
            Presenta este código QR en la entrada del evento para validar tu acceso.
          </div>
        </div>
      </div>
    </div>
  );
}
