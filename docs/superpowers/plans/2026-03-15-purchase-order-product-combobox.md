# Purchase Order Product Combobox Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain `<select>` in the New PO form's line-item rows with a typeahead combobox that filters products as the user types.

**Architecture:** A new `POProductCombobox` React component is defined at the top level of `src/App.jsx` (just above `AdminView`), accepting `inputStyle` as a prop. The existing `<select>` at lines 4112–4118 is replaced with this component. All other purchase order logic is unchanged.

**Tech Stack:** React (useState, useEffect, useRef), inline styles via DS.colors, Supabase (no changes needed)

---

## Chunk 1: Implement POProductCombobox and wire it in

### Task 1: Add the POProductCombobox component

**Files:**
- Modify: `src/App.jsx` — add component just above line 3475 (`function AdminView()`)

**Important note on placement:** The spec (`docs/superpowers/specs/2026-03-15-purchase-order-product-combobox-design.md`, line 20) originally suggested defining the component as an inner function inside `AdminView`. **This plan intentionally overrides that guidance.** Defining a component inside a render function causes React to see a new component type on every render, unmounting/remounting it and breaking hooks. The correct approach is a top-level component with `inputStyle` passed as a prop. The spec's intent (style consistency) is fully preserved; only the placement changes.

- [ ] **Step 1: Locate the insertion point**

Open `src/App.jsx`. Find line 3475:
```
function AdminView() {
```
The new component goes on the line immediately before this.

- [ ] **Step 2: Insert the POProductCombobox component**

Add this block immediately before `function AdminView() {`:

```jsx
function POProductCombobox({ products, value, onChange, inputStyle }) {
  const [inputVal, setInputVal] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  // Sync display text when value is set externally (e.g. reorder alert pre-fill)
  React.useEffect(() => {
    if (!value) return;
    const match = products.find(p => p.id === value);
    if (match) setInputVal(match.name);
  }, [value, products]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = inputVal
    ? products.filter(p => p.name.toLowerCase().includes(inputVal.toLowerCase()))
    : products;

  const handleChange = e => {
    const val = e.target.value;
    setInputVal(val);
    setOpen(true);
    if (!val) onChange("", "");
  };

  const handleSelect = product => {
    setInputVal(product.name);
    onChange(product.id, product.name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 2 }}>
      <input
        style={{ ...inputStyle, width: "100%" }}
        value={inputVal}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder="Search product…"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 200,
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          maxHeight: 220,
          overflowY: "auto",
          marginTop: 2,
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                color: DS.colors.text,
              }}
              onMouseEnter={e => e.currentTarget.style.background = DS.colors.accent + "22"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify no syntax errors**

Run:
```bash
cd /Users/tony/jarvid && npm run build 2>&1 | head -30
```
Expected: build succeeds with no errors. If there are errors, fix them before continuing.

---

### Task 2: Replace the `<select>` with the combobox

**Files:**
- Modify: `src/App.jsx` lines 4112–4118 (the `<select>` block inside the line-items map)

- [ ] **Step 1: Locate the select element**

Find this block (currently around lines 4111–4118):
```jsx
{poVenueProducts.length > 0 ? (
  <select style={{ ...inputStyle, flex: 2 }} value={it.product_id || ""} onChange={e => {
    const p = poVenueProducts.find(p => p.id === e.target.value);
    const items = [...poFormData.items]; items[idx] = { ...items[idx], product_id: e.target.value, name: p?.name || "" }; setPOFormData(d => ({ ...d, items }));
  }}>
    <option value="">— Select product —</option>
    {poVenueProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
  </select>
) : (
```

- [ ] **Step 2: Replace the `<select>` with `<POProductCombobox>`**

Replace the `<select>...</select>` (keeping the ternary structure intact) so it reads:

```jsx
{poVenueProducts.length > 0 ? (
  <POProductCombobox
    products={poVenueProducts}
    value={it.product_id || ""}
    onChange={(pid, pname) => {
      const items = [...poFormData.items];
      items[idx] = { ...items[idx], product_id: pid || null, name: pname };
      setPOFormData(d => ({ ...d, items }));
    }}
    inputStyle={inputStyle}
  />
) : (
```

Leave the fallback `<input>` (the `: (` branch) completely unchanged.

- [ ] **Step 3: Build and verify**

```bash
cd /Users/tony/jarvid && npm run build 2>&1 | head -30
```
Expected: clean build, no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/tony/jarvid && git add src/App.jsx && git commit -m "feat: replace PO product select with typeahead combobox"
```

---

### Task 3: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/tony/jarvid && npm run dev
```

- [ ] **Step 2: Navigate to Purchasing tab**

Open the app in a browser. Go to Admin → Purchasing.

- [ ] **Step 3: Open a new PO and select a venue**

Click "New PO". Choose a venue with known products.

- [ ] **Step 4: Add a line item and type to filter**

Click "+ Add Item". In the product field, type the first few letters of a known product name.
Expected: dropdown appears with matching products filtered in real time.

- [ ] **Step 5: Select a product**

Click a suggestion.
Expected: input shows the product name, dropdown closes, `product_id` is stored (verifiable by saving as draft and checking the PO details).

- [ ] **Step 6: Click outside**

Click elsewhere on the page while the dropdown is open.
Expected: dropdown closes.

- [ ] **Step 7: Clear the input**

Select a product, then delete all text from the input.
Expected: product selection resets (product_id becomes null).

- [ ] **Step 8: Test no-venue state**

Cancel and re-open the New PO form without selecting a venue. Click "+ Add Item".
Expected: manual text input shown (original fallback), not the combobox.

- [ ] **Step 9: Stop dev server**

Press Ctrl+C.
