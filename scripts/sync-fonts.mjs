#!/usr/bin/env node
// Copies the (gitignored, TRIAL-licensed) ABC ROM OTFs from fonts/ into the
// gitignored consumer directories: public/fonts/ (web) and
// ios/Resources/Fonts/ (iOS). Safe to run with fonts/ empty or missing.
// every consumer of these fonts already falls back to a system font.
import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(root, "fonts");
const targets = [join(root, "public", "fonts"), join(root, "ios", "Resources", "Fonts")];

function main() {
  if (!existsSync(sourceDir)) {
    console.log(
      "sync-fonts: fonts/ does not exist, nothing to sync. Drop the ABC ROM " +
        "TRIAL OTFs in fonts/ and re-run `npm run sync:fonts` to enable brand " +
        "typography. The app renders correctly with system fallbacks either way."
    );
    return;
  }

  const files = readdirSync(sourceDir).filter((name) => name.toLowerCase().endsWith(".otf"));

  if (files.length === 0) {
    console.log(
      "sync-fonts: fonts/ is empty, nothing to sync. Drop the ABC ROM TRIAL " +
        "OTFs in fonts/ and re-run `npm run sync:fonts` to enable brand " +
        "typography. The app renders correctly with system fallbacks either way."
    );
    return;
  }

  for (const target of targets) {
    mkdirSync(target, { recursive: true });
    for (const file of files) {
      copyFileSync(join(sourceDir, file), join(target, file));
    }
  }

  console.log(`sync-fonts: copied ${files.length} font(s) to:`);
  for (const target of targets) {
    console.log(`  - ${target}`);
  }
}

main();
