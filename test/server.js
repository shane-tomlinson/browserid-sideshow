const assert = require('assert');

const clientSessions = require('client-sessions');
const jwcrypto = require('jwcrypto');
const request = require('request');

const app = require('../bin/sideshow');
const config = require('../lib/config');
const mockid = require('./lib/mockid');

const BASE_URL = 'http://localhost:3033';
const TEST_EMAIL = 'hikingfan@gmail.com';

/* globals describe, before, after, it */

describe('HTTP Endpoints', function () {
  var server;

  before(function (done) {
    app.setOpenIDRP(mockid({
      url: 'http://openid.example',
      result: {
        authenticated: true,
        email: TEST_EMAIL
      }
    }));

    server = app.listen(3033, undefined, undefined, done);
  });

  after(function () {
    server.close();
  });

  describe('/__heartbeat__', function () {
    var url = BASE_URL + '/__heartbeat__';
    var res;
    var body;

    before(function (done) {
      request.get(url, function (err, _res, _body) {
        res = _res;
        body = _body;
        done(err);
      });
    });

    it('should respond to GET', function () {
      assert.equal(res.statusCode, 200);
    });

    it('should have an "ok" body', function () {
      assert.equal(body, 'ok');
    });
  });

  describe('/.well-known/browserid', function () {
    var url = BASE_URL + '/.well-known/browserid';
    var res;
    var body;

    before(function (done) {
      request.get(url, function (err, _res, _body) {
        res = _res;
        body = _body;
        done(err);
      });
    });

    it('should respond to GET', function () {
      assert.equal(res.statusCode, 200);
    });

    it('should use application/json', function () {
      var contentType = res.headers['content-type'].split(';')[0];
      assert.equal(contentType, 'application/json');
    });

    it('should be valid JSON', function () {
      assert.doesNotThrow(function () { JSON.parse(body); });
    });

    it('should contain all necessary parameters', function () {
      var doc = JSON.parse(body);
      assert.equal(doc.authentication, '/authenticate');
      assert.equal(doc.provisioning, '/provision');
      assert('public-key' in doc);
    });

    it('should contain a valid public key', function () {
      var doc = JSON.parse(body);
      var pubKey = JSON.stringify(doc['public-key']);
      assert(jwcrypto.loadPublicKey(pubKey));
    });
  });

  describe('/provision', function () {
    var url = BASE_URL + '/provision';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });

  describe('/provision/certify', function () {
    var url = BASE_URL + '/provision/certify';
    describe('well-formed requests', function () {
      var pubkey;

      before(function (done) {
        // Generate a public key for the signing request
        var keyOpts = { algorithm: 'RS', keysize: 64 };
        jwcrypto.generateKeypair(keyOpts, function (err, keypair) {
          pubkey = keypair.publicKey.serialize();
          done(err);
        });
      });

      var cookie;
      before(function () {
        // Forge a session cookie
        var cookieOptions = {
          cookieName: 'session',
          secret: config.get('secret')
        };
        var cookieContents = { _csrf: 'foo', proven: TEST_EMAIL };

        cookie = clientSessions.util.encode(cookieOptions, cookieContents);
      });

      it('should sign certificates', function (done) {
        var jar = request.jar();
        jar.add(request.cookie('session=' + cookie));
        var options = {
          headers: { 'X-CSRF-Token': 'foo' },
          json: { email: TEST_EMAIL, pubkey: pubkey, duration: 5 * 60 * 1000 },
          jar: jar
        };

        request.post(url, options, function(err, res, body) {
          assert(jwcrypto.extractComponents(body.cert));
          done(err);
        });
      });
    });

    describe('malformed requests', function () {
      it('should have tests');
    });
  });

  describe('/authenticate', function () {
    var url = BASE_URL + '/authenticate';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });

  describe('/authenticate/forward', function () {
    var url = BASE_URL + '/authenticate/forward';

    describe('well-formed requests', function () {
      var options = {
        qs: { email: 'hikingfan@gmail.com' },
        followRedirect: false
      };
      var res;
      var body;

      before(function (done) {
        request.get(url, options, function (err, _res, _body) {
          res = _res;
          body = _body;
          done(err);
        });
      });

      it('should respond to GET with a redirect', function () {
        assert.equal(res.statusCode, 302);
      });

      it('should redirect to the OpenID endpoint', function () {
        assert.equal(res.headers.location, 'http://openid.example');
      });
    });

    describe('malformed requests', function () {
      it.skip('should fail on GET for non-google addresses', function (done) {
        var options = {
          qs: { email: 'hikingfan@example.invalid' },
          followRedirect: false
        };

        request.get(url, options, function (err, res) {
          assert.equal(res.statusCode, 500);
          done(err);
        });
      });

      it('should fail on GET if no email is provided', function (done) {
        var options = {
          qs: { },
          followRedirect: false
        };

        request.get(url, options, function (err, res) {
          assert.equal(res.statusCode, 500);
          done(err);
        });
      });
    });
  });

  describe('/authenticate/verify', function () {
    var url = BASE_URL + '/authenticate/verify';
    url; // Make JSHint shut up for the moment...
    it('should have tests');
  });
});
