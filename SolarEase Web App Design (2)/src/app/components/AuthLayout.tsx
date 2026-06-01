import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  tagline: string;
}

export function AuthLayout({ children, imageSrc, tagline }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] bg-white p-6 lg:p-8">
          {children}
        </div>
      </div>

      <div className="flex-1 relative min-h-[300px] lg:min-h-screen">
        <img 
          src={imageSrc} 
          alt="Solar panels installation" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-emerald-500/55 flex items-center justify-center p-8">
          <div className="text-white text-center max-w-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20 shadow-sm">
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl mb-4 font-semibold">
              {tagline}
            </h2>
            <p className="text-lg opacity-90 max-w-lg mx-auto">
              La plateforme de dimensionnement solaire de confiance pour les professionnels.
              Simulez, dimensionnez et suivez vos projets en un seul endroit.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur">
                <p className="text-sm font-medium">Rapide</p>
                <p className="text-xs text-white/80 mt-1">Un parcours clair du devis au projet</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur">
                <p className="text-sm font-medium">Professionnel</p>
                <p className="text-xs text-white/80 mt-1">Une expérience plus moderne et rassurante</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur">
                <p className="text-sm font-medium">Centralisé</p>
                <p className="text-xs text-white/80 mt-1">Projets, documents et suivi au même endroit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
