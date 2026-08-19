"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  FolderCheck,
  CheckCircle,
  BarChart3,
  FileText,
  Settings,
  LogIn,
  LogOut,
  UserRound,
  X,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Program Studi",
    href: "/program-studi",
    icon: GraduationCap,
  },
  {
    name: "Perguruan Tinggi",
    href: "/perguruan-tinggi",
    icon: Building2,
  },
  {
    name: "Monitoring Dokumen",
    href: "/monitoring",
    icon: FolderCheck,
  },
  {
    name: "Validasi UPMI",
    href: "/validasi",
    icon: CheckCircle,
  },
  {
    name: "Simulasi Skor",
    href: "/simulasi",
    icon: BarChart3,
  },
  {
    name: "Laporan",
    href: "/laporan",
    icon: FileText,
  },
  {
    name: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [showLogin, setShowLogin] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setIsAdmin(
        Boolean(session)
      );
    }

    loadSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setIsAdmin(
            Boolean(session)
          );

          window.dispatchEvent(
            new Event(
              "upmi-auth-changed"
            )
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      setError(
        "Email atau password salah."
      );

      setLoading(false);
      return;
    }

    setIsAdmin(true);

    setShowLogin(false);

    setEmail("");
    setPassword("");

    setLoading(false);

    window.dispatchEvent(
      new Event(
        "upmi-auth-changed"
      )
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setIsAdmin(false);

    window.dispatchEvent(
      new Event(
        "upmi-auth-changed"
      )
    );
  }

  return (
    <>
      <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white">

        {/* LOGO */}
        <div className="border-b border-slate-200 px-5 py-4">

          <div className="flex items-center gap-3">

            <img
              src="/logo-poltek.png"
              alt="Logo Politeknik Sinar Mas Berau Coal"
              className="h-14 w-14 shrink-0 object-contain"
            />

            <div className="min-w-0">

              <h1 className="font-bold leading-tight text-blue-950">
                UPMI
              </h1>

              <p className="text-xs leading-snug text-slate-500">
                Politeknik Sinar Mas Berau Coal
              </p>

            </div>

          </div>

        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">

          {menu.map((item) => {
            const Icon =
              item.icon;

            const active =
              pathname ===
                item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  active
                    ? "bg-blue-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />

                <span>
                  {item.name}
                </span>

              </Link>
            );
          })}

        </nav>

        {/* USER STATUS */}
        <div className="border-t border-slate-200 p-4">

          {isAdmin ? (

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <UserRound
                    size={18}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-bold text-[#0b1f5c]">
                    Admin UPMI
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-green-700">
                    ● Mode Editor
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0b1f5c] transition hover:bg-slate-50"
              >
                <LogOut
                  size={15}
                />

                Logout
              </button>

            </div>

          ) : (

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <UserRound
                    size={18}
                  />
                </div>

                <div>

                  <p className="text-sm font-bold text-[#0b1f5c]">
                    Viewer
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Mode hanya lihat
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowLogin(
                    true
                  );

                  setError("");
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-900"
              >
                <LogIn
                  size={15}
                />

                Login Admin UPMI
              </button>

            </div>

          )}

        </div>

        {/* FOOTER */}
        <div className="bg-blue-950 p-5 text-white">

          <p className="font-bold">
            UPMI
          </p>

          <p className="text-xs text-blue-100">
            Unit Penjaminan Mutu Internal
          </p>

        </div>

      </aside>

      {/* LOGIN MODAL */}
      {showLogin && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 text-white">
                  <LockKeyhole
                    size={21}
                  />
                </div>

                <h2 className="text-xl font-bold text-[#0b1f5c]">
                  Login Admin UPMI
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Gunakan akun Admin UPMI yang terdaftar di Supabase.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowLogin(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                handleLogin
              }
              className="mt-6 space-y-4"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#0b1f5c]">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="admin@poltek..."
                  autoFocus
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-[#0b1f5c] outline-none focus:border-blue-950"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-[#0b1f5c]">
                  Password
                </label>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-[#0b1f5c] outline-none focus:border-blue-950"
                />

              </div>

              {error && (

                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>

              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Sedang Login..."
                  : "Masuk sebagai Admin"}
              </button>

            </form>

          </div>

        </div>

      )}
    </>
  );
}