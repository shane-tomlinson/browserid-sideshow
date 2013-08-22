/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

navigator.id.beginAuthentication(function (email) {
  window.resizeBy(0, 50);
  var escapedEmail = encodeURIComponent(email);
  window.location = '/authenticate/forward?email=' + escapedEmail;
});

