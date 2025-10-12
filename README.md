# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – the shared catalogue of drinks and desserts that both builds render.
- `menu-admin.html` – لوحة تحكم باللغة العربية لتحديث بيانات المنيو، مع حفظ محلي وتصدير JSON.
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

1. **لوحة التحكم (`menu-admin.html`)** – صفحة تفاعلية تسمح بإضافة الأصناف، حذفها، تعديل الأسعار، الصور، والوصف مع حفظ تلقائي في `localStorage`. بعد حفظ التعديلات سيقرأ كل من `index.html` و`menu` البيانات المحدّثة مباشرة عند فتحهما من نفس المتصفح. يمكنك أيضًا تصدير ملف JSON أو استيراده لمشاركة التعديلات.
2. **تعديل الملف يدويًا** – ما زال بالإمكان تحرير `menu-data.js` مباشرة لتغيير الأسعار أو البطاقات. هذا الخيار مفيد عند نشر التغييرات في المستودع أو مشاركة الملف مع بقية الفريق.

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
