// Generate a self-signed certificate, openssl has to be in PATH.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

exports.getTempSSLCert = function () {
  const tmpDir = os.tmpdir();
  const certPath = path.join(tmpDir, 'iisexpress-proxy-cert.pem');
  const keyPath = path.join(tmpDir, 'iisexpress-proxy-key.pem');
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    try {
      execFileSync(
        'openssl',
        [
          'req',
          '-x509',
          '-newkey',
          'rsa:2048',
          '-nodes',
          '-batch',
          '-days',
          '9999',
          '-keyout',
          keyPath,
          '-out',
          certPath,
        ],
        { stdio: 'ignore' }
      );
    } catch (err) {
      console.log(err.message + '\n');
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
