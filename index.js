#!/usr/bin/env node

var fs = require('fs'),
    os = require('os'),
    path = require('path'),
    httpProxy = require('http-proxy'),
    parseArgs = require('minimist'),
    pkg = require('./package'),
    { getTempSSLCert } = require('./generate-cert');

var exit = function() {
  var bin = Object.keys(pkg.bin)[0];
  console.log('Usage:');
  console.log('\t%s <SOURCE_TO_PROXY> to <PROXY_ENDPOINT>', bin);
  console.log('\tBoth arguments can be port number, or address with port number with optional protocol');
  console.log('\tIf no address is specified in SOURCE_TO_PROXY, it defaults to localhost.');
  console.log('\tIf no address is specified for PROXY_ENDPOINT or it\'s "*", it will listen on all network interfaces');
  console.log('\tIf you specify the address for PROXY_ENDPOINT (and not just port), it must be');
  console.log('\tthe IP address of an existing network interface and cannot be a domain name.');
  console.log('\nUsage examples:');
  console.log('\t%s 51123 to 3000', bin);
  console.log('\t%s 192.168.0.100:51123 to 10.0.0.1:3000', bin);
  console.log('\t%s [http(s)://]domain.com:80 to 3000', bin);
  console.log('\t%s [https://]ssl-domain.com:443 to [https://]192.168.1.1:3000', bin);
  console.log();
  process.exit();
};

var args = parseArgs(process.argv);

console.log('IIS Express Proxy %s', pkg.version);

if (args._.length != 5 || args._[3].toLowerCase() !== 'to') {
  exit();
}

var urlRegExp = /^(https?:\/\/)?(.+?)(?:\:(\d+))$/;
var sourceMatch = args._[2].match(urlRegExp);
var targetMatch = args._[4].match(urlRegExp);

var source = {
  protocol: 'http://',
  host: 'localhost',
  port: 58106,
};
var target = {
  protocol: 'http://',
  host: '*',
  port: 8080,
};

if (sourceMatch === null) {
  source.port = parseInt(args._[2], 10);
} else {
  source.protocol = sourceMatch[1] || 'http://';
  source.host = sourceMatch[2];
  source.port = parseInt(sourceMatch[3], 10);
}
if (targetMatch === null) {
  target.port = parseInt(args._[4], 10);
} else {
  target.protocol = targetMatch[1] || 'http://';
  target.host = targetMatch[2];
  target.port = parseInt(targetMatch[3], 10);
}

if (isNaN(source.port) || isNaN(target.port)) {
  exit();
}

console.log('Proxying %s%s:%d to network interfaces:', source.protocol, source.host, source.port);

var interfaces = os.networkInterfaces();

Object.keys(interfaces).forEach(function(name) {
  interfaces[name].filter(function(item) {
    return item.family == 'IPv4' && !item.internal && (target.host == item.address || target.host === '*');
  }).forEach(function(item) {
    console.log("\t%s: %s%s:%s", name, target.protocol, item.address, target.port);
  });
});

var ssl = undefined;
if (target.protocol === 'https://') {
  ssl = getTempSSLCert();
}
if(args.cert) {
  var certPath = path.resolve(args.cert);
  console.log('Reading certificate from: %s', certPath);
  ssl.cert = fs.readFileSync(certPath);
}
if(args.key) {
  var keyPath = path.resolve(args.key);
  console.log('Reading certificate key from: %s', keyPath);
  ssl.key = fs.readFileSync(keyPath);
}

var proxy = new httpProxy.createProxyServer({
  target: source.protocol + source.host + ':' + source.port,
  secure: false,
  changeOrigin: true,
  xfwd: true,
  autoRewrite: true,
  ws: true,
  ssl,
}).on('error', function (err) {
  console.log(err);
}).listen(target.port, target.host === '*' ? '0.0.0.0' : target.host);

console.log('Listening... [press Control-C to exit]');
