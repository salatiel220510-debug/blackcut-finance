"use client";
import { useEffect, useState, useId } from "react";

export default function LeitorCodigoBarras({
  onLido,
  onFechar,
}: {
  onLido: (codigo: string) => void;
  onFechar: () => void;
}) {
  const containerId = useId().replace(/:/g, "");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let scanner: any = null;
    let cancelado = false;

    import("html5-qrcode")
      .then(({ Html5QrcodeScanner }) => {
        if (cancelado) return;
        scanner = new Html5QrcodeScanner(
          containerId,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );
        scanner.render(
          (decodedText: string) => {
            onLido(decodedText);
            scanner.clear().catch(() => {});
          },
          () => {}
        );
        setCarregando(false);
      })
      .catch(() => setErro("Não foi possível acessar a câmera. Verifique as permissões do navegador."));

    return () => {
      cancelado = true;
      if (scanner) scanner.clear().catch(() => {});
    };
  }, [containerId, onLido]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
      <div className="bg-black-soft border border-gold rounded-2xl p-4 max-w-sm w-full">
        <h3 className="font-display text-lg text-gold text-center mb-3">Aponte para o código de barras</h3>
        {carregando && !erro && <p className="text-gray-400 text-sm text-center mb-2">Abrindo câmera...</p>}
        {erro && <p className="text-red-400 text-sm text-center mb-2">{erro}</p>}
        <div id={containerId} className="rounded-lg overflow-hidden" />
        <button onClick={onFechar} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-3">
          Cancelar
        </button>
      </div>
    </div>
  );
}