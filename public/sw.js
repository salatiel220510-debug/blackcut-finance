self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "BlackCut Finance", body: "Nova atividade no caixa." };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/home");
    })
  );
});