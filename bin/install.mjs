#!/usr/bin/env node
import { install } from "../lib/installer.mjs";

install().catch((err) => {
  console.error("\x1b[31m✖\x1b[0m  Fatal:", err.message);
  process.exit(1);
});
