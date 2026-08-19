"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

const AUTH_KEY = "upmi-auth-role";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const refreshAuth = () => {
      setIsAdmin(
        localStorage.getItem(AUTH_KEY) === "admin"
      );
    };

    refreshAuth();

    window.addEventListener(
      "upmi-auth-changed",
      refreshAuth
    );

    window.addEventListener(
      "storage",
      refreshAuth
    );

    window.addEventListener(
      "focus",
      refreshAuth
    );

    return () => {
      window.removeEventListener(
        "upmi-auth-changed",
        refreshAuth
      );

      window.removeEventListener(
        "storage",
        refreshAuth
      );

      window.removeEventListener(
        "focus",
        refreshAuth
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

              {isAdmin ? (
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
