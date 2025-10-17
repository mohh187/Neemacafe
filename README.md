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
- `/api/record-customer` – نقطة خدمة خفيفة مخصّصة لتحديث بيانات العملاء (آخر قيمة طلب، نوع الجهاز، IP) عند تأكيد الطلب في الواجهة الأمامية دون الحاجة لصلاحيات الإدارة.
- `/api/record-order` – نقطة بديلة لتسجيل الطلبات الأساسية (الهاتف، المبلغ، الطاولة، العناصر) في حال أردت دمج المنيو مع أنظمة خارجية.
- `/api/health` – فحص بسيط للاتصال بقاعدة البيانات يعيد `ok` ووقت الخادم الحالي (`now`) للتحقق من سلامة الاتصال عبر Neon.

يستعمل كلا المسارين قاعدة بيانات PostgreSQL عبر الحزمة الخفيفة `@neondatabase/serverless`. استورد المخطط الموجود في `netlify/functions/schema.sql` لتجهيز الجداول المطلوبة (`items` و`orders`)، وتمت إضافة جدول `customers` وأعمدة إضافية داخل `orders` للاحتفاظ بملخصات الولاء، خصومات الولاء، بيانات الجهاز، وعناوين الـ IP. تم توفير دالة `dbHealth` مشتركة داخل `netlify/functions/db.js` في حال احتجت إلى فحوصات إضافية على الاتصال من داخل نقاط الخدمة الأخرى.

أضيفت كذلك أعمدة `last_order_value` و`device_type` و`ip_address` إلى جدول العملاء لتوافق نقاط الخدمة الجديدة مع المتطلبات المذكورة.

### Environment variables

- `ADMIN_PASSWORD` – required لكلا لوحة التحكم والعمليات المحمية في واجهات `/api`.
- `DATABASE_URL` – سلسلة الاتصال بـ PostgreSQL (يمكن أن تكون `NETLIFY_DATABASE_URL` إذا كنت تستخدم تكامل Netlify Neon أو تمرر الاتصال عبر Netlify).
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
