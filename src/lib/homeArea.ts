// Which side of the app a signed-in user lands on from "/" (and from the
// installed app, whose start_url is "/"): the household garage or a fleet.

export type HomeArea = "garage" | "fleet";

const KEY = "homeArea";

export const AREA_PATHS: Record<HomeArea, string> = { garage: "/vehicles", fleet: "/fleet" };

export function rememberArea(area: HomeArea) {
  try {
    localStorage.setItem(KEY, area);
  } catch {
    // Private mode — home falls back to checking fleet membership
  }
}

export function rememberedArea(): HomeArea | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "garage" || value === "fleet" ? value : null;
  } catch {
    return null;
  }
}
