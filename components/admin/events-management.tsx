'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Event, EventInsert } from '@/types/database';

interface EventsManagementProps {
  title?: string;
  description?: string;
}

export function EventsManagement({ title = 'Gestión de Eventos', description = 'Crea y edita eventos del sistema' }: EventsManagementProps) {
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg gradient-neon px-4 py-2 text-sm font-semibold text-white transition-all hover:glow-sm"
        >
          <Plus className="h-4 w-4" />
          Crear evento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
                  <img
                    src={(event.images && event.images.length > 0 ? event.images[0] : event.flyer_url) as string}
                    alt={event.title}
                    className="h-40 w-full object-cover"
                  />
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
                  onClick={() => {
                    setEditing(event);
                    setShowForm(true);
                  }}
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
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            fetchEvents();
          }}
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
  const [eventDate, setEventDate] = useState(event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '');
  const [capacity, setCapacity] = useState(event?.capacity?.toString() || '100');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('flyers').upload(filePath, file);
    if (uploadError) {
      setError('Error al subir la imagen: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('flyers').getPublicUrl(filePath);
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
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Precio (S/)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Capacidad</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Fecha y hora</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Imágenes del evento</label>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {imageUrls.map((url, idx) => (
                <div key={url} className="relative">
                  <img src={url} alt={`Imagen ${idx + 1}`} className="h-24 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls((prev) => prev.filter((_, index) => index !== idx))}
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
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={saving || uploading} className="flex-1 rounded-lg gradient-neon px-4 py-2.5 text-sm font-semibold text-white transition-all hover:glow-sm disabled:opacity-50">
              {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : event ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
