# iisexpress-proxy

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Stars][stars-image]][repo-url]
[![Contributors][contributors-image]][repo-url]  
[![Last commit][last-commit-image]][repo-url]
[![Forks][forks-image]][repo-url]
[![Closed issues][closed-issues-image]][repo-url]
[![Downloads][downloads-image]][npm-url]

![iisexpress-proxy](https://cloud.githubusercontent.com/assets/581999/13374338/4db36f40-dd8a-11e5-9248-a00a22e97eb0.png)

A simple, yet practical command-line utility enabling .NET developers to test web applications served by IIS Express on remote devices.

## Motivation

Are you a .NET developer building mobile web applications?
Have you ever been frustrated by the fact that [there's no easy way](https://www.google.com/search?q=iis+express+remote+access) to enable IIS Express to accept connections from remote devices?...

## Installation

There's no need to install `iisexpress-proxy` if you're using `npm@^5.2.0`; you can simply [run it with `npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b). If you're using an older version of `npm`, you'll most likely want `iisexpress-proxy` installed as a global module:
```sh
npm install -g iisexpress-proxy
```

Note: _You need to have [Node.js](https://nodejs.org/) installed._

## Usage

If you're using `npm@^5.2.0`:

```sh
npx iisexpress-proxy localPort to proxyPort
```

Alternatively, if you installed **iisexpress-proxy** as a global `npm` module:

```sh
iisexpress-proxy localPort to proxyPort
```

For instance, if your application's IIS Express port is 51123, run this in the Command Prompt:

    iisexpress-proxy 51123 to 3000

The program will list the external addresses you can use for testing your application on remote devices.

`iisexpress-proxy` defaults to http, so if your application is running https, then include the full URL.

```sh
iisexpress-proxy https://localhost:51123 to 3000
```

Note that this will terminate HTTPS. On your destination machine, connect to port `3000` using HTTP, not HTTPS.

If you want the proxy itself to serve HTTPS, you can specify the target with the full URL as well.

```sh
iisexpress-proxy https://localhost:51123 to https://*:3000
```

This will generate a self-signed certificate and use it, openssl must be in `PATH` for this to work.

_If you're on Windows, the easiest way to get openssl is to use Git Bash that comes with it pre-installed._

If you want to bind to a specific interface instead of all of them, use its IP in the target URL, e.g. `https://10.0.0.1:3000`. Note that the right-hand part cannot be a domain name.

## Advanced usage (VPN, virtual hosts, etc.)

You can also use **iisexpress-proxy** to expose an IIS server instance running on a **different host** accessible through VPN, like this:

```sh
iisexpress-proxy host:port to proxyHost:proxyPort
```

For instance, let's conside this scenario:

- the application is running on 192.168.96.3:5000 and **it only accepts connections from clients within a VPN**;
- your development machine has a network interface within the same VPN and another publicly accessible one (192.168.0.102);
- **you need to test the application from mobile devices without having to add those devices to the VPN**.

By running this in the Command Prompt:

```sh
iisexpress-proxy 192.168.96.3:5000 to 192.168.0.102:3000
```

...you'll be able to access the application by pointing the mobile devices to 192.168.0.102:3000.

For another advanced example, consider that you're on public Wifi and don't want to publicly expose your dev server. You could
set up a VPN between your laptop and your phone and only expose the server on the VPN interface (10.0.0.1). Then you can run

```sh
iisexpress-proxy 5000 to 10.0.0.1:8080
```

...and open http://10.0.0.1:8080 on your phone with VPN enabled, while other wifi users won't be able to connect.

Note: _This functionality was added at v1.1.0 (released 10/21/2015)_.

WebSocket support was added in `v1.4.0` by [Stan Hebben](https://github.com/stanhebben) - see [PR #11](https://github.com/icflorescu/iisexpress-proxy/pull/21) for details.

If you don't want using generated certificates you could provide your own certificate and key using `cert`/`key` arguments:

```sh
iisexpress-proxy https://localhost:51123 to https://*:3000 --key=./your-key.pem --cert=./your-cert.pem
```

Note: _This functionality was added at v1.7.0 (released 02/14/2022)_.

## Limitations

`iisexpress-proxy` doesn't work in scenarios involving integrated Windows authentication (see issue #[here](https://github.com/icflorescu/iisexpress-proxy/issues/5)).

## How does it work

It's proxying the HTTP traffic on `localPort` to `proxyPort` on all the available network interfaces and it's also [changing the origin of the host header](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L44), allowing you to test web applications hosted by IIS Express on various remote devices (mobile devices, other desktops, etc.).

If you need to access the original host requested by the browser, the request headers will include X-Forward headers. In ASP.NET, `Request.Headers["x-forwarded-host"]` will contain the requested host.

## Credits and attributions

This command-line utility wraps [http-proxy](https://github.com/nodejitsu/node-http-proxy).
The original [http-proxy](https://github.com/nodejitsu/node-http-proxy) logo was created by [Diego Pasquali](http://dribbble.com/diegopq).

## Contributors

[![Contributors list](https://contrib.rocks/image?repo=icflorescu/iisexpress-proxy)](https://github.com/icflorescu/iisexpress-proxy/graphs/contributors)

## Endorsing the author

If you find this repo useful, please give it a star, [tweet about it](http://twitter.com/share?text=Access%20your%20IIS%20Express%20applications%20from%20remote%20devices&url=https%3A%2F%2Fgithub.com%2Ficflorescu%2Fiisexpress-proxy&hashtags=iisexpress%2Cremote%2Cvisualstudio%2Cnode.js&via=icflorescu) and endorse me on LinkedIn:

[![Ionut-Cristian Florescu on LinkedIn](https://static.licdn.com/scds/common/u/img/webpromo/btn_viewmy_160x25.png)](https://www.linkedin.com/in/icflorescu)

## Before raising issues

I'm getting lots of questions from people just learning to do web development or simply looking to solve a very specific problem they're dealing with. While I will answer some of them for the benefit of the community, please understand that open-source is a shared effort and it's definitely not about piggybacking on other people's work. On places like GitHub, that means raising issues is encouraged, but coming up with useful PRs is a lot better. If I'm willing to share some of my code for free, I'm doing it for a number of reasons: my own intellectual challenges, pride, arrogance, stubbornness to believe I'm bringing a contribution to common progress and freedom, etc. Your particular well-being is probably not one of those reasons. I'm not in the business of providing free consultancy, so if you need my help to solve your specific problem, there's a fee for that.

## ❤️🇺🇦

On 24th of February 2022 [Russia unlawfully invaded Ukraine](https://en.wikipedia.org/wiki/Russo-Ukrainian_War). This is an unjustified, unprovoked attack on the sovereignty of a neighboring country, but also an open affront to international peace and stability that has the potential to degenerate into a nuclear event threatening the very existence of humanity. I am a Romanian (EU) citizen, but I stand with Ukraine and I am doing everything in my power to stop this madness. Here's [how you can show your support](https://www.stopputin.net/).

## License

The [ISC License](https://github.com/icflorescu/iisexpress-proxy/blob/master/LICENSE).

[repo-url]: https://github.com/icflorescu/iisexpress-proxy
[npm-url]: https://npmjs.org/package/iisexpress-proxy
[npm-image]: https://img.shields.io/npm/v/iisexpress-proxy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/iisexpress-proxy
[license-image]: http://img.shields.io/npm/l/iisexpress-proxy.svg?style=flat-square
[license-url]: LICENSE
[stars-image]: https://img.shields.io/github/stars/icflorescu/iisexpress-proxy?style=flat-square
[contributors-image]: https://img.shields.io/github/contributors-anon/icflorescu/iisexpress-proxy?style=flat-square
[last-commit-image]: https://img.shields.io/github/last-commit/icflorescu/iisexpress-proxy?style=flat-square
[forks-image]: https://img.shields.io/github/forks/icflorescu/iisexpress-proxy?style=flat-square
[closed-issues-image]: https://img.shields.io/github/issues-closed-raw/icflorescu/iisexpress-proxy?style=flat-square
[downloads-image]: http://img.shields.io/npm/dm/iisexpress-proxy.svg?style=flat-square
