# Neema Café Menu

This repo contains two builds of the interactive Neema Café menu:

- `index.html` – the production-ready build with the full loyalty and logging experience.
- `menu` – the compact legacy build that shares the same functionality and strings.
- `menu-data.js` – the shared catalogue of drinks and desserts that both builds render.
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
