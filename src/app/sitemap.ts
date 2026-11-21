import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const PAGES = ["", "/about", "/demo", "/demo/fleet", "/login"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: `https://wrenchtron.com${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
