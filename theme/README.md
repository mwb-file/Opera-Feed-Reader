# Soft UI — قالب تم

یک لایه‌ی تم و کامپوننت مستقل، بدون وابستگی و بدون build. همان طراحی‌ای است که در برنامه‌ی **Personal news** استفاده شده، ولی جدا شده تا در هر پروژه‌ی دیگری قابل استفاده باشد.

- **تم روشن پیش‌فرض، تم تیره با یک اتریبیوت**
- **کل پالت از یک عدد ساخته می‌شود:** `--accent-h`
- پشتیبانی کامل از RTL با پراپرتی‌های منطقی (`padding-inline`، `inset-inline-start`، …)
- اسکرول‌بار، فوکوس‌رینگ، چک‌باکس و اسلایدر همه با تم هماهنگ می‌شوند

## فایل‌ها

| فایل | کار |
|---|---|
| `theme.css` | توکن‌ها، ریست، و همه‌ی کامپوننت‌ها |
| `theme.js` | مدیریت تم روشن/تیره/خودکار، رنگ تأکیدی و ذخیره در `localStorage` |
| `demo.html` | نمایش همه‌ی کامپوننت‌ها + سوییچ تم و رنگ (همین را در مرورگر باز کنید) |

## شروع سریع

**۱) فقط CSS** — اگر مدیریت تم را خودتان انجام می‌دهید:

```html
<link rel="stylesheet" href="theme.css">
<html data-theme="light" style="--accent-h:217">
```

**۲) با کنترلر آماده:**

```html
<script src="theme.js"></script>
<script>Theme.init();</script>
```

**۳) جلوگیری از فلش هنگام لود** — این اسنیپت را در `<head>` و **قبل از `<body>`** بگذارید:

```html
<script>
try{
  var t = localStorage.getItem("ui-theme") || "auto";
  var dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  var a = localStorage.getItem("ui-theme-accent");
  if (a) document.documentElement.style.setProperty("--accent-h", a);
}catch(e){}
</script>
```

## API جاوااسکریپت

```js
Theme.init({
  theme: "auto",                                   // light | dark | auto
  accent: 217,                                     // ۰ تا ۳۶۰
  storageKey: "ui-theme",                          // قابل تغییر
  accentKey: "ui-theme-accent",
  persist: true,
  metaColor: { light: "#eef2f8", dark: "#0f1420" } // <meta name="theme-color">
});

Theme.set("dark");          // تغییر تم
Theme.toggle();             // light → dark → auto → light
Theme.get();                // "dark"
Theme.resolved();           // "dark"   (حالت واقعیِ روی صفحه)

Theme.setAccent(330);       // تغییر رنگ تأکیدی
Theme.accent();             // 330

Theme.mountPicker("#accents");                    // ساخت خودکار ۸ سواچ
Theme.mountPicker(el, { lang: "fa", hues: [217, 0] });

var off = Theme.onChange(function (s) {           // s = {theme, resolved, accent}
  console.log(s);
});
off();                                            // لغو اشتراک
```

`Theme.ACCENTS` هم آرایه‌ی پیش‌فرض رنگ‌هاست (`{hue, fa, en}`) و می‌توانید رنگ‌های خودتان را به `mountPicker` بدهید.

## رنگ تأکیدی

تمام سایه‌های اصلی از یک متغیر مشتق می‌شوند:

```css
--accent-h: 217;                                   /* فقط همین را عوض کنید */
--primary:       hsl(var(--accent-h) 91% 60%);
--primary-hover: hsl(var(--accent-h) 91% 50%);
--primary-soft:  hsl(var(--accent-h) 91% 96%);
--primary-grad:  linear-gradient(135deg, hsl(var(--accent-h) 91% 63%), hsl(var(--accent-h) 91% 49%));
```

در تم تیره خودکار به `hsl(var(--accent-h) 80% 70%)` تغییر می‌کند. رنگ‌های پیشنهادی: `217` آبی، `262` بنفش، `160` سبز، `25` نارنجی، `330` صورتی، `0` قرمز، `180` فیروزه، `240` نیلی.

## توکن‌ها

| گروه | متغیرها |
|---|---|
| تأکیدی | `--accent-h` `--primary` `--primary-hover` `--primary-soft` `--primary-glow` `--primary-grad` `--on-primary` |
| سطوح | `--bg` `--surface` `--surface-2` `--surface-3` `--surface-glass` `--border` `--border-strong` |
| متن | `--text` `--text-dim` `--text-mute` |
| وضعیت | `--success` `--success-soft` `--danger` `--danger-soft` `--danger-hover` `--warning` `--warning-soft` |
| معکوس | `--inverse-bg` `--inverse-text` |
| شکل | `--radius-lg` `--radius` `--radius-sm` `--radius-pill` |
| سایه | `--shadow-sm` `--shadow` `--shadow-lg` `--ring` `--scrim` |
| تایپ | `--font-sans` `--font-mono` `--fs-xs…--fs-xl` `--lh` |
| حرکت | `--transition` `--bounce` |
| متفرقه | `--skeleton` `--track` |

برای تم تیره، فقط `[data-theme="dark"]` را روی `<html>` بگذارید؛ بقیه‌ی توکن‌ها خودکار عوض می‌شوند.

## کامپوننت‌ها

| دسته | کلاس‌ها |
|---|---|
| چیدمان | `.container` `.stack` `.row` `.grow` `.divider` `.muted` `.faint` `.sr-only` `.topbar` |
| سطح | `.card` `.panel` `.surface-2` `.surface-3` (`.hoverable` `.raised` `.flat`) |
| دکمه | `.btn` + `.ghost` `.outline` `.danger` `.success` `.sm` `.lg` `.block` `.pill` · `.icon-btn` |
| فرم | `.field` `.label` `.hint` `.input` `.check` `.switch` `.input-group` |
| نشان | `.badge` + `.solid` `.neutral` `.success` `.danger` `.warning` `.dot` · `.tag` |
| ناوبری | `.nav` `.nav-link` + `.is-active` · `.seg button` · `.tabs`/`.tab` |
| بازخورد | `.alert` `.toast` `.progress` `.spinner` `.skeleton` `.tip` `.empty` |
| دیالوگ | `<dialog>` + `.dlg-head` `.dlg-body` `.dlg-foot` `.dlg-close` · یا `.modal`/`.modal-content` |
| متفرقه | `.table` `.avatar` `.kbd` `.logo` `.accent-picker` |

**قرارداد حالت‌ها:** کلاس فعال `.is-active` است. برای سازگاری، `.seg button.on` هم پذیرفته می‌شود.

نمونه:

```html
<button class="btn">ذخیره</button>
<button class="btn ghost sm">لغو</button>

<div class="field">
  <label class="label" for="email">ایمیل</label>
  <input class="input" id="email" type="email">
  <span class="hint">هیچ‌وقت منتشر نمی‌شود.</span>
</div>

<dialog id="d">
  <div class="dlg-head"><h3>عنوان</h3><button class="dlg-close" data-close>✕</button></div>
  <div class="dlg-body">…</div>
  <div class="dlg-foot"><button class="btn" data-close>تمام</button></div>
</dialog>
```

## نکته درباره‌ی این ریپو

خودِ `index.html` این پروژه همچنان نسخه‌ی **درون‌خطی** همین استایل را دارد، چون یک اپ تک‌فایلی و بدون وابستگی است. این پوشه یک استخراج جداگانه برای پروژه‌های دیگر است؛ اگر خواستید `index.html` هم از `theme/theme.css` تغذیه کند، بگویید تا سوییچ کنم.
