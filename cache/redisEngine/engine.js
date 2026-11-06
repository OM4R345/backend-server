"use strict";
/**
 * redisEngine.js — fake ioredis, built on plain JS Maps.
 *
 * Built it becuase avaliable ram's laptob is not enough to download real redis engine.
 * if you have real redis engine; remove this file and edit require line in cache/settions
 *
 * Usage (same lines work with the real library):
 *   const Redis = require(process.env.REDIS_DRIVER); // "./redisEngine" or "ioredis"
 *   const redis = new Redis(process.env.REDIS_URL);
 */
const { EventEmitter } = require("events");

const configuredMax = Number(process.env.FAKE_REDIS_MAX_KEYS);
const MAX_KEYS =
  Number.isSafeInteger(configuredMax) && configuredMax > 0
    ? configuredMax
    : 10000;
const SWEEP_MS = 1000;
const WRONGTYPE =
  "WRONGTYPE Operation against a key holding the wrong kind of value";
const NOT_INT = "ERR value is not an integer or out of range";

/* ───────────── options parsing (all ioredis call shapes) ───────────── */

const defaults = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  username: undefined,
  password: undefined,
  path: undefined,
  lazyConnect: false,
};

function parseOptions(args) {
  const options = { ...defaults };
  for (const arg of args) {
    if (typeof arg === "number") {
      options.port = arg;
    } else if (typeof arg === "string") {
      if (arg.startsWith("redis://") || arg.startsWith("rediss://")) {
        const u = new URL(arg); // throws on an invalid url
        options.host = u.hostname;
        if (u.port) options.port = Number(u.port);
        if (u.username) options.username = decodeURIComponent(u.username);
        if (u.password) options.password = decodeURIComponent(u.password);
        if (u.pathname.length > 1) options.db = Number(u.pathname.slice(1));
      } else if (arg.startsWith("/")) {
        options.path = arg;
      } else if (/^\d+$/.test(arg)) {
        options.port = Number(arg);
      } else {
        options.host = arg;
      }
    } else if (typeof arg === "object" && arg !== null) {
      Object.assign(options, arg);
    }
  }
  return options;
}

/* ───────────── "server": data lives here, shared by all clients ───────────── */

const servers = new Map(); // "host:port" → { dbs, clients, timer }

function getServer(o) {
  const host = o.host === "localhost" ? "127.0.0.1" : o.host;
  const id = o.path || `${host}:${o.port}`;
  let s = servers.get(id);
  if (!s) {
    s = { dbs: new Map(), clients: 0, timer: null };
    servers.set(id, s);
  }
  return s;
}

function sweep(server) {
  const now = Date.now();
  for (const db of server.dbs.values()) {
    for (const [k, e] of db) {
      if (e.expiresAt !== undefined && e.expiresAt <= now) db.delete(k);
    }
  }
}

/* ───────────── helpers ───────────── */

const flat = (args) => args.flat(Infinity);
const arity = (name) =>
  new Error(`ERR wrong number of arguments for '${name}' command`);

function toInt(v) {
  const s = String(v);
  if (!/^-?\d+$/.test(s)) throw new Error(NOT_INT);
  const n = Number(s);
  if (!Number.isSafeInteger(n)) throw new Error(NOT_INT);
  return n;
}

// Returns a live entry (lazy expiry) and refreshes its LRU position.
function live(db, key) {
  const e = db.get(key);
  if (e === undefined) return undefined;
  if (e.expiresAt !== undefined && e.expiresAt <= Date.now()) {
    db.delete(key);
    return undefined;
  }
  db.delete(key);
  db.set(key, e);
  return e;
}

function typed(db, key, type) {
  const e = live(db, key);
  if (e && e.type !== type) throw new Error(WRONGTYPE);
  return e;
}

// Writes an entry; evicts the least recently used keys above MAX_KEYS.
function store(db, key, entry) {
  db.delete(key);
  db.set(key, entry);
  while (db.size > MAX_KEYS) db.delete(db.keys().next().value);
}

function dropIfEmpty(db, key, e) {
  if (e.value.size === 0) db.delete(key);
}

