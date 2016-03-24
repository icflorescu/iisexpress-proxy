## iisexpress-proxy
[![NPM version][npm-image]][npm-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

![iisexpress-proxy](https://cloud.githubusercontent.com/assets/581999/13374338/4db36f40-dd8a-11e5-9248-a00a22e97eb0.png)

A simple, yet practical command-line utility enabling .NET developers to test web applications served by IIS Express on remote devices.

## Motivation
Are you a .NET developer building mobile web applications?
Have you ever been frustrated by the fact that [there's no easy way](https://www.google.com/search?q=iis+express+remote+access) to enable IIS Express to accept connections from remote devices?...

## Installation
Most likely you'll want **iisexpress-proxy** installed as a global module:

    npm install -g iisexpress-proxy

Note: *You need to have [Node.js](https://nodejs.org/) installed.*

## Usage
If you installed **iisexpress-proxy** as a global module:

    iisexpress-proxy localPort to proxyPort

For instance, if your application's IIS Express port is 51123, run this in the Command Prompt:

    iisexpress-proxy 51123 to 3000

The program will list the external addresses you can use for testing your application on remote devices.

## Advanced usage (VPN, virtual hosts, etc.)
You can also use **iisexpress-proxy** to expose an IIS server instance running on a **different host** accessible through VPN, like this:

    iisexpress-proxy host:port to proxyPort

For instance, let's conside this scenario:
- the application is running on 192.168.96.3:5000 and **it only accepts connections from clients within a VPN**;
- your development machine has a network interface within the same VPN and another publicly accessible one (192.168.0.102);
- **you need to test the application from mobile devices without having to add those devices to the VPN**.

By running this in the Command Prompt:

    iisexpress-proxy 192.168.96.3:5000 to 3000

...you'll be able to access the application by pointing the mobile devices to 192.168.0.102:3000.

Note: *This functionality was added at v1.1.0 (released 10/21/2015)*.

## Limitations

`iisexpress-proxy` doesn't work in scenarios involving integrated Windows authentication (see issue #[here](https://github.com/icflorescu/iisexpress-proxy/issues/5)).

## How does it work
It's proxying the HTTP traffic on `localPort` to `proxyPort` on all the available network interfaces and it's also [changing the origin of the host header](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L44), allowing you to test web applications hosted by IIS Express on various remote devices (mobile devices, other desktops, etc.).

## Credits and attributions
This command-line utility wraps [http-proxy](https://github.com/nodejitsu/node-http-proxy).
The original [http-proxy](https://github.com/nodejitsu/node-http-proxy) logo was created by [Diego Pasquali](http://dribbble.com/diegopq).

## Endorsing the author
If you find this repo useful, please give it a star, [tweet about it](http://twitter.com/share?text=Access%20your%20IIS%20Express%20applications%20from%20remote%20devices&url=https%3A%2F%2Fgithub.com%2Ficflorescu%2Fiisexpress-proxy&hashtags=iisexpress%2Cremote%2Cvisualstudio%2Cnode.js&via=icflorescu) and endorse me on LinkedIn:

[![Ionut-Cristian Florescu on LinkedIn](https://static.licdn.com/scds/common/u/img/webpromo/btn_viewmy_160x25.png)](https://www.linkedin.com/in/icflorescu)

## License

The [ISC License](https://github.com/icflorescu/iisexpress-proxy/blob/master/LICENSE).

[npm-image]: https://img.shields.io/npm/v/iisexpress-proxy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/iisexpress-proxy
[david-image]: http://img.shields.io/david/icflorescu/iisexpress-proxy.svg?style=flat-square
[david-url]: https://david-dm.org/icflorescu/iisexpress-proxy
[license-image]: http://img.shields.io/npm/l/iisexpress-proxy.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/iisexpress-proxy.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/iisexpress-proxy
