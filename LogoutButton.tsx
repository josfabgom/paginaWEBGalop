"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-700/80 border border-rose-800/50 rounded-md transition-all shadow-sm cursor-pointer"
      title="Cerrar sesión"
    >
      <LogOut className="w-4 h-4" />
      <span>Cerrar sesión</span>
    </button>
  );
}
