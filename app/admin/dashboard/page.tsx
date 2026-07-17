'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Ticket, Settings, Plus, Pencil, Trash2, Check, X, Loader2, Search, Smartphone, Banknote, QrCode, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Event, Ticket as TicketType, Settings as SettingsType, EventInsert } from '@/types/database';

type Tab = 'events' | 'tickets' | 'settings';

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('events');

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Panel de Administración</h1>
        <p className="mt-1 text-muted-foreground">Gestiona eventos, tickets y configuración del sistema</p>
      </div>

      <div className="mb-8 flex gap-1 rounded-xl border border-border/50 bg-card/30 p-1 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.id
                ? 'gradient-neon text-white glow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && <EventsTab />}
      {tab === 'tickets' && <TicketsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ============================================================
// EVENTS TAB
// ============================================================
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, event_images(url)')
      .order('event_date', { ascending: false });
    if (!error && data) {
      const mappedEvents = (data as any).map((eventData: any) => ({
        ...eventData,
        images: eventData.event_images ? eventData.event_images.map((item: any) => item.url) : [],
      }));
      setEvents(mappedEvents as Event[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      setEvents(events.filter((e) => e.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Gestión de Eventos</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg gradient-neon px-4 py-2 text-sm font-semibold text-white transition-all hover:glow-sm"
        >
          <Plus className="h-4 w-4" />
          Crear evento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No hay eventos creados aún</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="group rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur transition-all hover:border-neon/30 hover:glow-sm">
              {(event.images && event.images.length > 0 ? event.images[0] : event.flyer_url) && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img src={(event.images && event.images.length > 0 ? event.images[0] : event.flyer_url) as string} alt={event.title} className="h-40 w-full object-cover" />
                </div>
              )}
              <h3 className="font-display text-lg font-semibold">{event.title}</h3>
              {event.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.event_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">S/ {Number(event.price).toFixed(2)}</span>
                  <span className="text-muted-foreground">Capacidad: {event.capacity}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setEditing(event); setShowForm(true); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-neon/50 hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                >
                  {deleting === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}

function EventForm({ event, onClose, onSaved }: { event: Event | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [price, setPrice] = useState(event?.price?.toString() || '');
  const [flyerUrl, setFlyerUrl] = useState(event?.flyer_url || '');
  const [imageUrls, setImageUrls] = useState<string[]>(event?.images || (event?.flyer_url ? [event.flyer_url] : []));
  const [eventDate, setEventDate] = useState(
    event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : ''
  );
  const [capacity, setCapacity] = useState(event?.capacity?.toString() || '100');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('flyers')
      .upload(filePath, file);

    if (uploadError) {
      setError('Error al subir la imagen: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('flyers')
      .getPublicUrl(filePath);

    setImageUrls((prev) => [...prev, urlData.publicUrl]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload: EventInsert = {
      title,
      description: description || null,
      price: parseFloat(price) || 0,
      flyer_url: imageUrls[0] || flyerUrl || null,
      event_date: new Date(eventDate).toISOString(),
      capacity: parseInt(capacity) || 100,
    };

    let result;
    if (event) {
      result = await supabase.from('events').update(payload).eq('id', event.id);
      // remove existing images and insert new ones
      await supabase.from('event_images').delete().eq('event_id', event.id);
      for (const url of imageUrls) {
        await supabase.from('event_images').insert({ event_id: event.id, url });
      }
    } else {
      const insertRes = await supabase.from('events').insert(payload).select('id');
      result = insertRes;
      const newId = insertRes.data && insertRes.data[0] && insertRes.data[0].id;
      if (newId) {
        for (const url of imageUrls) {
          await supabase.from('event_images').insert({ event_id: newId, url });
        }
      }
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-8 glow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 font-display text-2xl font-bold">{event ? 'Editar evento' : 'Crear evento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Precio (S/)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Capacidad</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Fecha y hora</label>
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {/* File Upload for Flyer */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Imágenes del evento</label>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {imageUrls.map((u, idx) => (
                <div key={u} className="relative">
                  <img src={u} alt={`Imagen ${idx + 1}`} className="h-24 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 rounded-lg bg-background/80 px-1 py-0.5 text-xs text-destructive backdrop-blur transition-colors hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <label
              htmlFor="flyer-upload"
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-background/50 px-4 py-3 text-muted-foreground transition-colors hover:border-neon/50 hover:text-foreground"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm">Subir imágenes (PNG, JPG). Puedes agregar varias.</div>
                </>
              )}
              <input
                id="flyer-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((file) => handleFileUpload(file));
                }}
              />
            </label>
          </div>
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="flex-1 rounded-lg gradient-neon px-4 py-2.5 text-sm font-semibold text-white transition-all hover:glow-sm disabled:opacity-50">
              {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : event ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// TICKETS TAB
// ============================================================
function TicketsTab() {
  const [tickets, setTickets] = useState<(TicketType & { events: Pick<Event, 'title' | 'event_date'> })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(title, event_date)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTickets(data as (TicketType & { events: Pick<Event, 'title' | 'event_date'> })[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleApprove = async (ticket: TicketType) => {
    setProcessing(ticket.id);
    setApproveError(null);
    const qrPayload = String(ticket.id || '');
    if (!qrPayload) {
      setApproveError('No se pudo generar el código QR porque el ID del ticket es inválido.');
      setProcessing(null);
      return;
    }

    let qrDataUrl: string | null = null;
    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: qrPayload }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al generar el QR en el servidor');
      }
      qrDataUrl = data.qrDataUrl;
    } catch (err) {
      console.error('QR generation failed for', ticket.id, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setApproveError(`No se pudo generar el código QR. Error: ${errorMessage}`);
      setProcessing(null);
      return;
    }

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'approved', qr_code: qrDataUrl })
      .eq('id', ticket.id);

    if (!error) {
      setTickets(tickets.map((t) =>
        t.id === ticket.id ? { ...t, status: 'approved', qr_code: qrDataUrl } : t
      ));
    } else {
      setApproveError(`Error al aprobar el ticket. Intenta de nuevo: ${error.message}`);
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'pending', qr_code: null })
      .eq('id', id);

    if (!error) {
      setTickets(tickets.map((t) =>
        t.id === id ? { ...t, status: 'pending', qr_code: null } : t
      ));
    }
    setProcessing(null);
  };

  const filtered = tickets
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.operation_number || '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <h2 className="mb-6 font-display text-xl font-semibold">Gestión de Tickets</h2>
      {approveError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {approveError}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border/50 bg-card/30 p-1">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                filter === f ? 'gradient-neon text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Aprobados'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email u operación..."
            className="w-full rounded-lg border border-input bg-background/50 py-2 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center">
          <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No hay tickets para mostrar</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30 backdrop-blur">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Comprador</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Evento</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pago</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border/30 transition-colors hover:bg-card/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{ticket.name}</div>
                    <div className="text-xs text-muted-foreground">{ticket.email}</div>
                    {ticket.phone && <div className="text-xs text-muted-foreground">{ticket.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{ticket.events?.title || 'N/A'}</div>
                    {ticket.events?.event_date && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(ticket.events.event_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      {ticket.payment_method === 'Yape' ? <Smartphone className="h-4 w-4 text-primary" /> : <Banknote className="h-4 w-4 text-green-500" />}
                      {ticket.payment_method}
                    </div>
                    {ticket.operation_number && (
                      <div className="text-xs text-muted-foreground">Op: {ticket.operation_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ticket.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                        <Check className="h-3 w-3" /> Aprobado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                        <Loader2 className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                    {ticket.is_used && (
                      <div className="mt-1 text-xs text-blue-400">Usado</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {ticket.status === 'pending' ? (
                        <button
                          onClick={() => handleApprove(ticket)}
                          disabled={processing === ticket.id}
                          className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-all hover:bg-green-500/20 disabled:opacity-50"
                        >
                          {processing === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Aprobar
                        </button>
                      ) : (
                        <>
                          {ticket.qr_code && (
                            <div className="relative group">
                              <button className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                                <QrCode className="h-3 w-3" /> QR
                              </button>
                              <div className="absolute right-0 top-full z-10 mt-2 hidden group-hover:block">
                                <img src={ticket.qr_code} alt="QR" className="rounded-lg border border-border bg-white p-2" width={150} height={150} />
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleReject(ticket.id)}
                            disabled={processing === ticket.id}
                            className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {processing === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab() {
  const [yapeNumber, setYapeNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).maybeSingle().then(({ data, error }) => {
      if (data) setYapeNumber((data as SettingsType).yape_number || '');
      if (error) setError(error.message);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();

    let result;
    if (existing) {
      result = await supabase.from('settings').update({ yape_number: yapeNumber, updated_at: new Date().toISOString() }).eq('id', (existing as SettingsType).id);
    } else {
      result = await supabase.from('settings').insert({ yape_number: yapeNumber });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-md">
      <h2 className="mb-6 font-display text-xl font-semibold">Configuración</h2>
      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Número de Yape</label>
          <p className="mb-3 text-xs text-muted-foreground">Este número se mostrará a los compradores al pagar con Yape</p>
          <input
            value={yapeNumber}
            onChange={(e) => setYapeNumber(e.target.value)}
            placeholder="950 123 456"
            className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>}
        {saved && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">Configuración guardada</div>}
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg gradient-neon px-4 py-2.5 text-sm font-semibold text-white transition-all hover:glow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
