const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const cli = path.join(__dirname, '..', 'index.js');

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

// Starts the CLI and resolves once it reports it's listening.
const startProxy = (t, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args]);
    let output = '';
    const onData = (chunk) => {
      output += chunk;
      if (output.includes('Listening...')) resolve(child);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => reject(new Error(`proxy exited with ${code}:\n${output}`)));
    t.after(() => child.kill());
  });

const request = (mod, url, options = {}) =>
  new Promise((resolve, reject) => {
    mod
      .get(url, { rejectUnauthorized: false, ...options }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });

let backend;
let backendPort;

before(async () => {
  backendPort = await getFreePort();
  backend = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: req.url, headers: req.headers }));
  });
  backend.on('upgrade', (_req, socket) => {
    socket.end(
      'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n',
    );
  });
  await new Promise((resolve) => backend.listen(backendPort, '127.0.0.1', resolve));
});

after(() => backend.close());

test('proxies HTTP requests and sets forwarding headers', async (t) => {
  const port = await getFreePort();
  await startProxy(t, [`127.0.0.1:${backendPort}`, 'to', `127.0.0.1:${port}`]);

  const res = await request(http, `http://127.0.0.1:${port}/some/path?x=1`);
  assert.equal(res.status, 200);
  const echoed = JSON.parse(res.body);
  assert.equal(echoed.url, '/some/path?x=1');
  assert.equal(echoed.headers.host, `127.0.0.1:${backendPort}`);
  assert.equal(echoed.headers['x-forwarded-host'], `127.0.0.1:${port}`);
});

test('proxies WebSocket-style upgrade requests', async (t) => {
  const port = await getFreePort();
  await startProxy(t, [`127.0.0.1:${backendPort}`, 'to', `127.0.0.1:${port}`]);

  const status = await new Promise((resolve, reject) => {
    const req = http.request({
      port,
      host: '127.0.0.1',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket' },
    });
    req.on('upgrade', (res, socket) => {
      socket.destroy();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(status, 101);
});

test('responds with 502 when the source is unreachable', async (t) => {
  const deadPort = await getFreePort();
  const port = await getFreePort();
  await startProxy(t, [`127.0.0.1:${deadPort}`, 'to', `127.0.0.1:${port}`]);

  const res = await request(http, `http://127.0.0.1:${port}/`);
  assert.equal(res.status, 502);
});

test('serves HTTPS with a user-provided certificate', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iisexpress-proxy-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const cert = path.join(dir, 'cert.pem');
  const key = path.join(dir, 'key.pem');
  try {
    execFileSync(
      'openssl',
      ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-batch', '-days', '1'].concat([
        '-keyout',
        key,
        '-out',
        cert,
      ]),
      { stdio: 'ignore' },
    );
  } catch {
    t.skip('openssl is not available');
    return;
  }

  const port = await getFreePort();
  await startProxy(t, [
    `127.0.0.1:${backendPort}`,
    'to',
    `https://127.0.0.1:${port}`,
    `--cert=${cert}`,
    `--key=${key}`,
  ]);

  const res = await request(https, `https://127.0.0.1:${port}/secure`);
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(res.body).url, '/secure');
});

test('rejects --cert/--key for an HTTP endpoint instead of crashing', () => {
  assert.throws(
    () =>
      execFileSync(process.execPath, [cli, '1234', 'to', '1235', '--cert=x.pem'], {
        stdio: 'pipe',
      }),
    (err) => err.status === 1 && /only apply to an https/.test(err.stdout.toString()),
  );
});

test('prints usage and exits with an error on invalid arguments', () => {
  assert.throws(
    () => execFileSync(process.execPath, [cli, 'foo'], { stdio: 'pipe' }),
    (err) => err.status === 1 && /Usage:/.test(err.stdout.toString()),
  );
});
