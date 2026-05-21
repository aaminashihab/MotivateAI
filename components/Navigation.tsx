"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: "🏠" },
    { label: "Profile", href: "/profile", icon: "🧠" },
    { label: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-t border-[rgba(255,255,255,0.1)] pb-safe">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <li key={item.href} className="flex-1">
              <Link 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] space-y-1 ${
                  pathname === item.href ? 'text-accent' : 'text-slate-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Desktop Header Navigation (optional, just filling the need for structure) */}
      <nav className="hidden md:flex fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] h-16 items-center px-8 justify-between">
         <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">
            MotivateAI
         </div>
         <ul className="flex gap-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`flex items-center gap-2 min-h-[48px] px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href ? 'bg-accent/20 text-accent' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
