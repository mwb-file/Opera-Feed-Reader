/*! ==========================================================================
 *  Soft UI — theme controller for theme.css
 *  --------------------------------------------------------------------------
 *  Handles three things and nothing else:
 *    1. light / dark / auto   →  <html data-theme="…">
 *    2. the accent hue        →  <html style="--accent-h:…">
 *    3. remembering both in localStorage
 *
 *  Usage
 *    <script src="theme.js"></script>
 *    <script>Theme.init();</script>              // auto + saved accent
 *    Theme.toggleTheme();                        // cycle light → dark → auto
 *    Theme.setAccent(330);
 *    Theme.mountPicker(document.querySelector('#accents'));
 *  ========================================================================== */
(function (global) {
  "use strict";

  var KEY_THEME = "ui-theme";
  var KEY_ACCENT = "ui-theme-accent";

  /* Hues offered by mountPicker(). Add your own freely. */
  var ACCENTS = [
    { hue: 217, fa: "آبی",    en: "Blue"   },
    { hue: 262, fa: "بنفش",   en: "Violet" },
    { hue: 160, fa: "سبز",    en: "Green"  },
    { hue: 25,  fa: "نارنجی", en: "Orange" },
    { hue: 330, fa: "صورتی",  en: "Pink"   },
    { hue: 0,   fa: "قرمز",   en: "Red"    },
    { hue: 180, fa: "فیروزه", en: "Teal"   },
    { hue: 240, fa: "نیلی",   en: "Indigo" }
  ];

  var opts = {
    theme: "auto",          // "light" | "dark" | "auto"
    accent: 217,
    storageKey: KEY_THEME,
    accentKey: KEY_ACCENT,
    persist: true,
    metaColor: { light: null, dark: null }   // update <meta name="theme-color">
  };

  var listeners = [];
  var mq = global.matchMedia ? global.matchMedia("(prefers-color-scheme: dark)") : null;
  var started = false;

  /* ---------------------------------------------------------------- storage */
  function read(key) {
    try { return global.localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    if (!opts.persist) return;
    try { global.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  /* ------------------------------------------------------------------ state */
  function normalizeTheme(value) {
    return value === "light" || value === "dark" || value === "auto" ? value : "auto";
  }
  function normalizeHue(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return 217;
    return Math.min(360, Math.max(0, n));
  }
  function resolved() {
    if (opts.theme === "auto") return mq && mq.matches ? "dark" : "light";
    return opts.theme;
  }

  function emit() {
    var detail = { theme: opts.theme, resolved: resolved(), accent: opts.accent };
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](detail); } catch (e) { /* a listener must not break the rest */ }
    }
  }

  /* ------------------------------------------------------------------- apply */
  function apply() {
    var root = global.document.documentElement;
    root.setAttribute("data-theme", resolved());
    root.style.setProperty("--accent-h", String(opts.accent));

    var colors = opts.metaColor || {};
    var color = colors[resolved()];
    if (color) {
      var meta = global.document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
    }
    emit();
  }

  /* --------------------------------------------------------------------- API */
  var Theme = {
    /** Hues available to mountPicker(). */
    ACCENTS: ACCENTS,

    /**
     * @param {{theme?:string, accent?:number|string, storageKey?:string,
     *          accentKey?:string, persist?:boolean,
     *          metaColor?:{light?:string, dark?:string}}} [options]
     */
    init: function (options) {
      if (options) {
        if (options.theme != null) opts.theme = normalizeTheme(options.theme);
        if (options.accent != null) opts.accent = normalizeHue(options.accent);
        if (options.storageKey) opts.storageKey = options.storageKey;
        if (options.accentKey) opts.accentKey = options.accentKey;
        if (options.persist != null) opts.persist = !!options.persist;
        if (options.metaColor) opts.metaColor = options.metaColor;
      }
      if (opts.persist) {
        var savedTheme = read(opts.storageKey);
        var savedAccent = read(opts.accentKey);
        if (savedTheme) opts.theme = normalizeTheme(savedTheme);
        if (savedAccent != null && savedAccent !== "") opts.accent = normalizeHue(savedAccent);
      }
      if (!started && mq) {
        var onChange = function () { if (opts.theme === "auto") apply(); };
        if (mq.addEventListener) mq.addEventListener("change", onChange);
        else if (mq.addListener) mq.addListener(onChange);
        started = true;
      }
      apply();
      return Theme;
    },

    /** Current preference: "light" | "dark" | "auto". */
    get: function () { return opts.theme; },

    /** What is actually on screen right now: "light" | "dark". */
    resolved: resolved,

    /** @param {"light"|"dark"|"auto"} value */
    set: function (value) {
      opts.theme = normalizeTheme(value);
      write(opts.storageKey, opts.theme);
      apply();
      return opts.theme;
    },

    /** light → dark → auto → light … */
    toggle: function () {
      var next = opts.theme === "light" ? "dark" : (opts.theme === "dark" ? "auto" : "light");
      return Theme.set(next);
    },

    /** Current accent hue in degrees. */
    accent: function () { return opts.accent; },

    /** @param {number|string} hue 0–360 */
    setAccent: function (hue) {
      opts.accent = normalizeHue(hue);
      write(opts.accentKey, String(opts.accent));
      apply();
      return opts.accent;
    },

    /** @param {(state:{theme:string,resolved:string,accent:number})=>void} fn */
    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i > -1) listeners.splice(i, 1);
      };
    },

    /**
     * Render the accent swatches into a container and wire up the clicks.
     * @param {Element|string} target
     * @param {{lang?:string, hues?:Array}} [options]
     */
    mountPicker: function (target, options) {
      var el = typeof target === "string" ? global.document.querySelector(target) : target;
      if (!el) return null;
      var o = options || {};
      var lang = o.lang || (global.document.documentElement.getAttribute("lang") || "en");
      var list = o.hues || ACCENTS;

      function paint() {
        var buttons = el.querySelectorAll("[data-h]");
        for (var i = 0; i < buttons.length; i++) {
          var on = Number(buttons[i].getAttribute("data-h")) === opts.accent;
          buttons[i].classList.toggle("is-active", on);
          buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
        }
      }

      var html = "";
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        var hue = a.hue != null ? a.hue : a;
        var name = a[lang] || a.en || String(hue);
        html += '<button type="button" class="accent-sw" data-h="' + hue + '"' +
                ' style="--h:' + hue + '" title="' + name + '" aria-label="' + name + '"></button>';
      }
      el.classList.add("accent-picker");
      el.innerHTML = html;

      el.addEventListener("click", function (event) {
        var button = event.target.closest("[data-h]");
        if (!button || !el.contains(button)) return;
        Theme.setAccent(button.getAttribute("data-h"));
        paint();
      });
      paint();
      return el;
    }
  };

  global.Theme = Theme;
  if (typeof module !== "undefined" && module.exports) module.exports = Theme;
})(typeof window !== "undefined" ? window : this);
