# Purchase Order Product Combobox

**Date:** 2026-03-15
**Status:** Approved

## Summary

Replace the plain `<select>` in the New PO form's line-item rows with a typeahead combobox. Users can type a product name to filter the list and select from matching results, rather than scrolling through a full dropdown.

## Context

All code lives in `src/App.jsx`. The purchasing section renders a New PO form when `poForm === true`. Line items are stored in `poFormData.items` (array of `{ product_id, name, qty }`). Available products for the selected venue are fetched into `poVenueProducts` (array of `{ id, name }`) when a venue is chosen.

The current UI at lines 4112–4118 uses a plain `<select>` when `poVenueProducts.length > 0`, and a manual text input otherwise.

## Design

### New Component: `POProductCombobox`

A small functional component defined inline in `App.jsx`. To retain access to `inputStyle`, it must be defined as an **inner function inside the same render scope where `inputStyle` is defined** (the purchasing section), not as a top-level component. No new files needed.

**Props:**
- `products` — the `poVenueProducts` array (`{ id, name }[]`)
- `value` — current `product_id` for this line item (or `""`)
- `onChange(productId, productName)` — called when user selects a product
- `inputStyle` — passed in from the outer scope so the input matches the rest of the form

**Internal state and refs:**
- `inputVal` (string) — text currently shown in the input
- `open` (boolean) — controls dropdown visibility
- `containerRef` — a `useRef` attached to the outer wrapper `div`; used by the outside-click effect to call `containerRef.current.contains(e.target)`

**`inputVal` sync:** A `useEffect` watches `value`. When `value` changes to a new non-empty product ID (i.e., an external/programmatic selection), sync `inputVal` to the matching product name. Do **not** sync when `value` is empty or unchanged — this avoids overwriting text the user is actively typing.

**Filtering:** Case-insensitive substring match of `inputVal` against `product.name`. Shows all products when `inputVal` is empty and the input is focused.

**Selection:** Clicking a suggestion sets `inputVal` to the product name, calls `onChange(product.id, product.name)`, and closes the dropdown.

**Clear:** If the user clears the input text, `onChange("", "")` is called to reset `product_id`.

**Close on outside click:** A `useEffect` adds a `mousedown` listener on `document`; it checks `containerRef.current.contains(e.target)` and closes the dropdown when the click is outside.

**Keyboard interaction:** Out of scope for this iteration. Arrow-key navigation and Enter/Escape are not implemented. The component is mouse/touch only.

### Replacement

Lines 4112–4118 (the `<select>`) are replaced with:

```jsx
<POProductCombobox
  products={poVenueProducts}
  value={it.product_id || ""}
  onChange={(pid, pname) => {
    const items = [...poFormData.items];
    items[idx] = { ...items[idx], product_id: pid || null, name: pname };
    setPOFormData(d => ({ ...d, items }));
  }}
/>
```

The manual-text-input fallback (lines 4119–4121, shown when `poVenueProducts.length === 0`) is retained unchanged.

### Styling

- Input uses existing `inputStyle` with `flex: 2`
- Dropdown: `position: absolute`, `zIndex: 200`, white/dark background matching `DS.colors.surface`, border `DS.colors.border`, `borderRadius: 6`, `boxShadow`
- Hover row: background `DS.colors.accent + "22"`, cursor pointer
- Parent container: `position: relative`, `flex: 2`

## Acceptance Criteria

1. Typing in the product input filters the list to matching products in real time.
2. Clicking a suggestion populates the input with the product name and saves `product_id`.
3. Clicking outside dismisses the dropdown.
4. Clearing the input resets the product selection.
5. When no venue is selected (no products loaded), the existing manual text input is shown unchanged.
6. Visual styling is consistent with the rest of the admin UI.
