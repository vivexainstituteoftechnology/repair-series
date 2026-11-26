import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/api/",
        "/auth/",
        "/book/",
        "/dev/",
        "/delete-account/",
      ],
    },
    sitemap: "https://www.repairseries.in/sitemap.xml",
  };
}
