'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, ArrowLeft, ScanLine, CheckCircle2, XCircle, Loader2, User, Calendar, Ticket as TicketIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import type { Ticket, Event } from '@/types/database';

interface ScanResult {
  status: 'success' | 'used' | 'error';
  ticket?: Ticket & { events: Pick<Event, 'title' | 'event_date'> };
  message: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const { session, profile, loading, signOut } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
  const [scanRequested, setScanRequested] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!session || !profile) {
        router.push('/login');
      }
    }
  }, [loading, session, profile, router]);

  const handleSignOut = async () => {
    if (scannerInstance) {
      try { await scannerInstance.stop(); } catch { /* ignore */ }
    }
    await signOut();
    router.push('/login');
  };

  const processTicket = async (decodedText: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*, events(title, event_date)')
        .eq('id', decodedText)
        .maybeSingle();

      if (error || !ticket) {
        setResult({ status: 'error', message: 'Ticket no encontrado en el sistema' });
        setProcessing(false);
        return;
      }

      if (ticket.is_used) {
        setResult({
          status: 'used',
          ticket: ticket as Ticket & { events: Pick<Event, 'title' | 'event_date'> },
          message: 'Entrada ya utilizada',
        });
        setProcessing(false);
        return;
      }

      if (ticket.status !== 'approved') {
        setResult({
          status: 'error',
          ticket: ticket as Ticket & { events: Pick<Event, 'title' | 'event_date'> },
          message: 'Ticket no aprobado - pago pendiente',
        });
        setProcessing(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ is_used: true })
        .eq('id', ticket.id);

      if (updateError) {
        setResult({ status: 'error', message: 'Error al validar el ticket' });
        setProcessing(false);
        return;
      }

      setResult({
        status: 'success',
        ticket: { ...ticket, is_used: true } as Ticket & { events: Pick<Event, 'title' | 'event_date'> },
        message: 'Acceso Permitido',
      });
    } catch {
      setResult({ status: 'error', message: 'Error al procesar el ticket' });
    }
    setProcessing(false);
  };

  const startScanner = async () => {
    setResult(null);
    setCameraError(null);
    setScanning(true);

    if (scannerInstance) {
      try {
        await scannerInstance.stop();
        scannerInstance.clear();
      } catch {
        // ignore stop/clear errors
      }
      setScannerInstance(null);
    }

    setScanRequested(true);
  };

  useEffect(() => {
    if (!scanRequested || !scannerContainerRef.current || scannerInstance) {
      return;
    }

    const initScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode('qr-reader');
        setScannerInstance(html5Qrcode);

        let cameraConfig: any = { facingMode: 'environment' };
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const rearCamera = cameras.find((camera) => /rear|back|environment/i.test(camera.label)) || cameras[0];
            cameraConfig = { deviceId: { exact: rearCamera.id } };
          }
        } catch {
          // ignore and use facingMode fallback
        }

        await html5Qrcode.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5Qrcode.stop().then(() => {
              html5Qrcode.clear();
              setScannerInstance(null);
              setScanning(false);
              setScanRequested(false);
              processTicket(decodedText);
            }).catch(() => {
              setScannerInstance(null);
              setScanning(false);
              setScanRequested(false);
              processTicket(decodedText);
            });
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera access failed', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setCameraError(`No se pudo acceder a la cámara. Usa HTTPS con ngrok, revisa permisos de cámara en el navegador móvil y recarga la página. Error: ${errorMessage}`);
        setScanning(false);
        setScanRequested(false);
      }
    };

    initScanner();
  }, [scanRequested, scannerInstance]);

  const stopScanner = async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.stop();
        scannerInstance.clear();
      } catch { /* ignore */ }
      setScannerInstance(null);
    }
    setScanning(false);
    setScanRequested(false);
  };

  useEffect(() => {
    return () => {
      if (scannerInstance) {
        try { scannerInstance.stop(); } catch { /* ignore */ }
      }
    };
  }, [scannerInstance]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <a href="/admin/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </a>
            )}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-neon glow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold">
                Dulcinea <span className="text-neon">Scanner</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">Hola, </span>
              <span className="font-medium text-foreground">{profile?.full_name || profile?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon/20 bg-primary/10 animate-pulse-glow">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Validación de Entradas</h1>
          <p className="mt-2 text-muted-foreground">Escanea el código QR del ticket para validar el acceso</p>
        </div>

        {!scanning && !result && (
          <div className="flex flex-col items-center">
            <button
              onClick={startScanner}
              className="group flex items-center gap-3 rounded-xl gradient-neon px-8 py-4 text-lg font-semibold text-white transition-all hover:glow-md"
            >
              <ScanLine className="h-6 w-6" />
              Iniciar escaneo
            </button>
          </div>
        )}

        {scanning && (
          <div className="flex flex-col items-center">
            <div ref={scannerContainerRef} id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-2xl border border-neon/30 glow-md" />
            {cameraError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                {cameraError}
              </div>
            )}
            <button
              onClick={stopScanner}
              className="mt-6 rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              Cancelar
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl border p-8 text-center ${
                result.status === 'success'
                  ? 'border-green-500/40 bg-green-500/10 glow-md'
                  : result.status === 'used'
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-red-500/40 bg-red-500/10'
              }`}
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                {result.status === 'success' ? (
                  <CheckCircle2 className="h-20 w-20 text-green-400" />
                ) : result.status === 'used' ? (
                  <XCircle className="h-20 w-20 text-amber-400" />
                ) : (
                  <XCircle className="h-20 w-20 text-red-400" />
                )}
              </div>
              <h2
                className={`font-display text-3xl font-bold ${
                  result.status === 'success'
                    ? 'text-green-400'
                    : result.status === 'used'
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {result.message}
              </h2>
            </div>

            {result.ticket && (
              <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Datos del Ticket</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Nombre:</span>
                    <span className="font-medium text-foreground">{result.ticket.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TicketIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Evento:</span>
                    <span className="font-medium text-foreground">{result.ticket.events?.title || 'N/A'}</span>
                  </div>
                  {result.ticket.events?.event_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fecha:</span>
                      <span className="font-medium text-foreground">
                        {new Date(result.ticket.events.event_date).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{result.ticket.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Pago:</span>
                    <span className="font-medium text-foreground">{result.ticket.payment_method}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { void startScanner(); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-neon px-6 py-4 font-semibold text-white transition-all hover:glow-md"
            >
              <ScanLine className="h-5 w-5" />
              Escanear otro ticket
            </button>
          </div>
        )}

        {processing && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </main>
    </div>
  );
}
