"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setIsAdmin(Boolean(session));
      setLoadingAuth(false);
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setIsAdmin(Boolean(session));
        setLoadingAuth(false);
      }
    );

    const handleFocus = () => {
      loadAuth();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      active = false;

      subscription.unsubscribe();

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENT */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0b1f5c]">
                Dashboard Monitoring Akreditasi & SPMI
              </h1>

              <p className="text-slate-500">
                Politeknik Sinar Mas Berau Coal
              </p>
            </div>

            <div className="text-right">
              {loadingAuth ? (
                <>
                  <p className="font-bold text-slate-400">
                    Memeriksa akses...
                  </p>

                  <p className="text-sm text-slate-400">
                    Mohon tunggu
                  </p>
                </>
              ) : isAdmin ? (
                <>
                  <p className="font-bold text-[#0b1f5c]">
                    Admin UPMI
                  </p>

                  <p className="text-sm font-medium text-green-600">
                    Mode Editor
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#0b1f5c]">
                    Viewer
                  </p>

                  <p className="text-sm text-slate-500">
                    Read Only
                  </p>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 overflow-x-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}