"use client";

import LogoutButton from "./LogoutButton";
import { ExternalLink } from "lucide-react";

export default function CatalogNavbar({
  user,
}: {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}) {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo y título de la empresa */}
          <div className="flex items-center gap-3">
            <a href="/catalog" className="flex items-center gap-3 group">
              <div className="bg-white p-1 rounded-md shadow-sm border border-slate-200 flex items-center justify-center">
                <img
                  src="/assets/images/logo.png"
                  alt="Logo GaLop S.R.L."
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg text-white leading-tight tracking-wide">
                  GaLop S.R.L.
                </span>
                <span className="text-[11px] sm:text-xs text-blue-400 font-medium">
                  ABM Catálogo de Productos
                </span>
              </div>
            </a>
          </div>

          {/* Acciones derecha: Ver tienda pública y Cerrar sesión */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
              title="Abrir catálogo público en una pestaña nueva"
            >
              <span>Ver Web Pública</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">
                {user?.name || "Administrador"}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sesión activa
              </span>
            </div>

            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
