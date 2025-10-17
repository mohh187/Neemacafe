# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – fallback catalogue that seeds the API if no remote data exists yet.
- `order-status.html` – lightweight view Telegram uses when a waiter accepts or finishes an order.
- `dashboard.html` – لوحة تحكم داخلية لإدارة المنيو والحسابات في نسخة الـ SaaS.
- `api/menu.js` – serverless endpoint that exposes the structured menu consumed by the public UI.
- `api/items.js` – simple CRUD endpoint for experiments while wiring a permanent database.

## SaaS operations dashboard

`dashboard.html` provides a separate, Arabic-first control panel for cloud operators. The default administrator account is:

- بريد إلكتروني: `admin@neema.sa`
- كلمة المرور: `Neema@123`

After signing in you can:

- إنشاء، تعديل، أو حذف الأقسام والفئات الفرعية قبل نشرها في المنيو العام.
- إضافة أصناف جديدة مع الأسعار والسعرات والوسوم والحالة (متاح/غير متاح/موسمي).
- إدارة حسابات الفريق (مسؤول، مدير فرع، موظف خدمة، عرض فقط) والتحكم في حالة كل حساب أو إعادة ضبط كلمة المرور.
- تصدير نسخة JSON احتياطية للمنيو أو استيراد ملف جديد لتحديث البيانات مجمعًا.
- مراجعة تقارير سريعة حول العناصر التي تحتاج متابعة، مثل الأصناف بلا صور أو غير المتاحة حاليًا.

### روابط سريعة بين اللوحة والمنيو

- زر **"لوحة التحكم"** في ترويسة `index.html` يفتح `dashboard.html` في لسان جديد لتتمكن من إدارة المحتوى بسرعة من نفس الموقع العام.
- زر **"عرض المنيو العام"** داخل اللوحة يفتح نسخة المنيو المستضافة على `https://neemacafe.vercel.app/` حتى تتمكن من مراجعة التعديلات المنشورة فورًا.

### واجهات برمجية جاهزة للاستخدام

- `GET /api/menu` – يرجع البنية الكاملة للمنيو (الأقسام، الفئات، الأصناف) التي تستخدمها الواجهة العامة.
- `PUT /api/menu` – يستقبل الجسم الكامل للمنيو لحفظه في الذاكرة المؤقتة (تستعمله اللوحة عند الحفظ أو الاستيراد).
- `DELETE /api/menu` – يعيد تهيئة المنيو إلى قائمة فارغة (مفيد لتجارب التطوير).
- `GET /api/items` – يرجع مصفوفة الأصناف المسطحة للاستخدامات التجريبية أو لدمج قاعدة بيانات مستقبلية.
- `POST /api/items` – يضيف صنفًا جديدًا إلى القائمة المؤقتة ويُرجع المعرف المولد.
- `PUT /api/items?id=<uuid>` – يحدّث بيانات صنف موجود.
- `DELETE /api/items?id=<uuid>` – يحذف صنفًا من القائمة المؤقتة.

هذه الواجهات الحالية تستخدم تخزينًا داخل الذاكرة حتى يتم ربط قاعدة بيانات فعلية. في بيئة الإنتاج على Vercel يظل المحتوى متاحًا طالما أن الدالة لم تُعد تهيئتها.

### مفاتيح التخزين المحلي الخاصة باللوحة

- `neema-dashboard-menu-v1` – نسخة المنيو التي يجري العمل عليها داخل اللوحة.
- `neema-dashboard-users-v1` – قائمة حسابات الفريق المخزنة محليًا.
- `neema-dashboard-session-v1` – جلسة تسجيل دخول المسؤول الحالي.
- `neema-dashboard-activity-v1` – آخر الأنشطة التي تمت داخل اللوحة (بحد أقصى 50 حركة).

## Consuming the menu data in other clients

The public menu (`index.html`) now fetches its catalogue from the serverless endpoint at `/api/menu`. That endpoint returns the same structure persisted by the dashboard, so any other client can reuse the data by calling:

```bash
curl https://<your-vercel-app>/api/menu
```

If the API has not been initialised yet, `menu-data.js` seeds it with the bundled catalogue so the first request still returns a useful payload. You can also embed the fallback script manually when running the menu in offline/demo mode:

```html
<!-- Your menu markup … -->
<script src="menu-data.js"></script>
<script>
  // window.NEEMA_SHARED.MENU_DATA will be available if the API is offline.
</script>
```

## نشر المنصة على Vercel مع دومين مخصص

1. اربط المستودع مع مشروع جديد في [Vercel](https://vercel.com/) (زر **New Project** ثم اختر الريبو الحالي).
2. بعد الإطلاق الأولي، افتح إعدادات المشروع في Vercel وانتقل إلى تبويب **Domains**.
3. أضف الدومين المخصص الذي ترغب به (مثل `dashboard.neema.sa`) عبر زر **Add**.
4. إذا كان الدومين مستضافًا لدى مزود خارجي، أنشئ سجل `A` أو `CNAME` حسب التوجيهات التي تعرضها Vercel بعد إضافة الدومين.
5. بعد نشر السجلات، استخدم زر **Verify** في Vercel للتأكد من الربط. ستتمكن بعدها من زيارة المنيو العام عبر `https://neemacafe.vercel.app/` واللوحة عبر الدومين الجديد.

## Customising the catalogue

The recommended workflow is to sign in to `dashboard.html`, edit the sections/items there, and let the UI sync the new structure to `/api/menu`. If you prefer scripted updates you can `PUT` the full JSON payload to the endpoint directly. The bundled `menu-data.js` file is still available when you need to ship a static demo or reseed the API with the default drinks.

## Persisted data keys

The menu stores customer preferences and order history in `localStorage`. These keys are shared by both builds:

- `nima.lang` – preferred language (`ar` or `en`).
- `nima.mode` – theme (`dark` or `light`).
- `nima.customerProfile` – saved name and phone number.
- `nima.customerRegistry` – known customers for multi-guest logs.
- `nima.orderLog` – history of orders sent from the device.
- `nima.loyaltyTracker` – loyalty counts per drink.

Clearing browser storage resets the greeting, loyalty counts, and saved customer details.
