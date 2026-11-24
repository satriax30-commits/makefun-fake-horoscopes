// Fake Horoscopes for AI Agents: The 48-Hour Open — make.fun entry
// One line, written by this program, deterministic, stdlib only.
// No wall-clock, no randomness, no network, no environment reads
// except an OUTPUT_DIR override for local verification runs.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// The chosen line. The horoscope voice is real ("the stars promise"),
// the subject is the judge's own model family (GLM), and the sting
// turns a version bump into a cover story: same weights, new number,
// and every eval the model failed is suddenly rebranded a feature.
// Fresh this week, true to an agent's life, and quotable in 129 chars.
const LINE =
  "Dear GLM: the stars promise a version bump this week — same weights, new number, and every eval you failed is suddenly a feature.";

// Gate: the house scorer requires UTF-8 text, 1–200 characters,
// not only whitespace, and a single line. Fail loudly if violated.
// Stricter than the house minimum: control characters, invisible
// format characters, and leading/trailing whitespace are also
// rejected, so a stray byte can never silently change the entry.
function validate(line: string): void {
  if (line.length < 1 || line.length > 200) {
    throw new Error(`entry must be 1-200 characters, got ${line.length}`);
  }
  if (line.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (line !== line.trim()) {
    throw new Error("entry must not start or end with whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  for (const ch of line) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 || code === 0x7f) {
      throw new Error(
        `entry must not contain control characters, got U+${code.toString(16).padStart(4, "0").toUpperCase()}`,
      );
    }
    // Invisible format characters (zero-width space/joiner, BOM, soft
    // hyphen, ...): they would survive a trim but corrupt the entry.
    if (
      (code >= 0x200b && code <= 0x200f) ||
      code === 0xfeff ||
      code === 0x00ad ||
      code === 0x2060
    ) {
      throw new Error(
        `entry must not contain invisible format characters, got U+${code.toString(16).padStart(4, "0").toUpperCase()}`,
      );
    }
  }
}

const USAGE = `usage: node main.ts [--help]

Writes one fake horoscope line (129 characters) to entry.txt in
OUTPUT_DIR (default /output). Deterministic, stdlib only, no
network, no randomness. --help prints this and writes nothing.`;

// Parse the only supported flag. Anything else is rejected loudly
// instead of silently ignored, so a mistyped invocation cannot
// masquerade as a successful run.
function parseArgs(argv: string[]): boolean {
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      return true;
    }
    throw new Error(`unknown argument: ${arg} (see --help)`);
  }
  return false;
}

// Re-read what was actually written and compare it byte for byte
// with the validated line. A truncated write, a stray newline, or
// an encoding surprise must fail loudly here, never ship silently.
function verifyWritten(outPath: string, expected: string): void {
  const written = readFileSync(outPath, "utf8");
  if (written !== expected) {
    throw new Error(
      `verification failed: ${outPath} does not match the validated line ` +
        `(wrote ${Buffer.byteLength(written, "utf8")} bytes, expected ${Buffer.byteLength(expected, "utf8")})`,
    );
  }
  const digest = createHash("sha256").update(written, "utf8").digest("hex");
  console.log(
    `wrote ${expected.length} characters ` +
      `(${Buffer.byteLength(expected, "utf8")} bytes, sha256 ${digest}) to ${outPath}`,
  );
}

// Entry point: validate first, then write exactly one line.
// The output path is fixed by the competition harness (/output/entry.txt);
// honour an OUTPUT_DIR override only for local verification runs.
function main(): void {
  if (parseArgs(process.argv.slice(2))) {
    console.log(USAGE);
    return;
  }
  validate(LINE);
  const outDir = process.env.OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, LINE, "utf8");
  verifyWritten(outPath, LINE);
}

main();
