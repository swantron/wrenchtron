// Tells us when someone uses the fleet demo, with no cookies or third-party script:
// each event is a request for a 1-byte file, and Firebase Hosting's request log
// (Cloud Logging) records the URL. `scripts/demo-visits.sh` reads it back.
//
// Add ?r=<name> to a link you send (e.g. /demo/fleet?r=owner) to tell visitors apart.

const REF_KEY = "wrenchtronRef";

function ref(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("r");
  try {
    if (fromUrl) sessionStorage.setItem(REF_KEY, fromUrl);
    return fromUrl ?? sessionStorage.getItem(REF_KEY);
  } catch {
    return fromUrl;
  }
}

export function track(event: string, detail?: string): void {
  if (typeof window === "undefined" || window.location.hostname !== "wrenchtron.com") return;
  const query = new URLSearchParams({ e: event });
  if (detail) query.set("d", detail);
  const r = ref();
  if (r) query.set("r", r);
  fetch(`/hit.txt?${query}`, { cache: "no-store", keepalive: true }).catch(() => {});
}
