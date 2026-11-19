import type { MetadataRoute } from "next";
import { siteLinks } from "./site-links";
import { programs } from "./programs";
import { materials } from "./materials/catalog";
import { portfolioCases } from "./portfolio/cases";
import { productionIndexing, siteUrl } from "./seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!productionIndexing) return [];
  const paths = [
    "/",
    ...siteLinks.filter(({ href }) => href !== "/contact").map(({ href }) => href),
    ...programs.map(({ slug }) => `/education/${slug}`),
    ...materials.map(({ slug }) => `/materials/${slug}`),
    ...portfolioCases.map(({ slug }) => `/portfolio/${slug}`),
  ];
  return paths.map((path) => ({ url: new URL(path, siteUrl).href }));
}
