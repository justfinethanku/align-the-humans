import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    // React Compiler rules new in eslint-plugin-react-hooks 7. This app does
    // not use the compiler, so they stay off until that is a deliberate change.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
]);
