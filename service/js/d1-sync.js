/* TECNOFA — D1 bridge intentionally disabled in local-first mode.
   Local modules remain authoritative. The future sync engine will use an explicit
   repository/API contract instead of overriding global save() or mirroring data. */
(function(){
  'use strict';
  window.tfD1Ready=false;
  window.tfReloadD1=async()=>false;
  window.tfSyncD1=async()=>false;
})();