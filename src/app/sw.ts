import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Let Firebase requests bypass the service worker entirely
const firebaseHostnames = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "www.googleapis.com",
];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    firebaseHostnames.includes(url.hostname) ||
    url.hostname.endsWith(".firebaseio.com")
  ) {
    return; // Don't handle — let the browser fetch normally
  }
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
