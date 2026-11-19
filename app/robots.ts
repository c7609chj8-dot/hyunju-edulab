import type { MetadataRoute } from "next";
import { productionIndexing, siteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return productionIndexing
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
