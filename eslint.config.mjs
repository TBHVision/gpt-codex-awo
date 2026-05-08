import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "apps/**/.next/**",
    "node_modules/**",
    "apps/**/node_modules/**",
    "out/**",
    "apps/**/out/**",
    "build/**",
    "next-env.d.ts",
    "apps/**/next-env.d.ts",
  ]),
]);

export default eslintConfig;
