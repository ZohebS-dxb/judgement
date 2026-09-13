import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const suits = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" };
const root = join(process.cwd(), "public");
const cardDir = join(root, "cards-minimal");
const suitDir = join(root, "suit-icons");
mkdirSync(cardDir, { recursive: true });
mkdirSync(suitDir, { recursive: true });

for (const [suit, symbol] of Object.entries(suits)) {
  const color = suit === "hearts" || suit === "diamonds" ? "#c82932" : "#101716";
  writeFileSync(join(suitDir, `${suit}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="34" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="900" text-anchor="middle" dominant-baseline="middle">${symbol}</text></svg>`);
  for (const rank of ranks) {
    const rankSize = rank === "10" ? 52 : 60;
    writeFileSync(join(cardDir, `${rank}-${suit}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" role="img" aria-label="${rank} of ${suit}"><rect x="1" y="1" width="98" height="138" rx="10" fill="#fff" stroke="#c8c8c8" stroke-width="2"/><g fill="${color}" font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900" text-anchor="middle" dominant-baseline="middle"><text x="50" y="38" font-size="${rankSize}" letter-spacing="-3">${rank}</text><text x="50" y="101" font-size="62">${symbol}</text></g></svg>`);
  }
}

console.log("Generated 52 minimal cards and 4 suit icons.");
