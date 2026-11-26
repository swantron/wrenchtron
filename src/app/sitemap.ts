import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const PAGES = [
  "",
  "/about",
  "/demo",
  "/demo/fleet",
  "/van-fleet-maintenance",
  "/fleet-maintenance-log",
  "/van-damage-report",
  "/van-maintenance",
  "/van-maintenance/ford-transit",
  "/van-maintenance/ram-promaster",
  "/van-maintenance/mercedes-sprinter",
  "/van-maintenance/rivian-edv",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: `https://wrenchtron.com${path || "/"}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
