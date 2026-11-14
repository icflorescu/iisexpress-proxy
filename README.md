# iisexpress-proxy

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![CI][ci-image]][ci-url]
[![License][license-image]][license-url]
[![Stars][stars-image]][repo-url]
[![Contributors][contributors-image]][repo-url]
[![Last commit][last-commit-image]][repo-url]
[![Sponsor the author][sponsor-image]][sponsor-url]

![iisexpress-proxy](https://cloud.githubusercontent.com/assets/581999/13374338/4db36f40-dd8a-11e5-9248-a00a22e97eb0.png)

A simple, yet practical command-line utility enabling .NET developers to test web applications served by IIS Express on remote devices.

It works just as well with Kestrel (`dotnet run`) or any other development server that only listens on `localhost`.

## Motivation

Are you a .NET developer building mobile web applications?
Have you ever been frustrated by the fact that [there's no easy way](https://www.google.com/search?q=iis+express+remote+access) to enable IIS Express to accept connections from remote devices?...

If you've tried pointing a phone at your machine's IP address and got `HTTP Error 400. The request hostname is invalid.`, this tool is for you.

## Installation

You need [Node.js](https://nodejs.org/) **22 or newer**.

There's no need to install `iisexpress-proxy`; you can simply run it with `npx`:

```sh
npx iisexpress-proxy@latest localPort to proxyPort
```

If you use it often, you may prefer installing it as a global module:

```sh
npm install -g iisexpress-proxy
iisexpress-proxy localPort to proxyPort
```

The examples below assume a global install; if you're using `npx`, prefix them with `npx iisexpress-proxy@latest` instead.

> **Upgrading from 1.x?** Version 2 requires Node.js 22+ and is otherwise a drop-in replacement. If you're stuck on an older Node.js version, use `npx iisexpress-proxy@1 ...`.

## Usage

If your application's IIS Express port is 51123, run this in the Command Prompt:

```sh
iisexpress-proxy 51123 to 3000
```

The program will list the external addresses you can use for testing your application on remote devices, for instance `http://192.168.0.102:3000`.

The same goes for Kestrel: if `dotnet run` says `Now listening on: http://localhost:5123`, run `iisexpress-proxy 5123 to 3000`.

### Command-line reference

```
iisexpress-proxy <SOURCE> to <PROXY_ENDPOINT> [--cert=<path> --key=<path>]
```

| Argument         | Description                                                                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SOURCE`         | Where your application is running: a port (`51123`), `host:port` (`192.168.96.3:5000`) or a full URL (`https://localhost:44300`). The host defaults to `localhost` and the protocol to `http://`.                                                                    |
| `PROXY_ENDPOINT` | Where the proxy listens: a port (`3000`), `ip:port` (`10.0.0.1:3000`) or a full URL (`https://*:3000`). Without an IP address (or with `*`) it listens on all network interfaces. An IP must belong to one of your network interfaces; domain names are not allowed. |
| `--cert`         | Path to a PEM certificate to use for an `https://` proxy endpoint. Must be used together with `--key`.                                                                                                                                                               |
| `--key`          | Path to the PEM private key matching `--cert`.                                                                                                                                                                                                                       |

### HTTPS

`iisexpress-proxy` defaults to http, so if your application is running https, include the full URL:

```sh
iisexpress-proxy https://localhost:51123 to 3000
```

Note that this will terminate HTTPS. On your destination device, connect to port `3000` using HTTP, not HTTPS.

If you want the proxy itself to serve HTTPS, specify the proxy endpoint with the full URL as well:

```sh
iisexpress-proxy https://localhost:51123 to https://*:3000
```

This will generate a self-signed certificate and use it; openssl must be in `PATH` for this to work.

_If you're on Windows, the easiest way to get openssl is to use Git Bash that comes with it pre-installed._

If you don't want to use a generated certificate, you can provide your own certificate and key using the `--cert`/`--key` arguments. In this case, openssl is not needed:

```sh
iisexpress-proxy https://localhost:51123 to https://*:3000 --key=./your-key.pem --cert=./your-cert.pem
```

## Advanced usage (VPN, virtual hosts, etc.)

You can also use **iisexpress-proxy** to expose an IIS server instance running on a **different host** accessible through VPN, like this:

```sh
iisexpress-proxy host:port to proxyHost:proxyPort
```

For instance, let's consider this scenario:

- the application is running on 192.168.96.3:5000 and **it only accepts connections from clients within a VPN**;
- your development machine has a network interface within the same VPN and another publicly accessible one (192.168.0.102);
- **you need to test the application from mobile devices without having to add those devices to the VPN**.

By running this in the Command Prompt:

```sh
iisexpress-proxy 192.168.96.3:5000 to 192.168.0.102:3000
```

...you'll be able to access the application by pointing the mobile devices to 192.168.0.102:3000.

For another advanced example, consider that you're on public Wi-Fi and don't want to publicly expose your dev server. You could
set up a VPN between your laptop and your phone and only expose the server on the VPN interface (10.0.0.1). Then you can run

```sh
iisexpress-proxy 5000 to 10.0.0.1:8080
```

...and open http://10.0.0.1:8080 on your phone with VPN enabled, while other Wi-Fi users won't be able to connect.

## Troubleshooting

**The device can't connect at all.**
Make sure the device is on the same network as your machine, and that you're using one of the addresses listed when the proxy starts.
On Windows, the first run usually triggers a _"Windows Defender Firewall has blocked some features of Node.js"_ prompt; allow access on private networks.
If you dismissed it, or your network is marked as public, add an inbound rule from an elevated Command Prompt:

```sh
netsh advfirewall firewall add rule name="iisexpress-proxy" dir=in action=allow protocol=TCP localport=3000
```

**The browser shows `502 Bad Gateway`.**
The proxy is reachable, but it can't reach your application. Check that the application is running and that `SOURCE` (port and `http`/`https`) matches what IIS Express or Kestrel is listening on. The reason is logged in the console.

**The device warns about an untrusted certificate.**
That's expected with the generated self-signed certificate; accept the warning, or provide a certificate the device trusts with `--cert`/`--key`.
The generated certificate is cached in your temp folder; delete `iisexpress-proxy-cert.pem` and `iisexpress-proxy-key.pem` from there to regenerate it.

**`Server error: listen EADDRINUSE`.**
Another program is already using the proxy port; pick a different one.

## Limitations

`iisexpress-proxy` doesn't work in scenarios involving integrated Windows authentication (see [issue #5](https://github.com/icflorescu/iisexpress-proxy/issues/5)).

## How does it work

It's proxying the HTTP traffic on `localPort` to `proxyPort` on all the available network interfaces and it's also [changing the origin of the host header](https://github.com/sagemathinc/http-proxy-3#options), allowing you to test web applications hosted by IIS Express on various remote devices (mobile devices, other desktops, etc.).
WebSocket connections are proxied as well.

If you need to access the original host requested by the browser, the request headers will include `X-Forwarded-*` headers. In ASP.NET, `Request.Headers["x-forwarded-host"]` will contain the requested host.

## History

- **v2.0.0** – requires Node.js 22+; switched to [http-proxy-3](https://github.com/sagemathinc/http-proxy-3), which removes the `util._extend` deprecation warning; `502 Bad Gateway` when the application is unreachable; `--cert`/`--key` no longer require openssl.
- **v1.7.0** (02/14/2022) – custom certificates via `--cert`/`--key`.
- **v1.4.0** – WebSocket support by [Stan Hebben](https://github.com/stanhebben) (see [PR #21](https://github.com/icflorescu/iisexpress-proxy/pull/21)).
- **v1.1.0** (10/21/2015) – proxying applications running on a different host.

## Credits and attributions

This command-line utility wraps [http-proxy-3](https://github.com/sagemathinc/http-proxy-3), a maintained successor of [http-proxy](https://github.com/http-party/node-http-proxy).
The original [http-proxy](https://github.com/http-party/node-http-proxy) logo was created by [Diego Pasquali](https://dribbble.com/diegopq).

## Contributors

[![Contributors list](https://contrib.rocks/image?repo=icflorescu/iisexpress-proxy)](https://github.com/icflorescu/iisexpress-proxy/graphs/contributors)

## Endorsing the author

If you find this repo useful, please give it a star, [share it on X](https://x.com/intent/tweet?text=Access%20your%20IIS%20Express%20applications%20from%20remote%20devices&url=https%3A%2F%2Fgithub.com%2Ficflorescu%2Fiisexpress-proxy&hashtags=iisexpress%2Cremote%2Cvisualstudio%2Cnode.js&via=icflorescu) and endorse me on LinkedIn:

[![Ionut-Cristian Florescu on LinkedIn](https://static.licdn.com/scds/common/u/img/webpromo/btn_viewmy_160x25.png)](https://www.linkedin.com/in/icflorescu)

## Before raising issues

I'm getting lots of questions from people just learning to do web development or simply looking to solve a very specific problem they're dealing with. While I will answer some of them for the benefit of the community, please understand that open-source is a shared effort and it's definitely not about piggybacking on other people's work. On places like GitHub, that means raising issues is encouraged, but coming up with useful PRs is a lot better. If I'm willing to share some of my code for free, I'm doing it for a number of reasons: my own intellectual challenges, pride, arrogance, stubbornness to believe I'm bringing a contribution to common progress and freedom, etc. Your particular well-being is probably not one of those reasons. I'm not in the business of providing free consultancy, so if you need my help to solve your specific problem, there's a fee for that.

## ❤️🇺🇦

On 24th of February 2022 [Russia unlawfully invaded Ukraine](https://en.wikipedia.org/wiki/Russo-Ukrainian_War). This is an unjustified, unprovoked attack on the sovereignty of a neighboring country, but also an open affront to international peace and stability that has the potential to degenerate into a nuclear event threatening the very existence of humanity. I am a Romanian (EU) citizen, but I stand with Ukraine and I am doing everything in my power to stop this madness. Here's [how you can show your support](https://war.ukraine.ua/support-ukraine/).

## License

The [ISC License](https://github.com/icflorescu/iisexpress-proxy/blob/master/LICENSE).

[repo-url]: https://github.com/icflorescu/iisexpress-proxy
[npm-url]: https://www.npmjs.com/package/iisexpress-proxy
[npm-image]: https://img.shields.io/npm/v/iisexpress-proxy.svg?style=flat-square
[downloads-image]: https://img.shields.io/npm/dm/iisexpress-proxy.svg?style=flat-square
[ci-image]: https://img.shields.io/github/actions/workflow/status/icflorescu/iisexpress-proxy/ci.yml?branch=master&style=flat-square&label=CI
[ci-url]: https://github.com/icflorescu/iisexpress-proxy/actions/workflows/ci.yml
[license-image]: https://img.shields.io/npm/l/iisexpress-proxy.svg?style=flat-square
[license-url]: LICENSE
[stars-image]: https://img.shields.io/github/stars/icflorescu/iisexpress-proxy?style=flat-square
[contributors-image]: https://img.shields.io/github/contributors-anon/icflorescu/iisexpress-proxy?style=flat-square
[last-commit-image]: https://img.shields.io/github/last-commit/icflorescu/iisexpress-proxy?style=flat-square
[sponsor-image]: https://img.shields.io/badge/sponsor-violet?style=flat-square
[sponsor-url]: https://github.com/sponsors/icflorescu
