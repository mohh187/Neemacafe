# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – the shared catalogue of drinks and desserts that both builds render.
- `order-status.html` – lightweight view Telegram uses when a waiter accepts or finishes an order.
- `dashboard.html` – لوحة تحكم داخلية لإدارة المنيو والحسابات في نسخة الـ SaaS.

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

### مفاتيح التخزين المحلي الخاصة باللوحة

- `neema-dashboard-menu-v1` – نسخة المنيو التي يجري العمل عليها داخل اللوحة.
- `neema-dashboard-users-v1` – قائمة حسابات الفريق المخزنة محليًا.
- `neema-dashboard-session-v1` – جلسة تسجيل دخول المسؤول الحالي.
- `neema-dashboard-activity-v1` – آخر الأنشطة التي تمت داخل اللوحة (بحد أقصى 50 حركة).

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

Edit `menu-data.js` to update prices, calories, or images. Every change automatically propagates to both menu builds the next time the page loads because they read from the shared module.

## Persisted data keys

The menu stores customer preferences and order history in `localStorage`. These keys are shared by both builds:

- `nima.lang` – preferred language (`ar` or `en`).
- `nima.mode` – theme (`dark` or `light`).
- `nima.customerProfile` – saved name and phone number.
- `nima.customerRegistry` – known customers for multi-guest logs.
- `nima.orderLog` – history of orders sent from the device.
- `nima.loyaltyTracker` – loyalty counts per drink.

Clearing browser storage resets the greeting, loyalty counts, and saved customer details.
