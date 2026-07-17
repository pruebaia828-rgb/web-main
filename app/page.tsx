'use client';

import { useState, useEffect, useRef } from 'react';
import { Ticket, Calendar, QrCode, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Event } from '@/types/database';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*, event_images(url)')
        .order('event_date', { ascending: true })
        .limit(6);
      if (data) {
        const mappedEvents = (data as any).map((eventData: any) => ({
          ...eventData,
          images: eventData.event_images ? eventData.event_images.map((item: any) => item.url) : [],
        }));
        setEvents(mappedEvents as Event[]);
      }
      setLoadingEvents(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-grid">
      {/* Glassmorphism Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/30 bg-background/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Dulcinea Club" className="h-9 w-9 transition-transform hover:scale-110" />
            <span className="font-display text-xl font-bold tracking-tight">
              Dulcinea <span className="text-neon">Club</span>
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Características
            </a>
            <a href="#events" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Eventos
            </a>
            <a href="/mis-entradas" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Mis Entradas
            </a>
            <a
              href="/login"
              className="rounded-lg gradient-neon px-4 py-2 text-sm font-semibold text-white transition-all hover:glow-md"
            >
              Acceso Staff
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-primary/10 px-4 py-1.5 text-sm text-primary backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {events.length > 0 ? `${events.length} evento${events.length > 1 ? 's' : ''} disponible${events.length > 1 ? 's' : ''}` : 'Próximamente nuevos eventos'}
          </div>

          <h1 className="font-display text-6xl font-extrabold leading-[1.1] tracking-tight md:text-8xl">
            Tu entrada
            <br />
            <span className="gradient-text">empieza aquí</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Compra tu ticket para los próximos eventos de Dulcinea Club, paga con Yape o efectivo,
            y entra mostrando tu código QR. Sin filas, sin papeleo.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a
              href="#events"
              className="group flex items-center justify-center gap-2 rounded-xl gradient-neon px-8 py-4 text-base font-semibold text-white transition-all hover:glow-md"
            >
              Ver eventos
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/mis-entradas"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-8 py-4 text-base font-semibold text-foreground backdrop-blur transition-all hover:border-neon/50 hover:bg-card"
            >
              Mis Entradas
            </a>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Próximos Eventos</h2>
          <p className="mt-4 text-lg text-muted-foreground">Elige tu evento y asegura tu entrada en minutos</p>
        </div>

        {loadingEvents ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No hay eventos publicados aún</p>
            <p className="mt-1 text-sm text-muted-foreground">Vuelve pronto para ver los próximos eventos de Dulcinea Club.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Cómo comprar */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Comprar tu entrada es fácil</h2>
          <p className="mt-4 text-lg text-muted-foreground">Del evento a la puerta del club en tres pasos.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Ticket,
              title: 'Elige tu evento',
              desc: 'Revisa la fecha, el precio y los detalles del evento que quieres vivir, y completa tus datos.',
            },
            {
              icon: Smartphone,
              title: 'Paga con Yape o efectivo',
              desc: 'Envía el pago por Yape con el número de operación, o coordina tu pago en efectivo. Tu compra queda pendiente de aprobación.',
            },
            {
              icon: QrCode,
              title: 'Entra con tu QR',
              desc: 'Una vez aprobado tu pago, tu entrada queda lista. Muestra el código QR en la puerta y listo.',
            },
          ].map((step) => (
            <div
              key={step.title}
              className="group rounded-2xl border border-border/50 bg-card/30 p-8 backdrop-blur transition-all hover:border-neon/40 hover:bg-card/50 hover:glow-sm"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neon/20 bg-primary/10 transition-all group-hover:gradient-neon group-hover:glow-sm">
                <step.icon className="h-6 w-6 text-primary transition-colors group-hover:text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Dulcinea Club" className="h-8 w-8" />
              <span className="font-display text-lg font-bold">Dulcinea Club</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/mis-entradas" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Mis Entradas</a>
              <a href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Acceso Staff</a>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground md:text-left">
            Plataforma de gestión de eventos. Construido con Next.js, Tailwind CSS y Supabase.
          </p>
        </div>
      </footer>
    </main>
  );
}

function EventCard({ event }: { event: Event }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [currentImage, setCurrentImage] = useState(0);
  const images = event.images && event.images.length > 0 ? event.images : event.flyer_url ? [event.flyer_url] : [];

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -10, y: (px - 0.5) * 10 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <a
      ref={cardRef}
      href={`/events/${event.id}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1, 1, 1)`,
        transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.4s ease' : 'transform 0.08s ease-out',
      }}
      className="group overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur will-change-transform hover:border-neon/40 hover:glow-sm"
    >
      {images.length > 0 && (
        <div className="overflow-hidden">
          <img
            src={images[currentImage]}
            alt={event.title}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold">{event.title}</h3>
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(event.event_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
          </div>
          <span className="font-display text-lg font-bold text-neon">S/ {Number(event.price).toFixed(2)}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Comprar entrada
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </a>
  );
}