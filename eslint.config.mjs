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
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
    "coverage/**"
  ]),
  {
    files: ["features/board/plugins/add-image-renderer.tsx"],
    rules: {
      "jsx-a11y/alt-text": "off",
    },
  },
  {
    files: ["features/board/plugins/image-component.tsx", "packages/ui/src/components/ui/image-viewer.tsx", "features/collaboration/components/collaborative-board.tsx", "packages/collaboration/src/components/cursor-overlay.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["features/board/plugins/scribble/scribble-renderer.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    files: ["packages/mermaid-to-thinkix/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    files: ["packages/ui/src/components/ui/dropdown-menu.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
