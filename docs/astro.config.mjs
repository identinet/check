// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
import starlightLinksValidator from "starlight-links-validator";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "CHECK Docs",
      social: [{
        icon: "github",
        label: "GitHub",
        href: "https://github.com/identinet/check",
      }],
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
      },
      editLink: {
        baseUrl: "https://github.com/identinet/check/tree/main/docs/",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
        // Add the generated sidebar group to the sidebar.
        ...openAPISidebarGroups,
      ],
      plugins: [
        // Generate the OpenAPI documentation pages.
        // Documentation: https://starlight-openapi.vercel.app/configuration/
        starlightOpenAPI([
          {
            base: "api/vs",
            schema: "../services/verification-service/openapi.yaml",
            label: "Verification Service API",
            collapsed: false,
          },
          {
            base: "api/vds",
            schema: "../services/verifiable-data-service/openapi.yaml",
            label: "Verifiable Data Service API",
            collapsed: false,
          },
        ]),
        // Validate internal links
        // Ocumentation: https://starlight-links-validator.vercel.app/getting-started/
        starlightLinksValidator({
          exclude: ["/api"],
        }),
      ],
    }),
  ],
});
