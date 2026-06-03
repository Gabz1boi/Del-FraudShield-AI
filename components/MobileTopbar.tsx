"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";

export function MobileTopbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const menus: Array<[string, string]> = [
    ["/dashboard", "Dashboard"],
    ["/checker", "Cek Link"],
    ["/analyzer", "Pesan"],
    ["/chatbot", "AI"],
    ["/report", "Rujukan"],
    ...(isAdmin ? ([ ["/admin", "Admin"], ["/trends", "Mapping"] ] as Array<[string, string]>) : [])
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-navy/90 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <Link href="/dashboard" className="secondary-button px-4 py-2 text-xs">
          Menu
        </Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs">
        {menus.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full bg-white/6 px-4 py-2 text-slate-200">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
