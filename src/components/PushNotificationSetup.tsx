"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<"idle" | "ativando" | "ativo" | "erro" | "suporte-ausente">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("suporte-ausente");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      if (sub) setStatus("ativo");
    });
  }, []);

  async function ativar() {
    setStatus("ativando");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setStatus("erro");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setStatus("ativo");
    } catch (e) {
      console.error(e);
      setStatus("erro");
    }
  }

  async function desativar() {
    setStatus("ativando");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setStatus("idle");
    } catch (e) {
      console.error(e);
      setStatus("erro");
    }
  }

  if (status === "suporte-ausente") {
    return <p className="text-sm text-gray-400">Seu navegador não suporta notificações push.</p>;
  }

  if (status === "ativo") {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-green-400">✓ Notificações ativadas neste dispositivo.</p>
        <button onClick={desativar} className="text-xs text-red-400 underline">
          Desativar
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={ativar}
        disabled={status === "ativando"}
        className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {status === "ativando" ? "Ativando..." : "Ativar Notificações Push"}
      </button>
      {status === "erro" && (
        <p className="text-red-400 text-sm mt-2">
          Não foi possível ativar. Verifique se a permissão de notificações não está bloqueada nas configurações do navegador.
        </p>
      )}
    </div>
  );
}