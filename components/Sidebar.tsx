"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { PlaySquare, LayoutGrid, SlidersHorizontal, LogOut, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/lip-sync", label: "Avatar LipSync", icon: PlaySquare },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export default function Sidebar({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();

  return (
    <aside className="bg-white border-r-[4px] border-black flex flex-col w-72 flex-shrink-0 relative z-20 shadow-[4px_0_0_0_rgba(0,0,0,1)]">
      <div className="p-8 border-b-[4px] border-black bg-primary">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white border-[3px] border-black rounded-full shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <Zap className="w-6 h-6 text-black fill-black" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-black uppercase tracking-wider">Avatar</h1>
            <p className="text-sm text-black font-bold truncate opacity-80">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-4 bg-white">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-4 px-5 py-4 rounded-xl text-base font-black uppercase tracking-wide transition-all duration-200 cursor-pointer border-[3px] ${
                isActive
                  ? "bg-accent text-black border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] -translate-y-1"
                  : "bg-white text-gray-700 border-transparent hover:border-black hover:bg-secondary hover:text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1"
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-black'}`} strokeWidth={2.5} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-3 h-3 rounded-full bg-black" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t-[4px] border-black bg-white">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-black uppercase tracking-wide text-gray-700 border-[3px] border-transparent hover:bg-destructive hover:text-black hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-6 h-6 text-gray-500 group-hover:text-black transition-transform group-hover:scale-110" strokeWidth={2.5} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
