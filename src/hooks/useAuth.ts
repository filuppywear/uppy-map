"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const configured = hasSupabaseBrowserConfig();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const supabase = createSupabaseBrowserClient();

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [configured]);

  return { user, loading, isLoggedIn: !!user, signOut };
}
