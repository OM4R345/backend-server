// Run: node --test redisEngine.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Redis = require("./engine");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lazy = (...a) => new Redis({ lazyConnect: true }, ...a);

test("options parsing: all ioredis call shapes", () => {
  const o = (...a) => lazy(...a).options;
  assert.equal(o().port, 6379);
  assert.equal(o(6380).port, 6380);
  assert.deepEqual(
    [o(6379, "192.168.1.1").host, o(6379, "192.168.1.1").port],
    ["192.168.1.1", 6379],
  );
  assert.equal(o("/tmp/redis.sock").path, "/tmp/redis.sock");
  assert.equal(o({ port: 1234, host: "h", db: 3 }).db, 3);
  const u = o("redis://default:p%40ss@localhost:6380/2");
  assert.deepEqual(
    [u.username, u.password, u.port, u.db],
    ["default", "p@ss", 6380, 2],
  );
  assert.throws(() => new Redis("redis://bad url"));
});

test("lifecycle, events and offline queue", async () => {
  const r = new Redis("redis://localhost:6379");
  const ev = [];
  ["connect", "ready", "close", "end"].forEach((e) =>
    r.on(e, () => ev.push(e)),
  );
  assert.equal(r.status, "connecting");
  assert.equal(await r.set("a", 0), "OK"); // queued before ready
  assert.equal(r.status, "ready");
  await assert.rejects(r.connect(), /already/);
  assert.equal(await r.quit(), "OK");
  assert.equal(r.status, "end");
  await assert.rejects(r.get("a"), /closed/);
  assert.deepEqual(ev, ["connect", "ready", "close", "end"]);
});

test("lazyConnect connects on first command, data shared across clients", async () => {
  const a = new Redis();
  await a.set("shared", "1");
  const b = lazy();
  assert.equal(b.status, "wait");
  assert.equal(await b.get("shared"), "1");
  a.disconnect();
  b.disconnect();
});

test("strings, ttl, nx/xx, counters", async () => {
  const r = new Redis();
  assert.equal(await r.set("n", 0), "OK");
  assert.equal(await r.get("n"), "0");
  assert.equal(await r.get("missing"), null);
  assert.equal(await r.set("k", "v", "EX", 10), "OK");
  assert.equal(await r.ttl("k"), 10);
  assert.equal(await r.set("k", "v2", "NX"), null);
  assert.equal(await r.set("zz", "v", "XX"), null);
  assert.equal(await r.set("k", "v3", "KEEPTTL"), "OK");
  assert.ok((await r.ttl("k")) > 0);
  assert.equal(await r.persist("k"), 1);
  assert.equal(await r.ttl("k"), -1);
  assert.equal(await r.ttl("nope"), -2);
  assert.equal(await r.incr("c"), 1);
  assert.equal(await r.incrby("c", 5), 6);
  await r.set("txt", "abc");
  await assert.rejects(r.incr("txt"), /not an integer/);
  assert.equal(await r.exists("n", "k", "nope"), 2);
  assert.equal(await r.del(["n", "k"]), 2);
  await r.set("e", "1", "PX", 40);
  await sleep(70);
  assert.equal(await r.get("e"), null);
  r.disconnect();
});

test("hash, set, wrongtype, keys", async () => {
  const r = new Redis();
  assert.equal(await r.hset("h", { f: 1, g: 2 }), 2);
  assert.deepEqual(await r.hgetall("h"), { f: "1", g: "2" });
  assert.equal(await r.hdel("h", "f", "g"), 2);
  assert.equal(await r.exists("h"), 0); // empty hash is removed
  assert.equal(await r.sadd("s", "x", "y", "x"), 2);
  assert.equal(await r.sismember("s", "x"), 1);
  assert.equal(await r.srem("s", "x"), 1);
  await assert.rejects(r.get("s"), /WRONGTYPE/);
  await r.set("user:1", "a");
  await r.set("user:2", "b");
  assert.deepEqual((await r.keys("user:*")).sort(), ["user:1", "user:2"]);
  await assert.rejects(r.get(), /wrong number/);
  r.disconnect();
});

test("ping, flushall across dbs", async () => {
  const a = new Redis(),
    b = new Redis({ db: 1 });
  await a.set("x", 1);
  await b.set("y", 2);
  assert.equal(await a.ping(), "PONG");
  assert.equal(await a.ping("hi"), "hi");
  await a.flushall();
  assert.equal((await a.dbsize()) + (await b.dbsize()), 0);
  a.disconnect();
  b.disconnect();
});

test("close races", async () => {
  const c = new Redis();
  c.disconnect();
  const d = new Redis();
  d.on("connect", () => d.disconnect());
  await sleep(40);
  assert.equal(c.status, "end");
  assert.equal(d.status, "end");
});
