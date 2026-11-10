import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/account", "/dashboard", "/admin", "/style-guide", "/search"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...disallow, ...disallow.map((p) => `/ur${p}`)] }],
    sitemap: `${env().APP_URL}/sitemap.xml`,
  };
}
