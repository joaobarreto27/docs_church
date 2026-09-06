import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-church-parchment px-4">
      {/* Logotipo Oficial Horizontal */}
      <div className="mb-8 w-64 sm:w-80 transition-transform duration-300">
        <img 
          src="/assets/logo-adutinga-horizontal.png" 
          alt="A.D. Utinga - Parque Novo Oratório" 
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Indicador de carregamento suave */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-12 h-12 rounded-full border-2 border-church-gold/20 border-t-church-gold animate-spin" />
        <div className="absolute w-3 h-3 rounded-full bg-church-gold/60 pulse-status" />
      </div>

      {/* Mensagem oficial de Cold Start */}
      <p className="font-serif italic text-lg sm:text-xl text-church-charcoal/90 text-center tracking-wide">
        Conectando à igreja... Por favor aguarde uns segundos
      </p>
      
      <p className="font-sans text-xs text-church-muted mt-2 uppercase tracking-widest font-medium">
        Carregando liturgia do culto
      </p>
    </div>
  );
};
