"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";

const userMenus = [
  { href: "/dashboard", label: "Dashboard", icon: "◇" },
  { href: "/checker", label: "Cek Link", icon: "⌁" },
  { href: "/analyzer", label: "Analisis Pesan", icon: "✦" },
  { href: "/chatbot", label: "Tanya AI", icon: "✧" },
  { href: "/report", label: "Rujukan Bantuan", icon: "▣" },
  { href: "/about", label: "Metodologi", icon: "◎" }
];

const adminMenus = [
  { href: "/admin", label: "Admin Monitor", icon: "▤" },
  { href: "/trends", label: "Scam Mapping", icon: "⌬" }
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const menus = isAdmin ? [...userMenus, ...adminMenus] : userMenus;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-100/10 bg-navy/82 p-5 backdrop-blur-xl lg:block">
      <Link href="/dashboard">
        <Logo />
      </Link>

      <div className="mt-8 rounded-3xl border border-cyan-200/10 bg-cyan-200/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Akun Aktif</p>
        <p className="mt-2 truncate text-sm font-semibold text-white">
          {session?.user?.name ?? "Pengguna"}
        </p>
        <p className="truncate text-xs text-slate-400">
          {session?.user?.email ?? "-"}
        </p>
        {isAdmin && <p className="mt-2 text-xs font-bold text-amber-100">Akses admin aktif</p>}
      </div>

      <nav className="mt-7 space-y-2">
        {menus.map((menu) => {
          const active = pathname === menu.href;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-cyan-300/12 text-cyan-100 ring-1 ring-cyan-200/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/5 text-cyan-100">
                {menu.icon}
              </span>
              {menu.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="absolute bottom-5 left-5 right-5 rounded-2xl border border-red-300/15 bg-red-400/8 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/14"
      >
        Keluar
      </button>
    </aside>
  );
}
