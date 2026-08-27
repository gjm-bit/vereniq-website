import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("public pricing configuration contains no launch amounts", async () => {
  const source = await readFile(new URL("../src/config/pricing.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /24,95|44,95|99,95|lanceerprijs/i);
});
