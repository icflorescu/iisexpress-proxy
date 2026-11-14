#!/usr/bin/env node

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { createProxyServer } = require('http-proxy-3');
const parseArgs = require('minimist');
const pkg = require('./package.json');
const { getTempSSLCert } = require('./generate-cert');

const usage = function () {
  const bin = Object.keys(pkg.bin)[0];
  console.log('Usage:');
  console.log('\t%s <SOURCE_TO_PROXY> to <PROXY_ENDPOINT> [--cert=<path> --key=<path>]', bin);
  console.log(
    '\tBoth arguments can be port number, or address with port number with optional protocol'
  );
  console.log('\tIf no address is specified in SOURCE_TO_PROXY, it defaults to localhost.');
  console.log(
    '\tIf no address is specified for PROXY_ENDPOINT or it\'s "*", it will listen on all network interfaces'
  );
  console.log('\tIf you specify the address for PROXY_ENDPOINT (and not just port), it must be');
  console.log('\tthe IP address of an existing network interface and cannot be a domain name.');
  console.log('\nUsage examples:');
  console.log('\t%s 51123 to 3000', bin);
  console.log('\t%s 192.168.0.100:51123 to 10.0.0.1:3000', bin);
  console.log('\t%s [http(s)://]domain.com:80 to 3000', bin);
  console.log('\t%s [https://]ssl-domain.com:443 to [https://]192.168.1.1:3000', bin);
  console.log();
  process.exit(1);
};

const urlRegExp = /^(https?:\/\/)?(.+?)(?::(\d+))$/;

const parseEndpoint = function (value, defaultHost) {
  const match = String(value).match(urlRegExp);
  if (match === null) {
    return { protocol: 'http://', host: defaultHost, port: parseInt(value, 10) };
  }
  return {
    protocol: match[1] || 'http://',
    host: match[2],
    port: parseInt(match[3], 10),
  };
};

const args = parseArgs(process.argv.slice(2), { string: ['cert', 'key'] });

console.log('IIS Express Proxy %s', pkg.version);

if (args._.length !== 3 || String(args._[1]).toLowerCase() !== 'to') {
  usage();
}

const source = parseEndpoint(args._[0], 'localhost');
const target = parseEndpoint(args._[2], '*');

if (isNaN(source.port) || isNaN(target.port)) {
  usage();
}

if ((args.cert || args.key) && target.protocol !== 'https://') {
  console.log('The --cert and --key options only apply to an https:// PROXY_ENDPOINT.\n');
  usage();
}

let ssl;
if (target.protocol === 'https://') {
  if (args.cert && args.key) {
    const certPath = path.resolve(args.cert);
    const keyPath = path.resolve(args.key);
    console.log('Reading certificate from: %s', certPath);
    console.log('Reading certificate key from: %s', keyPath);
    ssl = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  } else {
    if (args.cert || args.key) {
      console.log('Both --cert and --key are required, falling back to a self-signed certificate.');
    }
    ssl = getTempSSLCert();
  }
}

const proxy = createProxyServer({
  target: source.protocol + source.host + ':' + source.port,
  secure: false,
  changeOrigin: true,
  xfwd: true,
  autoRewrite: true,
  ws: true,
});

proxy.on('error', function (err, req, res) {
  const message = err.message || err.code || String(err);
  console.log('Proxy error: %s', message);
  // `res` is a ServerResponse for HTTP requests and a Socket for WebSocket upgrades
  if (res && typeof res.writeHead === 'function') {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end('Bad gateway: ' + message);
  } else if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

const handler = function (req, res) {
  proxy.web(req, res);
};
const server = ssl ? https.createServer(ssl, handler) : http.createServer(handler);

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});

server.on('error', function (err) {
  console.log('Server error: %s', err.message);
  process.exit(1);
});

console.log('Proxying %s%s:%d to network interfaces:', source.protocol, source.host, source.port);

const interfaces = os.networkInterfaces();
Object.keys(interfaces).forEach(function (name) {
  interfaces[name]
    .filter(function (item) {
      return (
        item.family === 'IPv4' &&
        !item.internal &&
        (target.host === item.address || target.host === '*')
      );
    })
    .forEach(function (item) {
      console.log('\t%s: %s%s:%s', name, target.protocol, item.address, target.port);
    });
});

server.listen(target.port, target.host === '*' ? '0.0.0.0' : target.host, function () {
  console.log('Listening... [press Control-C to exit]');
});
