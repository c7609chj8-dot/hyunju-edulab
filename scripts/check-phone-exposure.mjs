import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const expected = process.env.CONTACT_PHONE_NUMBER?.trim();
if (!expected) throw new Error("Set CONTACT_PHONE_NUMBER securely before scanning.");
const digits = expected.replace(/\D/g, "");
if (digits.length < 9) throw new Error("Invalid comparison value.");
const needles = [expected, digits];
const tracked = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).split("\0").filter(Boolean);
const files = new Set(tracked.filter(path => existsSync(path) && !path.startsWith(".env")));
function walk(path) {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name);
    if (entry.isDirectory()) walk(next);
    else if ([".js", ".html", ".rsc", ".body"].includes(extname(next))) files.add(next);
  }
}
walk(".next/static");
walk(".next/server/app");
const failures = [];
for (const path of files) {
  const value = readFileSync(path, "utf8");
  if (needles.some(needle => value.includes(needle))) failures.push(path);
}
if (failures.length) {
  console.error("Phone exposure detected in:", failures.join(", "));
  process.exitCode = 1;
} else console.log("No configured phone value found in current source or generated browser assets.");

