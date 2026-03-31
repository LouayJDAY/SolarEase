import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  tagline: string;
}

export function AuthLayout({ children, imageSrc, tagline }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Section - Left Side on Desktop, Top on Mobile */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Visual Section - Right Side on Desktop, Bottom on Mobile */}
      <div className="flex-1 relative min-h-[300px] lg:min-h-screen">
        <img 
          src={imageSrc} 
          alt="Solar panels installation" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3E50]/80 to-[#2ECC71]/60 flex items-center justify-center p-8">
          <div className="text-white text-center max-w-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-[#F39C12] rounded-full flex items-center justify-center">
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
            <p className="text-lg opacity-90">
              La plateforme de dimensionnement solaire de confiance pour les professionnels
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
