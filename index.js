#!/usr/bin/env node

var os = require('os'),
    httpProxy = require('http-proxy'),
    pkg = require('./package'),
    { getTempSSLCert } = require('./generate-cert');

var exit = function() {
  var bin = Object.keys(pkg.bin)[0];
  console.log('Usage examples:');
  console.log('\t%s 51123 to 3000', bin);
  console.log('\t%s 192.168.0.100:51123 to 10.0.0.1:3000', bin);
  console.log('\t%s [http(s)://]domain.com:80 to 3000', bin);
  console.log('\t%s [https://]ssl-domain.com:443 to [https://]192.168.1.1:3000', bin);
  console.log();
  process.exit();
};

console.log('IIS Express Proxy %s', pkg.version);

if (process.argv.length != 5 || process.argv[3].toLowerCase() !== 'to') {
  exit();
}

var urlRegExp = /^(https?:\/\/)?(.+?)(?:\:(\d+))$/;
var sourceMatch = process.argv[2].match(urlRegExp);
var targetMatch = process.argv[4].match(urlRegExp);

var source = {
  protocol: 'http://',
  host: 'localhost',
  port: 58106,
}
var target = {
  protocol: 'http://',
  host: '*',
  port: 8080,
}

if (sourceMatch === null) {
  source.port = parseInt(process.argv[2], 10);
} else {
  source.protocol = sourceMatch[1] || 'http://';
  source.host = sourceMatch[2];
  source.port = parseInt(sourceMatch[3], 10);
}
if (targetMatch === null) {
  target.port = parseInt(process.argv[4], 10);
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
