'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LogOut, LayoutDashboard, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!session || !profile) {
        router.push('/login');
      } else if (profile.role !== 'admin' && profile.role !== 'event_manager') {
        router.push('/scanner');
      }
    }
  }, [loading, session, profile, router]);

  if (loading || !session || !profile || (profile.role !== 'admin' && profile.role !== 'event_manager')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-grid">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-neon glow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold">
                Dulcinea <span className="text-neon">{profile.role === 'event_manager' ? 'Eventos' : 'Admin'}</span>
              </span>
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              {profile.role === 'admin' ? (
                <>
                  <a href="/admin/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </a>
                  <a href="/scanner" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                    <QrCode className="h-4 w-4" />
                    Scanner
                  </a>
                </>
              ) : (
                <a href="/admin/events" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  Eventos
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">Hola, </span>
              <span className="font-medium text-foreground">{profile.full_name || profile.email}</span>
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

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
