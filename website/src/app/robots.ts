import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
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
      {
        userAgent: "Googlebot",
        allow: ["/", "/service-areas/", "/services/", "/categories/"],
        disallow: ["/dashboard/", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://www.repairseries.in/sitemap.xml",
    host: "https://www.repairseries.in",
  };
}
