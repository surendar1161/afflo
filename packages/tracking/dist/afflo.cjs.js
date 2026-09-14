"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  initAfflo: () => init
});
module.exports = __toCommonJS(src_exports);
var STORAGE_KEY = "_afflo_ref";
var COOKIE_DAYS = 30;
var SCRIPT_ID = "__afflo__";
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function saveRef(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (e) {
  }
  setCookie(STORAGE_KEY, code, COOKIE_DAYS);
}
function loadRef() {
  try {
    const ls = localStorage.getItem(STORAGE_KEY);
    if (ls) return ls;
  } catch (e) {
  }
  return getCookie(STORAGE_KEY);
}
function clearRef() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
  }
  document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
function init(config) {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || params.get("afflo_ref");
  if (refCode) {
    saveRef(refCode);
    navigator.sendBeacon(
      `${config.host}/api/pixel`,
      JSON.stringify({ event: "click", org_id: config.orgId, ref_code: refCode, url: location.href, referrer: document.referrer })
    );
  }
  window.Afflo = {
    track(event, payload) {
      var _a;
      const refCode2 = loadRef();
      if (!refCode2) return;
      const body = JSON.stringify(__spreadValues({
        event,
        org_id: config.orgId,
        ref_code: refCode2,
        url: location.href
      }, payload));
      const endpoint = `${config.host}/api/pixel`;
      const sent = (_a = navigator.sendBeacon) == null ? void 0 : _a.call(navigator, endpoint, body);
      if (!sent) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {
        });
      }
      if (event === "purchase" || event === "sale") {
        clearRef();
      }
    },
    // Utility for SPAs: call when route changes to pick up new ?ref= params
    refresh() {
      init(config);
    }
  };
}
function autoInit() {
  const script = document.currentScript || document.getElementById(SCRIPT_ID) || document.querySelector("script[data-org]");
  if (!script) return;
  const orgId = script.getAttribute("data-org");
  const host = script.getAttribute("data-host") || "https://app.afflo.io";
  if (!orgId) {
    console.warn("[Afflo] Missing data-org attribute on script tag.");
    return;
  }
  init({ orgId, host });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
//# sourceMappingURL=afflo.cjs.js.map
