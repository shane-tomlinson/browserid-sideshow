Sideshow
========

Sideshow is an experiment in building a minimal identity bridge for Gmail.

Getting Started
---------------

Running Sideshow is simple:

1. `git clone https://github.com/mozilla/browserid-sideshow.git`
2. `cd sideshow`
3. `npm install`
4. `npm start`

For local development, set the `SHIMMED_PRIMARIES` environment variable for gmail.com and googlemail.com before you start up browserid:

1. `cd /path/to/browserid`
2. `export SHIMMED_PRIMARIES='gmail.com|http://127.0.0.1:3000|/path/to/sideshow/var/well-known.json,googlemail.com|http://127.0.0.1:3000|/path/to/sideshow/var/well-known.json'`
3. `npm start`

You're done!

Visit http://127.0.0.1:10001/ and try signing in with your Gmail account!

Testing
-------

1. `npm test`

You're done!

Configuration
-------------

For information on what parameters can be configured in Sideshow, please review [lib/config.js][].

You can set values via individual environment variables, or you can set `CONFIG_FILES` to point to JSON files containing settings.
To pass multiple files, concatenate their paths with commas.

Example:

    CONFIG_FILES='/app/foo.json,/app/bar.json' npm start

Local testing shouldn't require changing any settings.

Production deployments __must__ change:

- `server.publicUrl` and `server.personaUrl`
- `cert.pubKeyPath` and `cert.privKeyPath`
- `session.secret`

Production deployments __may__ want to change:

- `server.port` and `server.host`
- `logPath`
- `proxy.host` and `proxy.port`
- `statsd.enabled`, `statsd.host`, and `statsd.port`

[lib/config.js]: https://github.com/mozilla/browserid-sideshow/blob/master/lib/config.js

StatsD
------

If enabled, Sideshow can report statistics via [statsd](https://github.com/etsy/statsd):

### Counters

    authentication.forwarding.success
    authentication.forwarding.failure.bad_input
    authentication.forwarding.failure.openid_error

    authentication.openid.success
    authentication.openid.failure.bad_result
    authentication.openid.failure.cancelled
    authentication.openid.failure.mismatch
    authentication.openid.failure.no_claim

    certification.success
    certification.failure.no_proof
    certification.failure.invalid_pubkey
    certification.failure.signing_error

    response_code.{code} -- on every response

### Timers

    routes.{path}.{method} -- on every request
