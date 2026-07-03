import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const source = path.resolve("public/icons/site-logger.svg");

for (const size of [192, 512]) {
  const destination = path.resolve(
    `public/icons/site-logger-${size}.png`,
  );
  await sharp(source).resize(size, size).png().toFile(destination);
}

await sharp(source).resize(64, 64).png().toFile(path.resolve("app/icon.png"));

await fs.access(path.resolve("public/icons/site-logger-192.png"));
await fs.access(path.resolve("public/icons/site-logger-512.png"));
await fs.access(path.resolve("app/icon.png"));
