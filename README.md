# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – the shared catalogue of drinks and desserts that both builds render.
- `admin/index.html` (متوفر أيضًا كـ `menu-admin.html` للترابط السابق) – لوحة تحكم باللغة العربية لتحديث بيانات المنيو مع مصادقة بسيطة وربط بقاعدة البيانات.
- `order-status.html` – lightweight view Telegram uses when a waiter accepts or finishes an order.

## Latest enhancements

- زر إرسال الطلب السريع تمت إضافته إلى الشريط السفلي بجانب زر استدعاء النادل لبدء الطلب مباشرة من أي قسم.
- منطق الولاء يحتسب الآن كل المشروبات ضمن رصيد العميل؛ كل خمس مشروبات (بغض النظر عن النوع) تمنح مشروبًا مجانيًا.
- الطلبات المخزنة في قاعدة البيانات تتضمن ملف العميل، إجمالي المشروبات، خصومات الولاء، نوع الجهاز، اللغة، وعنوان الـ IP.
- لوحة التحكم الإدارية تعرض الطلبات ببيانات الجهاز وتتيح تصدير تقارير CSV لكل من الطلبات والعملاء عبر `/api/orders` و`/api/customers`.

## Asset pipeline and hosting

Static assets are now optimized and hosted on Cloudinary to keep the repository lean and avoid paid storage tiers. The workflow lives in `scripts/`:

- `scripts/optimize-and-upload.mjs` – walks common image folders, converts assets to WebP with `sharp`, uploads them to Cloudinary, and writes a manifest to `scripts/upload-map.json`.
- `scripts/update-menu-data.mjs` – rewrites image URLs inside the shared menu dataset so that every drink image points to the freshly uploaded Cloudinary URLs.
- `scripts/git-cleanup.sh` – runs [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to purge large blobs from history after the assets move.

Create `scripts/.env` (see `scripts/.env.example`) with your Cloudinary credentials plus `BUILD_DIR`, `MENU_DATA_FILE`, and optional `IMAGE_SOURCE_DIRS` overrides if needed, then run:

```bash
npm ci
npm run img:upload
npm run img:rewrite
```

Commit the resulting manifest and menu data changes. After assets move, run `bash scripts/git-cleanup.sh` to shrink the Git history.

## Builds and deployment

The Netlify build (`npm run build`) copies the static bundle into `dist/`, which matches `BUILD_DIR` in `netlify.toml`. A GitHub Action in `.github/workflows/deploy-netlify.yml` installs dependencies, builds, and triggers a Netlify deploy on pushes to `main`. Set `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets in the repository to enable automated deployments.

## Using the shared menu data in another page

If you are copying the menu UI into a new HTML file, add the shared dataset before the main script that renders the menu:

```html
<!-- Your menu markup … -->
<script src="menu-data.js"></script>
<script>
  // Existing menu logic that expects window.NEEMA_SHARED.MENU_DATA
</script>
```

The JavaScript inside each menu file now looks up `window.NEEMA_SHARED.MENU_DATA`. If that script does not load, the UI will still render but without any menu items, and the console logs:

```
[Neema] Shared menu data not found — rendering with empty menu dataset.
```

Including `menu-data.js` on the page ensures both menu builds use the same catalogue of products and imagery.

## Customising the catalogue

You now have two options when updating the menu:

1. **لوحة التحكم (`/admin/`)** – صفحة تفاعلية تتصل بنقطة النهاية `/api/items` لإدارة العناصر (إضافة، تعديل، حذف) بعد إدخال كلمة المرور المطابقة للمتغير البيئي `ADMIN_PASSWORD`. نفس اللوحة تعرض آخر ٢٠٠ طلب تم إرسالها من خلال واجهة `/api/orders`.
2. **تعديل الملف يدويًا** – ما زال بالإمكان تحرير `menu-data.js` مباشرة لتغيير الأسعار أو البطاقات في حال احتجت إلى بيانات افتراضية عند غياب قاعدة البيانات.

## Serverless API

- `/api/items` – CRUD على عناصر المنيو، يتطلب ترويسة `Authorization: Bearer <ADMIN_PASSWORD>` للعمليات التي تغيّر البيانات.
- `/api/orders` – استقبال الطلبات الجديدة من الواجهة الأمامية، وقراءة آخر الطلبات (استدعاءات القراءة تتطلب الآن نفس ترويسة التفويض المستخدمة في لوحة التحكم).
- `/api/customers` – قائمة مجمعة لبيانات العملاء (عدد الطلبات، إجمالي الإنفاق، إجمالي المشروبات، آخر جهاز وآخر IP) للاستخدام داخل لوحة التحكم أو للتصدير.

يستعمل كلا المسارين قاعدة بيانات PostgreSQL عبر Netlify Neon. استورد المخطط الموجود في `netlify/functions/schema.sql` لتجهيز الجداول المطلوبة (`items` و`orders`)، وتمت إضافة جدول `customers` وأعمدة إضافية داخل `orders` للاحتفاظ بملخصات الولاء، خصومات الولاء، بيانات الجهاز، وعناوين الـ IP.

### Environment variables

- `ADMIN_PASSWORD` – required لكلا لوحة التحكم والعمليات المحمية في واجهات `/api`.
- `CORS_ORIGIN` – (اختياري) اضبطه لتحجيم النطاقات المسموح لها باستهلاك الواجهات؛ القيمة الافتراضية `*`.

## Persisted data keys

The menu stores customer preferences and order history in `localStorage`. These keys are shared by both builds:

- `nima.lang` – preferred language (`ar` or `en`).
- `nima.mode` – theme (`dark` or `light`).
- `nima.customerProfile` – saved name and phone number.
- `nima.customerRegistry` – known customers for multi-guest logs.
- `nima.orderLog` – history of orders sent from the device.
- `nima.loyaltyTracker` – عدادات الولاء لكل عميل (عدد المشروبات والمستويات المكتملة بغض النظر عن نوع المشروب).
- `neema.menuData.custom` – نسخة محلية من أصناف المنيو يتم إنشاؤها من خلال لوحة التحكم.

Clearing browser storage resets the greeting, loyalty counts, and saved customer details.