function globToRegex(pattern) {
  let re = "";
  for (const ch of pattern) {
    if (ch === "*") re += ".*";
    else if (ch === "?") re += ".";
    else if (ch === "[" || ch === "]") re += ch;
    else re += ch.replace(/[.+^${}()|\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "s");
}

function pairsFrom(rest, name) {
  let pairs = rest;
  if (rest.length === 1 && rest[0] instanceof Map) pairs = [...rest[0]].flat();
  else if (rest.length === 1 && typeof rest[0] === "object" && rest[0] !== null)
    pairs = Object.entries(rest[0]).flat();
  if (pairs.length === 0 || pairs.length % 2) throw arity(name);
  return pairs;
}

/* ───────────── commands: (db, ...args) → result ───────────── */

const commands = {
  /* ---- strings ---- */
  set(db, key, value, ...opts) {
    if (value === undefined) throw arity("set");
    let ttlAt;
    let nx = false,
      xx = false,
      keep = false,
      wantOld = false;
    for (let i = 0; i < opts.length; i++) {
      const o = String(opts[i]).toUpperCase();
      if (o === "EX" || o === "PX" || o === "EXAT" || o === "PXAT") {
        const n = toInt(opts[++i]);
        if (n <= 0) throw new Error("ERR invalid expire time in 'set' command");
        if (o === "EX") ttlAt = Date.now() + n * 1000;
        else if (o === "PX") ttlAt = Date.now() + n;
        else if (o === "EXAT") ttlAt = n * 1000;
        else ttlAt = n;
      } else if (o === "NX") nx = true;
      else if (o === "XX") xx = true;
      else if (o === "KEEPTTL") keep = true;
      else if (o === "GET") wantOld = true;
      else throw new Error("ERR syntax error");
    }
    const existing = live(db, key);
    let old = null;
    if (wantOld && existing) {
      if (existing.type !== "string") throw new Error(WRONGTYPE);
      old = existing.value;
    }
    if ((nx && existing) || (xx && !existing)) return wantOld ? old : null;
    const expiresAt =
      ttlAt ?? (keep && existing ? existing.expiresAt : undefined);
    store(db, key, { type: "string", value: String(value), expiresAt });
    return wantOld ? old : "OK";
  },
  get(db, key) {
    const e = typed(db, key, "string");
    return e ? e.value : null;
  },
  setex(db, key, sec, value) {
    return commands.set(db, key, value, "EX", sec);
  },
  psetex(db, key, ms, value) {
    return commands.set(db, key, value, "PX", ms);
  },
  setnx(db, key, value) {
    return commands.set(db, key, value, "NX") === "OK" ? 1 : 0;
  },
  getdel(db, key) {
    const e = typed(db, key, "string");
    if (!e) return null;
    db.delete(key);
    return e.value;
  },
  mget(db, ...keys) {
    keys = flat(keys);
    if (!keys.length) throw arity("mget");
    return keys.map((k) => {
      const e = live(db, String(k));
      return e && e.type === "string" ? e.value : null;
    });
  },
  mset(db, ...rest) {
    const pairs = pairsFrom(rest, "mset");
    for (let i = 0; i < pairs.length; i += 2) {
      store(db, String(pairs[i]), {
        type: "string",
        value: String(pairs[i + 1]),
        expiresAt: undefined,
      });
    }
    return "OK";
  },
  incrby(db, key, n) {
    const e = typed(db, key, "string");
    const next = (e ? toInt(e.value) : 0) + toInt(n);
    if (!Number.isSafeInteger(next)) throw new Error(NOT_INT);
    store(db, key, {
      type: "string",
      value: String(next),
      expiresAt: e?.expiresAt,
    });
    return next;
  },
  incr(db, key) {
    return commands.incrby(db, key, 1);
  },
  decr(db, key) {
    return commands.incrby(db, key, -1);
  },
  decrby(db, key, n) {
    return commands.incrby(db, key, -toInt(n));
  },

  /* ---- keys / ttl ---- */
  del(db, ...keys) {
    keys = flat(keys);
    if (!keys.length) throw arity("del");
    let n = 0;
    for (const k of keys) {
      if (live(db, String(k)) !== undefined) {
        db.delete(String(k));
        n++;
      }
    }
    return n;
  },
  exists(db, ...keys) {
    keys = flat(keys);
    if (!keys.length) throw arity("exists");
    let n = 0;
    for (const k of keys) if (live(db, String(k)) !== undefined) n++;
    return n;
  },
  pexpire(db, key, ms) {
    const e = live(db, key);
    if (!e) return 0;
    const n = toInt(ms);
    if (n <= 0) db.delete(key);
    else e.expiresAt = Date.now() + n;
    return 1;
  },
  expire(db, key, sec) {
    return commands.pexpire(db, key, toInt(sec) * 1000);
  },
  pttl(db, key) {
    const e = live(db, key);
    if (!e) return -2;
    if (e.expiresAt === undefined) return -1;
    return Math.max(0, e.expiresAt - Date.now());
  },
  ttl(db, key) {
    const ms = commands.pttl(db, key);
    return ms < 0 ? ms : Math.round(ms / 1000);
  },
  persist(db, key) {
    const e = live(db, key);
    if (!e || e.expiresAt === undefined) return 0;
    e.expiresAt = undefined;
    return 1;
  },
  type(db, key) {
    const e = live(db, key);
    return e ? e.type : "none";
  },
  keys(db, pattern) {
    const re = globToRegex(String(pattern));
    const out = [];
    for (const k of [...db.keys()]) {
      if (re.test(k) && live(db, k) !== undefined) out.push(k);
    }
    return out;
  },
  dbsize(db) {
    return commands.keys(db, "*").length;
  },
  flushdb(db) {
    db.clear();
    return "OK";
  },
  flushall(db, ...rest) {
    // `this` is the client (see _dispatch): FLUSHALL clears every db
    for (const d of this._server.dbs.values()) d.clear();
    return "OK";
  },
  ping(db, ...rest) {
    return rest.length ? String(rest[0]) : "PONG";
  },

  /* ---- hashes ---- */
  hset(db, key, ...rest) {
    const pairs = pairsFrom(rest, "hset");
    let e = typed(db, key, "hash");
    if (!e) e = { type: "hash", value: new Map(), expiresAt: undefined };
    let added = 0;
    for (let i = 0; i < pairs.length; i += 2) {
      const f = String(pairs[i]);
      if (!e.value.has(f)) added++;
      e.value.set(f, String(pairs[i + 1]));
    }
    store(db, key, e);
    return added;
  },
  hmset(db, key, ...rest) {
    commands.hset(db, key, ...rest);
    return "OK";
  },
  hget(db, key, field) {
    const e = typed(db, key, "hash");
    return e && e.value.has(String(field)) ? e.value.get(String(field)) : null;
  },
  hmget(db, key, ...fields) {
    const e = typed(db, key, "hash");
    return flat(fields).map((f) =>
      e && e.value.has(String(f)) ? e.value.get(String(f)) : null,
    );
  },
  hgetall(db, key) {
    const e = typed(db, key, "hash");
    return e ? Object.fromEntries(e.value) : {};
  },
  hdel(db, key, ...fields) {
    fields = flat(fields);
    if (!fields.length) throw arity("hdel");
    const e = typed(db, key, "hash");
    if (!e) return 0;
    let n = 0;
    for (const f of fields) if (e.value.delete(String(f))) n++;
    dropIfEmpty(db, key, e);
    return n;
  },
  hexists(db, key, field) {
    const e = typed(db, key, "hash");
    return e && e.value.has(String(field)) ? 1 : 0;
  },
  hlen(db, key) {
    const e = typed(db, key, "hash");
    return e ? e.value.size : 0;
  },
  hkeys(db, key) {
    const e = typed(db, key, "hash");
    return e ? [...e.value.keys()] : [];
  },
  hvals(db, key) {
    const e = typed(db, key, "hash");
    return e ? [...e.value.values()] : [];
  },
  hincrby(db, key, field, n) {
    let e = typed(db, key, "hash");
    if (!e) e = { type: "hash", value: new Map(), expiresAt: undefined };
    const f = String(field);
    const next = (e.value.has(f) ? toInt(e.value.get(f)) : 0) + toInt(n);
    e.value.set(f, String(next));
    store(db, key, e);
    return next;
  },

  /* ---- sets ---- */
  sadd(db, key, ...members) {
    members = flat(members);
    if (!members.length) throw arity("sadd");
    let e = typed(db, key, "set");
    if (!e) e = { type: "set", value: new Set(), expiresAt: undefined };
    let added = 0;
    for (const m of members) {
      if (!e.value.has(String(m))) {
        e.value.add(String(m));
        added++;
      }
    }
    store(db, key, e);
    return added;
  },
  srem(db, key, ...members) {
    members = flat(members);
    if (!members.length) throw arity("srem");
    const e = typed(db, key, "set");
    if (!e) return 0;
    let n = 0;
    for (const m of members) if (e.value.delete(String(m))) n++;
    dropIfEmpty(db, key, e);
    return n;
  },
  sismember(db, key, member) {
    const e = typed(db, key, "set");
    return e && e.value.has(String(member)) ? 1 : 0;
  },
  smembers(db, key) {
    const e = typed(db, key, "set");
    return e ? [...e.value] : [];
  },
  scard(db, key) {
    const e = typed(db, key, "set");
    return e ? e.value.size : 0;
  },
};

// Commands whose first argument is not a key.
const NO_KEY = new Set([
  "del",
  "exists",
  "mget",
  "mset",
  "keys",
  "dbsize",
  "flushdb",
  "flushall",
  "ping",
]);

/* ───────────── the client ───────────── */

class Redis extends EventEmitter {
  constructor(...args) {
    super();
    this.options = parseOptions(args);
    this.status = this.options.lazyConnect ? "wait" : "connecting";
    this._server = getServer(this.options);
    this._queue = [];
    this._registered = false;

    if (!this.options.lazyConnect) {
      // async so the caller can attach .on("ready") right after `new`
      setImmediate(() => {
        if (this.status === "connecting") this._connect(); // not closed meanwhile
      });
    }
  }

  _db() {
    const idx = Number(this.options.db) || 0;
    let db = this._server.dbs.get(idx);
    if (!db) {
      db = new Map();
      this._server.dbs.set(idx, db);
    }
    return db;
  }

  _connect() {
    this.status = "connecting";
    setTimeout(() => {
      if (this.status !== "connecting") return; // closed meanwhile
      this.status = "connect";
      this.emit("connect");
      if (this.status !== "connect") return; // a listener closed the client
      this.status = "ready";

      const s = this._server;
      s.clients++;
      this._registered = true;
      if (!s.timer) {
        s.timer = setInterval(() => sweep(s), SWEEP_MS);
        s.timer.unref();
      }

      this.emit("ready");
      const queued = this._queue;
      this._queue = [];
      for (const job of queued) job.run();
    }, 5);
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.status !== "wait" && this.status !== "end") {
        return reject(new Error("Redis is already connecting/connected"));
      }
      this.once("ready", () => resolve());
      this._connect();
    });
  }

  _close() {
    if (this.status === "end") return;
    if (this._registered) {
      const s = this._server;
      s.clients--;
      this._registered = false;
      if (s.clients <= 0 && s.timer) {
        clearInterval(s.timer);
        s.timer = null;
      }
    }
    this.status = "close";
    this.emit("close");
    this.status = "end";
    this.emit("end");
    const queued = this._queue;
    this._queue = [];
    for (const job of queued) job.reject(new Error("Connection is closed."));
  }

  async quit() {
    this._close();
    return "OK";
  }

  disconnect() {
    this._close();
  }

  duplicate(override = {}) {
    return new Redis({ ...this.options, ...override });
  }

  _dispatch(name, args) {
    let cb;
    if (typeof args[args.length - 1] === "function") cb = args.pop();

    const promise = new Promise((resolve, reject) => {
      const fn = commands[name];
      if (!NO_KEY.has(name)) {
        if (args[0] === undefined || args[0] === null) {
          return reject(arity(name));
        }
        args[0] = String(args[0]);
      }
      if (args.length < fn.length - 1) return reject(arity(name));

      const run = () => {
        try {
          resolve(fn.call(this, this._db(), ...args));
        } catch (err) {
          reject(err);
        }
      };

      if (this.status === "ready") return run();
      if (this.status === "end" || this.status === "close") {
        return reject(new Error("Connection is closed."));
      }
      this._queue.push({ run, reject }); // offline queue
      if (this.status === "wait") this._connect(); // lazyConnect: first command connects
    });

    if (cb)
      promise.then(
        (r) => cb(null, r),
        (e) => cb(e),
      );
    return promise;
  }
}

for (const name of Object.keys(commands)) {
  Redis.prototype[name] = function (...args) {
    return this._dispatch(name, args);
  };
}

module.exports = Redis;
module.exports.default = Redis;
module.exports.Redis = Redis;
