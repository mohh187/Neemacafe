# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – the shared catalogue of drinks and desserts that both builds render.
- `admin/index.html` (متوفر أيضًا كـ `menu-admin.html` للترابط السابق) – لوحة تحكم باللغة العربية لتحديث بيانات المنيو مع مصادقة بسيطة وربط بقاعدة البيانات.
- `order-status.html` – lightweight view Telegram uses when a waiter accepts or finishes an order.

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
- `/api/orders` – قراءة آخر الطلبات، واستقبال الطلبات الجديدة من الواجهة الأمامية. عمليات القراءة مفتوحة، بينما التعديلات المستقبلية ستحتاج التحقق.

يستعمل كلا المسارين قاعدة بيانات PostgreSQL عبر Netlify Neon. استورد المخطط الموجود في `netlify/functions/schema.sql` لتجهيز الجداول المطلوبة (`items` و`orders`).

### Environment variables

- `ADMIN_PASSWORD` – required لكلا لوحة التحكم والعمليات المحمية في واجهات `/api`.
- `CORS_ORIGIN` – (اختياري) اضبطه لتحجيم النطاقات المسموح لها باستهلاك الواجهات؛ القيمة الافتراضية `*`.
- `RESEND_API_KEY` – مفتاح خدمة [Resend](https://resend.com/) لإرسال رسائل البريد لتقارير نهاية اليوم.
- `REPORT_SENDER_EMAIL` – البريد المرسل المعتمد من Resend (مثل `Neema Café <reports@yourdomain.com>`).
- `DAILY_REPORT_RECIPIENT` – (اختياري) يبدّل البريد الافتراضي المستلم للتقارير.

### Daily report automation

يوجد دالة مجدولة (`netlify/functions/daily-report.js`) تعمل تلقائيًا عند منتصف الليل بتوقيت الرياض (21:00 بالتوقيت العالمي) لإرسال تقرير مفصل بالبريد يحتوي على إجمالي الطلبات، الإيرادات، وأسماء العملاء مع تفاصيل طلباتهم إلى البريد `Moh.idris.18@gmail.com` ما لم يتم تحديد بريد آخر في المتغير البيئي `DAILY_REPORT_RECIPIENT`.

## Persisted data keys

The menu stores customer preferences and order history in `localStorage`. These keys are shared by both builds:

- `nima.lang` – preferred language (`ar` or `en`).
- `nima.mode` – theme (`dark` or `light`).
- `nima.customerProfile` – saved name and phone number.
- `nima.customerRegistry` – known customers for multi-guest logs.
- `nima.orderLog` – history of orders sent from the device.
- `nima.loyaltyTracker` – loyalty counts per drink.
- `neema.menuData.custom` – نسخة محلية من أصناف المنيو يتم إنشاؤها من خلال لوحة التحكم.

Clearing browser storage resets the greeting, loyalty counts, and saved customer details.
