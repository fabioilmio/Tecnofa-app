/* TECNOFA — central auth adapter reserved for the future D1 phase.
   Local authentication in auth.js is authoritative during local-first development. */
(function(){
  'use strict';
  window.tfCentralAuthReady=()=>false;
  window.tfCentralAuthPromise=Promise.resolve(false);
  window.tfD1AuthDisabled=true;
})();