import Link from "next/link";
import { Logo } from "@/components/Logo";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100/10 bg-navy/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="/#pilar" className="hover:text-white">Fitur</a>
          <a href="/#metodologi" className="hover:text-white">Cara Kerja</a>
        </div>
        <Link href="/login" className="primary-button text-sm">
          Masuk Platform
        </Link>
      </nav>
    </header>
  );
}
