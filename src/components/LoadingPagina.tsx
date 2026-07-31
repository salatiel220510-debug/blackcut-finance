import TesouraAnimada from "./TesouraAnimada";

export default function LoadingPagina({ mensagem }: { mensagem: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black-deep flex flex-col items-center justify-center gap-4 animate-fade-in">
      <TesouraAnimada size={56} />
      <p className="font-display text-lg text-gold tracking-wide animate-brilho-dourado text-center px-6">
        {mensagem}
      </p>
    </div>
  );
}