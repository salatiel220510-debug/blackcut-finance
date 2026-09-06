export default function LoadingPagina({ mensagem }: { mensagem: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black-deep flex flex-col items-center justify-center gap-5 animate-fade-in">
      <div className="w-24 h-24 animate-spin" style={{ animationDuration: "1.2s" }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1C0D0F" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke="#C41E3A" strokeWidth="5" strokeLinecap="round"
            strokeDasharray="70 200"
            style={{ filter: "drop-shadow(0 0 6px rgba(196,30,58,0.9))" }}
          />
        </svg>
      </div>
      <p className="font-display text-base text-gold tracking-widest">
        carregando<span className="animate-pulso-suave">...</span>
      </p>
      <p className="text-gray-500 text-xs text-center px-6">{mensagem}</p>
    </div>
  );
}