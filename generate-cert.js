// Generate a self-signed certificate, openssl has to be in PATH.

const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { execSync } = require('child_process');

exports.getTempSSLCert = function () {
  const tmpDir = os.tmpdir();
  const certPath = path.join(tmpDir, 'iisexpress-proxy-cert.pem');
  const csrPath = path.join(tmpDir, 'iisexpress-proxy-csr.pem');
  const keyPath = path.join(tmpDir, 'iisexpress-proxy-key.pem');
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    try {
      execSync(`openssl genrsa -out "${keyPath}"`, {});
      execSync(`openssl req -new -batch -key "${keyPath}" -out "${csrPath}"`);
      execSync(
        `openssl x509 -req -days 9999 -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}"`
      );
    } catch (err) {
      console.log(err + '\n');
      console.log(
        'Failed to generate SSL cert, make sure the "openssl" command is in PATH.\nIf you\'re on Windows, we recommend running iisexpress-proxy in Git Bash, which comes with openssl pre-installed.'
      );
      process.exit(1);
    }
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
};
