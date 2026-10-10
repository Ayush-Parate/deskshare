
const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../app");

// These tests exercise the app without a database connection.

test("GET /health returns UP", async () => {
  const res = await request(app).get("/health");
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.status, "UP");
});

test("GET /api advertises the API root", async () => {
  const res = await request(app).get("/api");
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.message, "DeskShare API is running");
});

test("unknown API route returns a JSON 404", async () => {
  const res = await request(app).get("/api/does-not-exist");
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test("protected route without a token returns 401", async () => {
  const res = await request(app).get("/api/auth/me");
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test("security headers are present", async () => {
  const res = await request(app).get("/health");
  assert.ok(res.headers["x-content-type-options"]);
  assert.ok(res.headers["x-frame-options"] || res.headers["content-security-policy"]);
});
