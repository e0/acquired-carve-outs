import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  run: {
    tasks: {
      seed: { command: "tsx seed.ts", cache: false },
      update: { command: "tsx update.ts", cache: false },
      fix: { command: "tsx fix.ts", cache: false },
    },
  },
});
