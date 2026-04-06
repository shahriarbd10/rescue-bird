import assert from "node:assert/strict";
import test from "node:test";
import { isValidLatLng, isValidLatitude, isValidLongitude } from "@/lib/validation";

test("latitude validation accepts valid range", () => {
  assert.equal(isValidLatitude(0), true);
  assert.equal(isValidLatitude(90), true);
  assert.equal(isValidLatitude(-90), true);
});

test("latitude validation rejects out of range", () => {
  assert.equal(isValidLatitude(90.0001), false);
  assert.equal(isValidLatitude(-90.0001), false);
});

test("longitude validation accepts valid range", () => {
  assert.equal(isValidLongitude(0), true);
  assert.equal(isValidLongitude(180), true);
  assert.equal(isValidLongitude(-180), true);
});

test("longitude validation rejects out of range", () => {
  assert.equal(isValidLongitude(180.0001), false);
  assert.equal(isValidLongitude(-180.0001), false);
});

test("lat/lng validation requires both to be valid", () => {
  assert.equal(isValidLatLng(23.8, 90.4), true);
  assert.equal(isValidLatLng(100, 90.4), false);
  assert.equal(isValidLatLng(23.8, -200), false);
});
