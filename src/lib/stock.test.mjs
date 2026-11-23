// Unit tests for src/lib/stock.ts (BUG-036). No test runner is installed, so these use
// Node's built-in one; Node 22.18+ loads the .ts module directly:
//   node --test src/lib/stock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { stockCeiling, isInStock } from "./stock.ts";

const tracked = (stock) => ({ stock, track_inventory: true });

test("stockCeiling: tracked stock figures from the BUG-036 table", () => {
  const cases = [
    [5, 5],
    ["5", 5],
    ["abc", 0],
    [-5, 0],
    [0, 0],
    ["0", 0],
    ["", 0],
  ];
  for (const [stock, expected] of cases) {
    // As the API sends it (track_inventory true) and with the flag left out.
    assert.equal(stockCeiling(tracked(stock)), expected, `track_inventory true, stock ${JSON.stringify(stock)}`);
    assert.equal(stockCeiling({ stock }), expected, `no track_inventory, stock ${JSON.stringify(stock)}`);
  }
});

test("stockCeiling: a missing variant (null/undefined) can't be ordered", () => {
  assert.equal(stockCeiling(null), 0);
  assert.equal(stockCeiling(undefined), 0);
  assert.equal(stockCeiling(), 0);
});

test("stockCeiling: other non-numeric stock is 0, never NaN", () => {
  for (const stock of ["5abc", " ", "NaN", NaN, {}, [1, 2], "Infinity", Infinity, -Infinity]) {
    assert.equal(stockCeiling(tracked(stock)), 0, `stock ${String(stock)}`);
  }
});

test("stockCeiling: always a finite, non-negative number for tracked stock", () => {
  const inputs = [5, "5", "abc", "5abc", -5, 0, "0", "", " ", "1e3", 2.5, NaN, Infinity, -Infinity, {}, [], true, false];
  for (const stock of inputs) {
    const max = stockCeiling(tracked(stock));
    assert.ok(Number.isFinite(max) && max >= 0, `stock ${String(stock)} gave ${max}`);
  }
});

test("stockCeiling: untracked stock still has no ceiling (unchanged)", () => {
  // track_inventory false, or no stock figure at all (SAGE sends both for unlisted stock).
  assert.equal(stockCeiling({ stock: null, track_inventory: false }), Infinity);
  assert.equal(stockCeiling({ stock: 7, track_inventory: false }), Infinity);
  assert.equal(stockCeiling({ stock: "abc", track_inventory: false }), Infinity);
  assert.equal(stockCeiling({ stock: null }), Infinity);
  assert.equal(stockCeiling({ stock: undefined }), Infinity);
  assert.equal(stockCeiling({}), Infinity);
});

test("stockCeiling never returns NaN, so the modal's quantity clamp never gets one", () => {
  const variants = [null, undefined, {}, ...[5, "5", "abc", "5abc", null, undefined, -5, 0, "0", "", NaN, {}].flatMap((stock) => [
    { stock },
    tracked(stock),
    { stock, track_inventory: false },
  ])];
  for (const v of variants) assert.ok(!Number.isNaN(stockCeiling(v)), JSON.stringify(v));
});

test("isInStock agrees with stockCeiling > 0 for every input, non-finite included", () => {
  const stocks = [5, "5", "abc", "5abc", null, undefined, -5, 0, "0", "", NaN, Infinity, -Infinity, "Infinity", "-Infinity", "1e999", 0.5];
  const variants = [null, undefined, {}, ...stocks.flatMap((stock) => [
    { stock },
    tracked(stock),
    { stock, track_inventory: false },
  ])];
  for (const v of variants) assert.equal(isInStock(v), stockCeiling(v) > 0, String(v?.stock) + " " + JSON.stringify(v));
});

test("isInStock: tracked Infinity, \"Infinity\" and \"1e999\" are not in stock (follow-up)", () => {
  // Before the follow-up these were "in stock" while stockCeiling said 0, so the add-colours
  // modal showed the row disabled but still added it to the order.
  for (const stock of [Infinity, "Infinity", "+Infinity", "1e999"]) {
    assert.equal(stockCeiling(tracked(stock)), 0, `ceiling for ${String(stock)}`);
    assert.equal(isInStock(tracked(stock)), false, `isInStock for ${String(stock)}`);
  }
});

test("isInStock: unchanged for finite and untracked stock", () => {
  const cases = [
    [tracked(5), true],
    [tracked("5"), true],
    [tracked(0.5), true],
    [tracked(0), false],
    [tracked("0"), false],
    [tracked(-5), false],
    [tracked(""), false],
    [tracked("abc"), false],
    [{ stock: null }, true],
    [{ stock: undefined }, true],
    [{}, true],
    [{ stock: null, track_inventory: false }, true],
    [{ stock: 0, track_inventory: false }, true],
    [null, false],
    [undefined, false],
  ];
  for (const [v, expected] of cases) assert.equal(isInStock(v), expected, JSON.stringify(v));
});

test("Pre-Made order-row size picker rule: sold out = !isInStock (follow-up)", () => {
  // Productcustomizationpage.tsx used `stock != null && Number(stock) <= 0`, which listed
  // "abc"/"Infinity" as available and an untracked variant with stock 0 as sold out.
  const soldOut = (v) => !isInStock(v);
  assert.equal(soldOut(tracked("abc")), true);
  assert.equal(soldOut(tracked("5abc")), true);
  assert.equal(soldOut(tracked("Infinity")), true);
  assert.equal(soldOut(tracked(0)), true);
  assert.equal(soldOut(tracked(-3)), true);
  assert.equal(soldOut(tracked(5)), false);
  assert.equal(soldOut(tracked("5")), false);
  assert.equal(soldOut({ stock: null, track_inventory: false }), false);
  assert.equal(soldOut({ stock: 0, track_inventory: false }), false);
});
