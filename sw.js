// Service Worker de "Tarjetas de contacto de emergencia".
// Objetivo: que la app (el shell — HTML, íconos) cargue aunque el celular
// no tenga internet en ese momento, mostrando la última versión guardada.
// Los datos en sí (Google Sheets) siempre se piden en vivo por separado;
// este archivo NO los cachea — de eso se encarga el propio index.html
// guardando la última copia buena en localStorage.

const CACHE_NAME = "tarjetas-emergencia-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // si algún ícono no existe todavía, no rompe la instalación
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo controlamos el propio sitio (GET). Todo lo demás (Google Sheets,
  // librerías externas como XLSX/Leaflet, etc.) pasa directo a la red,
  // sin pasar por este caché.
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin){
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
