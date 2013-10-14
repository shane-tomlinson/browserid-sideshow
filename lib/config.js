/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const crypto = require('crypto');
const url = require('url');

const convict = require('convict');

function strictUrl(raw) {
  var p = url.parse(raw);

  if (!/^https?:$/.test(p.protocol)) {
    throw new Error('must have http or https scheme');
  }

  if (!p.hostname) {
    throw new Error('must supply hostname or ip address');
  }

  if (p.path !== '/') { // url.parse normalizes path to '/' when omitted
    throw new Error('must not provide a path or query string');
  }

  if (p.hash) {
    throw new Error('must not provide an anchor');
  }
}

const conf = convict({
  server: {
    publicUrl: {
      doc: 'The public-facing bridge URL in scheme://host[:port] format.',
      env: 'PUBLIC_URL',
      format: strictUrl,
      default: 'http://127.0.0.1:3000'
    },
    personaUrl : {
      doc: 'Base URL for including Persona\'s JS files in scheme://host[:port]',
      env: 'PERSONA_URL',
      format: strictUrl,
      default: 'http://127.0.0.1:10002'
    },
    port: {
      doc: 'The port to listen on.',
      env: 'PORT',
      format: 'port',
      default: 3000
    },
    host: {
      doc: 'The hostname or IP to bind to.',
      env: 'HOST',
      format: String,
      default: '127.0.0.1'
    },
  },
  google: {
    clientId : {
      doc: 'Google APIs Client ID',
      env: 'GOOGLE_CLIENT_ID',
      format: String,
      default: 'REPLACE_WITH_REAL_CLIENT_ID'
    },
    clientSecret : {
      doc: 'Google APIs Client Secret',
      env: 'GOOGLE_CLIENT_SECRET',
      format: String,
      default: 'REPLACE_WITH_REAL_CLIENT_SECRET'
    }
  },
  cert: {
    domain: {
      doc: 'The domain used in the signed certificate.',
      env: 'CERT_DOMAIN',
      arg: 'issuer',
      format: String,
      default: undefined // Derives from publicUrl by default.
    },
    pubKeyPath: {
      doc: 'Path to the public key to render the .well-known',
      env: 'PUB_KEY_PATH',
      format: String,
      default: 'var/key.publickey'
    },
    privKeyPath: {
      doc: 'Path to the private key to sign certs.',
      env: 'PRIV_KEY_PATH',
      format: String,
      default: 'var/key.secretkey'
    },
    maxDuration: {
      doc: 'Maximum certificate duration in milliseconds',
      env: 'CERT_MAX_DURATION',
      format: 'int',
      default: 1000 * 60 * 60 * 24 // 24 hours max
    },
    minDuration: {
      doc: 'Minimum / default certificate duration in milliseconds.',
      env: 'CERT_MIN_DURATION',
      format: 'int',
      default: 1000 * 60 * 5 // 5 minutes default
    }
  },
  logPath: {
    doc: 'Path to log file.',
    env: 'LOG_PATH',
    format: String,
    default: '-' // Log to stdout / stderr.
  },
  session: {
    secret: {
      doc: 'The secret used for signing cookies',
      env: 'SESSION_SECRET',
      format: String,
      default: String(crypto.randomBytes(256)) // Ephemeral. OVERRIDE THIS.
    },
    duration: {
      doc: 'The duration of session cookies, in milliseconds.',
      env: 'SESSION_DURATION',
      format: 'nat',
      default: 15 * 60 * 1000
    }
  },
  locale: {
    list: {
      doc: 'An array of locales to enabled.',
      env: 'LOCALE_LIST',
      format: Array,
      default: ['en-US', 'it-CH']
    },
    base: {
      doc: 'The default locale.',
      env: 'LOCALE_DEFAULT',
      format: String,
      default: 'en-US'
    },
    debug: {
      doc: 'The debug locale.',
      env: 'LOCALE_DEBUG',
      format: String,
      default: 'it-CH'
    },
    dir: {
      doc: 'The path to the directory containing translations.',
      env: 'LOCALE_DIR',
      format: String,
      default: 'locale'
    }
  },
  proxy: {
    host: {
      doc: 'Host for HTTP proxy of outgoing requests.',
      env: 'PROXY_HOST',
      format: String,
      default: ''
    },
    port: {
      doc: 'Port for HTTP proxy of outgoing requests.',
      env: 'PROXY_PORT',
      format: Number,
      default: 0
    }
  },
  statsd: {
    enabled: {
      doc: 'Whether to broadcast statsd data or not.',
      env: 'STATSD_ENABLED',
      format: Boolean,
      default: false
    },
    host: {
      doc: 'Host of statsd daemon.',
      env: 'STATSD_HOST',
      format: String,
      default: 'localhost'
    },
    port: {
      doc: 'Port of statsd daemon.',
      env: 'STATSD_PORT',
      format: 'port',
      default: 8125
    }
  }
});

// Load configuration files specified in the environment
if (process.env.CONFIG_FILES) {
  conf.loadFile(process.env.CONFIG_FILES.split(','));
}

// Strip trailing slashes and whitespace from personaUrl and publicUrl
conf.set('server.personaUrl',
    conf.get('server.personaUrl').trim().replace(/[\s\/]*$/, ''));
conf.set('server.publicUrl',
    conf.get('server.publicUrl').trim().replace(/[\s\/]*$/, ''));


// Derive default issuer from publicUrl
if (conf.get('cert.domain') === undefined) {
  conf.set('cert.domain', url.parse(conf.get('server.publicUrl')).hostname);
}


conf.validate();

console.log("personaUrl", conf.get('server.personaUrl'));


if (conf.get('proxy.host')) {
  process.env.HTTP_PROXY_HOST = conf.get('proxy.host');
  process.env.HTTPS_PROXY_HOST = conf.get('proxy.host');
}
if (conf.get('proxy.port')) {
  process.env.HTTP_PROXY_PORT = conf.get('proxy.port');
  process.env.HTTPS_PROXY_PORT = conf.get('proxy.port');
}

module.exports = conf;
