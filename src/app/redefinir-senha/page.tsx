import FooterEstatico from "@/components/FooterEstatico";
import FormRedefinirSenha from "./form";

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="backdrop-blur-xl bg-white/[0.04] border border-gold/20 rounded-3xl shadow-2xl shadow-black/60 px-7 py-9">
            <h1 className="font-display text-2xl text-gold text-center mb-6">Nova Senha</h1>
            {!token ? (
              <p className="text-red-400 text-sm text-center">Link inválido — falta o token de redefinição.</p>
            ) : (
              <FormRedefinirSenha token={token} />
            )}
          </div>
        </div>
      </main>
      <FooterEstatico />
    </div>
  );
}