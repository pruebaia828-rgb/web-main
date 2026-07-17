'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        const profile = await fetchProfile(session.user.id);
        if (!mounted) return;
        if (profile) {
          setState({ session, profile, loading: false });
        } else {
          setState({ session: null, profile: null, loading: false });
        }
      } else {
        setState({ session: null, profile: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session) {
            const profile = await fetchProfile(session.user.id);
            if (!mounted) return;
            if (profile) {
              setState({ session, profile, loading: false });
            } else {
              setState({ session: null, profile: null, loading: false });
            }
          } else {
            if (!mounted) return;
            setState({ session: null, profile: null, loading: false });
          }
        })();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, profile: null, loading: false });
  }, []);

  return {
    ...state,
    signIn,
    signOut,
    isAdmin: state.profile?.role === 'admin',
    isScanner: state.profile?.role === 'scanner',
    isStaff: state.profile?.role === 'admin' || state.profile?.role === 'scanner',
  };
}

export type { UserRole };
