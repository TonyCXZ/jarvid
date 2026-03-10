import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// DESIGN SYSTEM — Industrial/Neon Dark Theme
// ============================================================
const DS = {
  colors: {
    bg: "#0a0a0f",
    surface: "#12121a",
    card: "#1a1a26",
    cardHover: "#20202e",
    border: "#2a2a3e",
    accent: "#00f5c4",
    accentDim: "#00c49a",
    accentGlow: "rgba(0,245,196,0.15)",
    danger: "#ff4757",
    dangerGlow: "rgba(255,71,87,0.15)",
    warn: "#ffa502",
    warnGlow: "rgba(255,165,2,0.15)",
    purple: "#7c5cbf",
    blue: "#2f86eb",
    text: "#e8e8f0",
    textSub: "#8888aa",
    textMuted: "#555570",
    white: "#ffffff",
  },
  font: {
    display: "'Barlow Condensed', sans-serif",
    body: "'DM Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};

// ============================================================
// MOCK DATA
// ============================================================
const PRODUCTS = [
  // — ELUX E-LIQUIDS —
  { id: 1,  name: "Elux Blueberry Sour Raspberry", brand: "ELUX", category: "eliquid", price: 4.99, stock: 18, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/ELUX_BSR_palf6u.webp", flavour: "Blueberry Sour Raspberry", nicotine: "20mg", popular: true },
  { id: 2,  name: "Elux Grape", brand: "ELUX", category: "eliquid", price: 4.99, stock: 22, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_G_ggjfdx.jpg", flavour: "Grape", nicotine: "20mg", popular: false },
  { id: 3,  name: "Elux Triple Mango", brand: "ELUX", category: "eliquid", price: 4.99, stock: 15, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_TM_ym4ran.webp", flavour: "Triple Mango", nicotine: "20mg", popular: true },
  { id: 4,  name: "Elux Lemon & Lime", brand: "ELUX", category: "eliquid", price: 4.99, stock: 30, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_LL_fjtz1g.webp", flavour: "Lemon & Lime", nicotine: "20mg", popular: false },
  { id: 5,  name: "Elux Blackcurrant Menthol", brand: "ELUX", category: "eliquid", price: 4.99, stock: 12, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_BCM_uzoisf.webp", flavour: "Blackcurrant Menthol", nicotine: "20mg", popular: false },
  { id: 6,  name: "Elux Gummy Bear", brand: "ELUX", category: "eliquid", price: 4.99, stock: 25, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_GB_gb5saj.webp", flavour: "Gummy Bear", nicotine: "20mg", popular: true },
  { id: 7,  name: "Elux Rainbow", brand: "ELUX", category: "eliquid", price: 4.99, stock: 20, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_RB_jzcjcc.webp", flavour: "Rainbow", nicotine: "20mg", popular: false },
  { id: 8,  name: "Elux Pink Lemonade", brand: "ELUX", category: "eliquid", price: 4.99, stock: 17, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_PL_udlxfw.webp", flavour: "Pink Lemonade", nicotine: "20mg", popular: true },
  { id: 9,  name: "Elux Cherry Ice", brand: "ELUX", category: "eliquid", price: 4.99, stock: 14, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135604/ELUX_CI_ujyqig.jpg", flavour: "Cherry Ice", nicotine: "20mg", popular: false },
  // — HAYATI PRO MAX PREFILLED POD KITS —
  { id: 10, name: "Hayati Pro Max Blueberry Cherry Cranberry", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 10, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_BCC_rkwht7.webp", flavour: "Blueberry Cherry Cranberry", nicotine: "20mg", popular: true },
  { id: 11, name: "Hayati Pro Max Fizzy Cherry", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 8, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_FC_cufyt4.jpg", flavour: "Fizzy Cherry", nicotine: "20mg", popular: false },
  { id: 12, name: "Hayati Pro Max Cherry Cola", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 13, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_CC_y2netl.webp", flavour: "Cherry Cola", nicotine: "20mg", popular: true },
  { id: 13, name: "Hayati Pro Max Blue Razz Lemonade", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 9, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_BRL_dgu9tm.webp", flavour: "Blue Razz Lemonade", nicotine: "20mg", popular: false },
  { id: 14, name: "Hayati Pro Max Strawberry GB", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 16, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_SGB_cgex16.webp", flavour: "Strawberry Gummy Bear", nicotine: "20mg", popular: true },
  { id: 15, name: "Hayati Pro Max Strawberry Watermelon", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 11, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_SW_cacgmx.webp", flavour: "Strawberry Watermelon", nicotine: "20mg", popular: false },
  { id: 16, name: "Hayati Pro Max Fresh Mint", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 7, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_FM_mcrvan.jpg", flavour: "Fresh Mint", nicotine: "20mg", popular: false },
  { id: 17, name: "Hayati Pro Max Mr Blue", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 19, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_MR_B_k3aomt.jpg", flavour: "Mr Blue", nicotine: "20mg", popular: true },
  { id: 18, name: "Hayati Pro Max Summer Dream", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 6, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_SD_yjduqr.jpg", flavour: "Summer Dream", nicotine: "20mg", popular: false },
  { id: 19, name: "Hayati Pro Max Mad Blue", brand: "HAYATI", category: "prefilled_pod", price: 12.00, stock: 14, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135605/HPMP_MAD_B_scvawj.webp", flavour: "Mad Blue", nicotine: "20mg", popular: false },
  // — REFILLABLE POD KITS & PODS —
  { id: 20, name: "Vaporesso XROS 5 Mini", brand: "VAPORESSO", category: "refillable_kit", price: 17.99, stock: 10, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135974/VAPORESSO_XROS_5_Mini_ny2sxk.webp", flavour: "Available in Black, Pink, White, Blue", nicotine: "N/A", popular: true },
  { id: 21, name: "Vaporesso XROS 0.6 Pods", brand: "VAPORESSO", category: "refillable_pods", price: 5.00, stock: 24, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135974/XROS_PODS_mmb7nf.webp", flavour: "Replacement Pods", nicotine: "N/A", popular: true },
  { id: 22, name: "OXVA XLIM Go 2", brand: "OXVA", category: "refillable_kit", price: 12.99, stock: 8, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135974/OXVA_XLIM_GO_2_jbvpzw.webp", flavour: "Available in Black, Pink, White, Blue", nicotine: "N/A", popular: true },
  { id: 23, name: "OXVA XLIM 0.8 Pods", brand: "OXVA", category: "refillable_pods", price: 5.00, stock: 20, imageUrl: "https://res.cloudinary.com/dpiod1vue/image/upload/v1773135972/Oxva_Xlim_pods_kgz30w.webp", flavour: "Replacement Pods", nicotine: "N/A", popular: true },
];

const CATEGORIES = [
  { id: "all",           label: "All",              icon: "✦" },
  { id: "eliquid",       label: "E-Liquids",        icon: "💧" },
  { id: "prefilled_pod", label: "Prefilled Pods",   icon: "🫧" },
  { id: "refillable_kit",label: "Refillable Kits",  icon: "⚡" },
  { id: "refillable_pods",label: "Replacement Pods",icon: "🔄" },
];

const MOCK_ORDERS = [
  { id: "ORD-001", items: [{ name: "Elux Blueberry Sour Raspberry", qty: 2, price: 4.99 }], total: 9.98, status: "pending", time: "2 min ago", ageVerified: "Yoti", kiosk: "Kiosk 1" },
  { id: "ORD-002", items: [{ name: "Hayati Pro Max Mr Blue", qty: 1, price: 12.00 }, { name: "Vaporesso XROS 0.6 Pods", qty: 1, price: 5.00 }], total: 17.00, status: "preparing", time: "5 min ago", ageVerified: "ID Scan", kiosk: "Kiosk 2" },
  { id: "ORD-003", items: [{ name: "OXVA XLIM Go 2", qty: 1, price: 12.99 }], total: 12.99, status: "completed", time: "12 min ago", ageVerified: "Manual", kiosk: "Kiosk 1" },
];

const VENUES = [
  { id: 1, name: "The Crown Pub", location: "Manchester", kiosks: 2, todaySales: 342.50, status: "online" },
  { id: 2, name: "Vape HQ Shop", location: "London", kiosks: 3, todaySales: 891.20, status: "online" },
  { id: 3, name: "The Fox & Hound", location: "Birmingham", kiosks: 1, todaySales: 156.80, status: "offline" },
  { id: 4, name: "Cloud Nine Vapes", location: "Leeds", kiosks: 2, todaySales: 423.60, status: "online" },
];

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body, #root {
      width: 100%; height: 100%;
      background: ${DS.colors.bg};
      color: ${DS.colors.text};
      font-family: ${DS.font.body};
      overflow: hidden;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${DS.colors.surface}; }
    ::-webkit-scrollbar-thumb { background: ${DS.colors.border}; border-radius: 2px; }

    .app-root {
      width: 100vw; height: 100vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* NAV */
    .top-nav {
      display: flex; align-items: center; gap: 0;
      background: ${DS.colors.surface};
      border-bottom: 1px solid ${DS.colors.border};
      padding: 0 24px; height: 56px; flex-shrink: 0;
    }
    .nav-logo {
      font-family: ${DS.font.display};
      font-weight: 900; font-size: 22px;
      letter-spacing: 0.05em;
      color: ${DS.colors.accent};
      margin-right: 32px;
    }
    .nav-logo span { color: ${DS.colors.textSub}; }
    .nav-tabs { display: flex; gap: 2px; flex: 1; }
    .nav-tab {
      padding: 6px 16px; border-radius: 6px;
      font-size: 13px; font-weight: 500;
      color: ${DS.colors.textSub};
      cursor: pointer; border: none;
      background: transparent; transition: all 0.15s;
      letter-spacing: 0.01em;
    }
    .nav-tab:hover { color: ${DS.colors.text}; background: ${DS.colors.card}; }
    .nav-tab.active { color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .nav-right { display: flex; align-items: center; gap: 12px; }
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 6px;
      background: ${DS.colors.danger}; color: white;
      border-radius: 10px; font-size: 11px; font-weight: 700;
    }

    /* LAYOUT */
    .main-content { flex: 1; overflow: hidden; display: flex; }

    /* KIOSK */
    .kiosk-shell {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      background: linear-gradient(160deg, #0d0d18 0%, #0a0a10 100%);
      overflow: hidden;
    }

    /* WELCOME */
    .welcome-screen {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 40px; padding: 40px; text-align: center;
      background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,245,196,0.06) 0%, transparent 70%);
    }
    .welcome-logo {
      font-family: ${DS.font.display};
      font-weight: 900; font-size: 72px;
      letter-spacing: 0.08em;
      color: ${DS.colors.white};
      line-height: 1;
    }
    .welcome-logo .glow { color: ${DS.colors.accent}; text-shadow: 0 0 40px ${DS.colors.accent}; }
    .welcome-sub {
      font-size: 20px; color: ${DS.colors.textSub};
      font-weight: 300; letter-spacing: 0.06em; text-transform: uppercase;
    }
    .welcome-age-notice {
      padding: 18px 28px; border: 1px solid ${DS.colors.warn};
      border-radius: 8px; background: ${DS.colors.warnGlow};
      color: ${DS.colors.warn}; font-size: 15px; font-weight: 500;
      letter-spacing: 0.02em; max-width: 520px;
      text-align: center; line-height: 1.7;
    }
    .btn-primary {
      padding: 20px 64px; border-radius: 12px;
      font-family: ${DS.font.display};
      font-size: 28px; font-weight: 700; letter-spacing: 0.08em;
      background: ${DS.colors.accent}; color: ${DS.colors.bg};
      border: none; cursor: pointer;
      box-shadow: 0 0 40px rgba(0,245,196,0.4);
      transition: all 0.2s;
      text-transform: uppercase;
    }
    .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 60px rgba(0,245,196,0.6); }
    .btn-primary:active { transform: scale(0.99); }

    /* BROWSE */
    .browse-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .browse-header {
      padding: 16px 20px 0;
      display: flex; align-items: center; gap: 16px;
      flex-shrink: 0;
    }
    .browse-title {
      font-family: ${DS.font.display};
      font-size: 28px; font-weight: 800;
      letter-spacing: 0.05em; color: ${DS.colors.white};
      flex: 1;
    }
    .cart-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 20px; border-radius: 10px;
      background: ${DS.colors.accentGlow};
      border: 1px solid ${DS.colors.accent};
      color: ${DS.colors.accent};
      font-size: 16px; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
    }
    .cart-btn:hover { background: rgba(0,245,196,0.25); }

    .cat-bar {
      display: flex; gap: 8px; padding: 12px 20px;
      overflow-x: auto; flex-shrink: 0;
    }
    .cat-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; border-radius: 8px;
      font-size: 14px; font-weight: 500;
      border: 1px solid ${DS.colors.border};
      background: ${DS.colors.card}; color: ${DS.colors.textSub};
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
    }
    .cat-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.text}; }
    .cat-btn.active { border-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      grid-auto-rows: max-content;
      align-items: start;
      gap: 14px; padding: 14px 20px 28px;
    }
    .product-card {
      background: ${DS.colors.card};
      border: 1px solid ${DS.colors.border};
      border-radius: 12px; padding: 14px;
      transition: all 0.15s;
      display: flex; flex-direction: column; gap: 7px;
      position: relative;
      height: auto;
    }
    .product-card:hover { border-color: ${DS.colors.accent}; transform: translateY(-2px); background: ${DS.colors.cardHover}; }
    .product-card.in-cart { border-color: ${DS.colors.accent}; background: rgba(0,245,196,0.05); }
    .product-card.low-stock { border-color: ${DS.colors.warn}; }
    .popular-badge {
      position: absolute; top: 10px; right: 10px;
      padding: 2px 8px; border-radius: 4px;
      background: ${DS.colors.accent}; color: ${DS.colors.bg};
      font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .product-image {
      width: 100%; height: 120px; object-fit: contain;
      border-radius: 8px; background: rgba(255,255,255,0.04);
      display: block; transition: opacity 0.3s;
    }
    .product-image-wrap {
      width: 100%; height: 120px; border-radius: 8px;
      background: rgba(255,255,255,0.04);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; position: relative;
    }
    .product-image-wrap .fallback-emoji {
      font-size: 48px;
    }
    .product-brand { font-size: 11px; color: ${DS.colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em; }
    .product-name { font-size: 14px; font-weight: 600; color: ${DS.colors.text}; line-height: 1.3; }
    .product-flavour { font-size: 12px; color: ${DS.colors.textSub}; }
    .product-nic {
      font-size: 11px; padding: 2px 8px; border-radius: 4px;
      background: rgba(124,92,191,0.2); color: ${DS.colors.purple};
      width: fit-content; font-weight: 500;
    }
    .product-price {
      font-family: ${DS.font.display};
      font-size: 22px; font-weight: 700;
      color: ${DS.colors.accent};
    }
    .product-stock { font-size: 11px; color: ${DS.colors.textMuted}; }
    .low-stock-tag { color: ${DS.colors.warn}; }
    .in-cart-indicator {
      position: absolute; bottom: 10px; right: 10px;
      width: 24px; height: 24px; border-radius: 12px;
      background: ${DS.colors.accent}; color: ${DS.colors.bg};
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .product-qty-row {
      display: flex; align-items: center; gap: 8px;
      margin-top: 4px;
    }
    .product-qty-btn {
      width: 36px; height: 36px; border-radius: 8px;
      border: 1.5px solid ${DS.colors.border};
      background: ${DS.colors.surface};
      color: ${DS.colors.text}; font-size: 20px; font-weight: 300;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; flex-shrink: 0; line-height: 1;
    }
    .product-qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .product-qty-btn.minus:hover { border-color: ${DS.colors.danger}; color: ${DS.colors.danger}; background: ${DS.colors.dangerGlow}; }
    .product-qty-btn:active { transform: scale(0.93); }
    .product-qty-num {
      flex: 1; text-align: center;
      font-family: ${DS.font.display}; font-size: 20px; font-weight: 800;
      color: ${DS.colors.accent};
    }
    .product-add-btn {
      width: 100%; height: 36px; border-radius: 8px;
      border: 1.5px solid ${DS.colors.border};
      background: ${DS.colors.surface};
      color: ${DS.colors.textSub}; font-size: 22px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; margin-top: 4px;
    }
    .product-add-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .product-add-btn:active { transform: scale(0.97); }

    /* CART DRAWER */
    .cart-overlay {
      position: absolute; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      display: flex; justify-content: flex-end;
    }
    .cart-drawer {
      width: 360px; height: 100%;
      background: ${DS.colors.surface};
      border-left: 1px solid ${DS.colors.border};
      display: flex; flex-direction: column;
      animation: slideIn 0.2s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .cart-header {
      padding: 20px; border-bottom: 1px solid ${DS.colors.border};
      display: flex; align-items: center; justify-content: space-between;
    }
    .cart-title { font-family: ${DS.font.display}; font-size: 24px; font-weight: 800; }
    .close-btn {
      width: 36px; height: 36px; border-radius: 8px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      color: ${DS.colors.textSub}; font-size: 18px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .cart-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .cart-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 10px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
    }
    .cart-item-emoji { font-size: 28px; }
    .cart-item-info { flex: 1; }
    .cart-item-name { font-size: 14px; font-weight: 600; }
    .cart-item-price { font-size: 13px; color: ${DS.colors.textSub}; }
    .qty-control {
      display: flex; align-items: center; gap: 8px;
    }
    .qty-btn {
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid ${DS.colors.border};
      background: ${DS.colors.surface};
      color: ${DS.colors.text}; font-size: 16px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.1s;
    }
    .qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .qty-num { font-weight: 700; font-size: 15px; min-width: 20px; text-align: center; }

    .cart-footer { padding: 16px; border-top: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 12px; }
    .cart-total-row { display: flex; justify-content: space-between; align-items: center; }
    .cart-total-label { font-size: 15px; color: ${DS.colors.textSub}; }
    .cart-total-value { font-family: ${DS.font.display}; font-size: 28px; font-weight: 800; color: ${DS.colors.accent}; }

    /* AGE VERIFICATION */
    .age-verify-screen {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 32px; padding: 40px; text-align: center;
    }
    .age-heading {
      font-family: ${DS.font.display};
      font-size: 48px; font-weight: 900;
      letter-spacing: 0.06em; color: ${DS.colors.white};
    }
    .age-sub { font-size: 17px; color: ${DS.colors.textSub}; max-width: 400px; }
    .verify-options { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .verify-option {
      width: 180px; padding: 28px 20px; border-radius: 16px;
      background: ${DS.colors.card}; border: 2px solid ${DS.colors.border};
      cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      text-align: center;
    }
    .verify-option:hover { border-color: ${DS.colors.accent}; transform: translateY(-4px); background: ${DS.colors.cardHover}; }
    .verify-icon { font-size: 48px; }
    .verify-label { font-size: 15px; font-weight: 600; color: ${DS.colors.text}; }
    .verify-desc { font-size: 12px; color: ${DS.colors.textSub}; }

    .scanning-animation {
      width: 240px; height: 240px; border-radius: 20px;
      border: 2px solid ${DS.colors.accent};
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      background: rgba(0,245,196,0.03);
      position: relative; overflow: hidden;
    }
    .scan-line {
      position: absolute; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, ${DS.colors.accent}, transparent);
      animation: scanMove 2s linear infinite;
    }
    @keyframes scanMove {
      0% { top: 0; }
      100% { top: 100%; }
    }
    .scan-text { font-size: 15px; color: ${DS.colors.accent}; font-weight: 500; z-index: 1; }

    /* PAYMENT */
    .payment-screen {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 28px; padding: 40px;
    }
    .payment-heading { font-family: ${DS.font.display}; font-size: 48px; font-weight: 900; letter-spacing: 0.06em; }
    .payment-amount {
      font-family: ${DS.font.display}; font-size: 80px; font-weight: 900;
      color: ${DS.colors.accent};
      text-shadow: 0 0 40px rgba(0,245,196,0.3);
    }
    .payment-terminal {
      width: 280px; padding: 28px; border-radius: 20px;
      background: ${DS.colors.card}; border: 2px solid ${DS.colors.border};
      display: flex; flex-direction: column; align-items: center; gap: 20px;
    }
    .nfc-icon {
      width: 80px; height: 80px;
      border: 3px solid ${DS.colors.accent};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0,245,196,0.4); }
      50% { box-shadow: 0 0 0 20px rgba(0,245,196,0); }
    }
    .pay-methods { display: flex; gap: 10px; }
    .pay-method {
      padding: 8px 16px; border-radius: 8px;
      border: 1px solid ${DS.colors.border};
      background: ${DS.colors.surface};
      font-size: 13px; font-weight: 500;
      color: ${DS.colors.textSub};
    }

    /* ORDER CONFIRMATION */
    .confirm-screen {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 28px; padding: 40px; text-align: center;
    }
    .confirm-icon {
      font-size: 80px;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
    .confirm-heading { font-family: ${DS.font.display}; font-size: 52px; font-weight: 900; letter-spacing: 0.06em; color: ${DS.colors.accent}; }
    .order-id {
      font-family: ${DS.font.mono}; font-size: 24px;
      color: ${DS.colors.textSub}; letter-spacing: 0.1em;
    }
    .confirm-items { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
    .confirm-item {
      display: flex; justify-content: space-between;
      padding: 10px 16px; border-radius: 8px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      font-size: 14px;
    }

    /* ========== STAFF DASHBOARD ========== */
    .staff-layout {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .staff-header {
      padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid ${DS.colors.border};
      flex-shrink: 0;
    }
    .staff-heading { font-family: ${DS.font.display}; font-size: 26px; font-weight: 800; }
    .staff-meta { font-size: 13px; color: ${DS.colors.textSub}; }
    .orders-grid {
      flex: 1; overflow-y: auto;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px; padding: 20px;
    }
    .order-card {
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      border-radius: 14px; padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.2s;
    }
    .order-card.pending { border-left: 4px solid ${DS.colors.warn}; }
    .order-card.preparing { border-left: 4px solid ${DS.colors.blue}; }
    .order-card.completed { border-left: 4px solid ${DS.colors.accent}; opacity: 0.6; }
    .order-header { display: flex; align-items: center; justify-content: space-between; }
    .order-id-tag { font-family: ${DS.font.mono}; font-size: 14px; font-weight: 600; color: ${DS.colors.accent}; }
    .status-pill {
      padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .status-pending { background: ${DS.colors.warnGlow}; color: ${DS.colors.warn}; border: 1px solid ${DS.colors.warn}; }
    .status-preparing { background: rgba(47,134,235,0.15); color: ${DS.colors.blue}; border: 1px solid ${DS.colors.blue}; }
    .status-completed { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .order-items-list { display: flex; flex-direction: column; gap: 6px; }
    .order-item-row { display: flex; justify-content: space-between; font-size: 13px; color: ${DS.colors.textSub}; }
    .order-item-name { color: ${DS.colors.text}; }
    .order-total-row {
      display: flex; justify-content: space-between;
      padding-top: 10px; border-top: 1px solid ${DS.colors.border};
      font-weight: 600;
    }
    .order-total-amount { color: ${DS.colors.accent}; font-family: ${DS.font.display}; font-size: 18px; }
    .order-meta { display: flex; gap: 16px; font-size: 12px; color: ${DS.colors.textMuted}; }
    .order-actions { display: flex; gap: 8px; }
    .btn-action {
      flex: 1; padding: 10px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.15s;
    }
    .btn-approve { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .btn-approve:hover { background: rgba(0,245,196,0.3); }
    .btn-complete { background: ${DS.colors.accent}; color: ${DS.colors.bg}; }
    .btn-complete:hover { background: ${DS.colors.accentDim}; }
    .btn-reject { background: ${DS.colors.dangerGlow}; color: ${DS.colors.danger}; border: 1px solid ${DS.colors.danger}; }
    .btn-reject:hover { background: rgba(255,71,87,0.3); }

    /* ========== MANAGER DASHBOARD ========== */
    .manager-layout {
      width: 100%; height: 100%;
      display: flex; overflow: hidden;
    }
    .sidebar {
      width: 220px; flex-shrink: 0;
      background: ${DS.colors.surface};
      border-right: 1px solid ${DS.colors.border};
      padding: 20px 0; display: flex; flex-direction: column; gap: 4px;
    }
    .sidebar-section { padding: 8px 16px 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .sidebar-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; cursor: pointer;
      font-size: 14px; color: ${DS.colors.textSub};
      transition: all 0.1s; border-left: 2px solid transparent;
    }
    .sidebar-item:hover { color: ${DS.colors.text}; background: rgba(255,255,255,0.03); }
    .sidebar-item.active { color: ${DS.colors.accent}; border-left-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .manager-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }

    /* STATS */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat-card {
      padding: 20px; border-radius: 12px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      display: flex; flex-direction: column; gap: 8px;
    }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .stat-value { font-family: ${DS.font.display}; font-size: 32px; font-weight: 800; color: ${DS.colors.white}; }
    .stat-delta { font-size: 13px; }
    .delta-up { color: ${DS.colors.accent}; }
    .delta-down { color: ${DS.colors.danger}; }

    /* CHART */
    .chart-card {
      padding: 20px; border-radius: 12px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
    }
    .chart-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
    .bar-fill { width: 100%; border-radius: 3px 3px 0 0; background: ${DS.colors.accent}; transition: height 0.5s; min-height: 4px; opacity: 0.8; }
    .bar-label { font-size: 10px; color: ${DS.colors.textMuted}; }
    .bar-val { font-size: 10px; color: ${DS.colors.textSub}; }

    /* TABLE */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left; padding: 10px 14px;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
      color: ${DS.colors.textMuted}; font-weight: 600;
      border-bottom: 1px solid ${DS.colors.border};
    }
    .data-table td {
      padding: 12px 14px; font-size: 13px;
      border-bottom: 1px solid rgba(42,42,62,0.5);
      color: ${DS.colors.textSub};
    }
    .data-table td:first-child { color: ${DS.colors.text}; font-weight: 500; }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }

    /* PRODUCT MANAGEMENT TABLE */
    .prod-manage { display: flex; flex-direction: column; gap: 16px; }
    .prod-search-row { display: flex; gap: 12px; align-items: center; }
    .search-input {
      flex: 1; padding: 10px 14px; border-radius: 8px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      color: ${DS.colors.text}; font-size: 14px; outline: none;
      font-family: ${DS.font.body};
    }
    .search-input:focus { border-color: ${DS.colors.accent}; }
    .search-input::placeholder { color: ${DS.colors.textMuted}; }
    .btn-sm {
      padding: 10px 18px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      border: none; cursor: pointer; transition: all 0.15s;
    }
    .btn-outline { background: transparent; border: 1px solid ${DS.colors.border}; color: ${DS.colors.textSub}; }
    .btn-outline:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .btn-accent { background: ${DS.colors.accent}; color: ${DS.colors.bg}; }
    .btn-accent:hover { background: ${DS.colors.accentDim}; }

    /* COMPLIANCE */
    .compliance-log { display: flex; flex-direction: column; gap: 8px; }
    .log-entry {
      padding: 12px 16px; border-radius: 8px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      display: flex; align-items: center; gap: 16px;
      font-size: 13px;
    }
    .log-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0;
    }
    .log-dot-pass { background: ${DS.colors.accent}; }
    .log-dot-fail { background: ${DS.colors.danger}; }
    .log-time { color: ${DS.colors.textMuted}; font-family: ${DS.font.mono}; font-size: 12px; width: 80px; }
    .log-method { color: ${DS.colors.purple}; font-weight: 500; width: 100px; }
    .log-result-pass { color: ${DS.colors.accent}; font-weight: 600; }
    .log-result-fail { color: ${DS.colors.danger}; font-weight: 600; }
    .log-anon { color: ${DS.colors.textMuted}; font-size: 12px; font-family: ${DS.font.mono}; }

    /* ADMIN */
    .admin-layout { width: 100%; height: 100%; display: flex; overflow: hidden; }
    .venue-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .venue-card {
      padding: 20px; border-radius: 14px;
      background: ${DS.colors.card}; border: 1px solid ${DS.colors.border};
      display: flex; flex-direction: column; gap: 14px; cursor: pointer;
      transition: all 0.15s;
    }
    .venue-card:hover { border-color: ${DS.colors.accent}; transform: translateY(-2px); }
    .venue-top { display: flex; align-items: center; justify-content: space-between; }
    .venue-name { font-size: 16px; font-weight: 700; }
    .venue-loc { font-size: 13px; color: ${DS.colors.textSub}; }
    .online-dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-online { background: ${DS.colors.accent}; box-shadow: 0 0 8px ${DS.colors.accent}; }
    .dot-offline { background: ${DS.colors.danger}; }
    .venue-sales { font-family: ${DS.font.display}; font-size: 28px; font-weight: 800; color: ${DS.colors.white}; }
    .venue-meta { display: flex; gap: 16px; font-size: 12px; color: ${DS.colors.textMuted}; }
    .device-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; font-size: 13px; }
    .device-name { font-weight: 500; }
    .device-status { display: flex; align-items: center; gap: 6px; color: ${DS.colors.textSub}; }
    .btn-danger-sm { padding: 6px 14px; border-radius: 6px; background: ${DS.colors.dangerGlow}; border: 1px solid ${DS.colors.danger}; color: ${DS.colors.danger}; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* FOOTER / PROGRESS */
    .kiosk-progress {
      padding: 12px 20px; background: ${DS.colors.surface};
      border-top: 1px solid ${DS.colors.border};
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    .progress-steps { display: flex; align-items: center; gap: 8px; flex: 1; }
    .prog-step {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 500;
      color: ${DS.colors.textMuted};
    }
    .prog-step.done { color: ${DS.colors.accent}; }
    .prog-step.active { color: ${DS.colors.white}; }
    .prog-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: ${DS.colors.textMuted};
    }
    .prog-dot.done { background: ${DS.colors.accent}; }
    .prog-dot.active { background: ${DS.colors.white}; box-shadow: 0 0 8px white; }
    .prog-line { flex: 1; height: 1px; background: ${DS.colors.border}; max-width: 30px; }
    .prog-line.done { background: ${DS.colors.accent}; }

    .section-title { font-family: ${DS.font.display}; font-size: 20px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 4px; }
    .section-sub { font-size: 13px; color: ${DS.colors.textSub}; margin-bottom: 16px; }

    /* STOCK INDICATOR */
    .stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .stock-bar-bg { flex: 1; height: 4px; border-radius: 2px; background: ${DS.colors.border}; }
    .stock-bar-fill { height: 4px; border-radius: 2px; transition: width 0.3s; }

    /* SCHEMA VIEW */
    .schema-block {
      font-family: ${DS.font.mono}; font-size: 12px; line-height: 1.7;
      background: ${DS.colors.bg}; border: 1px solid ${DS.colors.border};
      border-radius: 10px; padding: 20px; overflow-x: auto;
      color: ${DS.colors.textSub};
    }
    .schema-block .kw { color: #7c5cbf; }
    .schema-block .tb { color: ${DS.colors.accent}; }
    .schema-block .cm { color: #555570; }
    .schema-block .str { color: #ff9f43; }

    .tag-pill {
      display: inline-flex; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    }
  `}</style>
);

// ============================================================
// UTILITY
// ============================================================
const fmt = (n) => `£${Number(n).toFixed(2)}`;
const uid = () => "ORD-" + Math.random().toString(36).substr(2, 4).toUpperCase();

// ============================================================
// PRODUCT IMAGE — with error fallback
// ============================================================
function ProductImage({ imageUrl, name, size = "card" }) {
  const [errored, setErrored] = useState(false);

  const FALLBACK_EMOJIS = {
    "ELUX": "💧", "HAYATI": "🫧", "VAPORESSO": "⚡", "OXVA": "🔋",
  };
  const brand = name?.split(" ")[0]?.toUpperCase();
  const fallback = FALLBACK_EMOJIS[brand] || "🛒";

  if (size === "card") {
    return (
      <div className="product-image-wrap">
        {!errored
          ? <img
              src={imageUrl}
              alt={name}
              className="product-image"
              onError={() => setErrored(true)}
              crossOrigin="anonymous"
            />
          : <span className="fallback-emoji">{fallback}</span>
        }
      </div>
    );
  }

  // Thumbnail size (cart, tables, rows)
  const thumbSize = size === "thumb" ? 48 : size === "row" ? 32 : 36;
  return errored
    ? <span style={{ fontSize: thumbSize * 0.7, width: thumbSize, height: thumbSize, display: "flex", alignItems: "center", justifyContent: "center" }}>{fallback}</span>
    : <img
        src={imageUrl}
        alt={name}
        crossOrigin="anonymous"
        onError={() => setErrored(true)}
        style={{ width: thumbSize, height: thumbSize, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.03)", flexShrink: 0 }}
      />;
}

// ============================================================
// KIOSK FLOW
// ============================================================
function KioskWelcome({ onStart }) {
  return (
    <div className="welcome-screen">
      <div>
        <div className="welcome-logo">
          J<span className="glow">arv</span>ID
        </div>
        <div className="welcome-sub">Compliance & Ordering Platform for Age-Restricted Retail</div>
      </div>
      <div className="welcome-age-notice">
        ⚠️ You must be 18 or over to purchase these products.
        Age verification is required before your order can be completed.
        Please have a valid form of ID ready — driving licence, passport, or Yoti digital ID.
      </div>
      <button className="btn-primary" onClick={onStart}>
        TAP TO START
      </button>
      <div style={{ fontSize: 13, color: DS.colors.textMuted }}>
        Staff Fulfilled · Age Verified · Fully Compliant
      </div>
      <div style={{
        fontSize: 12, color: DS.colors.textMuted,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: 6, padding: "6px 14px",
        letterSpacing: "0.04em"
      }}>
        ℹ️ This is not a vending machine. All orders are fulfilled by a member of staff.
      </div>
    </div>
  );
}

function KioskBrowse({ cart, onAddToCart, onRemoveFromCart, onCheckout }) {
  const [cat, setCat] = useState("all");
  const [showCart, setShowCart] = useState(false);

  const filtered = cat === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalPrice = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    return s + (p ? p.price * qty : 0);
  }, 0);

  return (
    <div className="browse-layout" style={{ position: "relative" }}>
      <div className="browse-header">
        <div className="browse-title">CHOOSE YOUR PRODUCTS</div>
        {totalItems > 0 && (
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            🛒 {totalItems} item{totalItems !== 1 ? "s" : ""} · {fmt(totalPrice)}
          </button>
        )}
      </div>

      <div className="cat-bar">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`cat-btn ${cat === c.id ? "active" : ""}`} onClick={() => setCat(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <div className="product-grid">
        {filtered.map(p => {
          const inCart = cart[p.id] || 0;
          const lowStock = p.stock < 5;
          return (
            <div
              key={p.id}
              className={`product-card ${inCart > 0 ? "in-cart" : ""} ${lowStock ? "low-stock" : ""}`}
            >
              {p.popular && <div className="popular-badge">HOT</div>}
              <ProductImage imageUrl={p.imageUrl} name={p.name} size="card" />
              <div className="product-brand">{p.brand}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-flavour">{p.flavour}</div>
              {p.nicotine !== "N/A" && <div className="product-nic">{p.nicotine}</div>}
              <div className="product-price">{fmt(p.price)}</div>
              <div className="product-stock">
                {lowStock ? <span className="low-stock-tag">⚠ Only {p.stock} left</span> : <span>{p.stock} in stock</span>}
              </div>
              {inCart > 0 ? (
                <div className="product-qty-row">
                  <button
                    className="product-qty-btn minus"
                    onClick={e => { e.stopPropagation(); onRemoveFromCart(p.id); }}
                  >−</button>
                  <div className="product-qty-num">{inCart}</div>
                  <button
                    className="product-qty-btn"
                    onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}
                  >+</button>
                </div>
              ) : (
                <button
                  className="product-add-btn"
                  onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}
                >+</button>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <div className="cart-title">YOUR BASKET</div>
              <button className="close-btn" onClick={() => setShowCart(false)}>✕</button>
            </div>
            <div className="cart-items">
              {Object.entries(cart).map(([id, qty]) => {
                const p = PRODUCTS.find(x => x.id === Number(id));
                if (!p) return null;
                return (
                  <div key={id} className="cart-item">
                    <ProductImage imageUrl={p.imageUrl} name={p.name} size="thumb" />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{p.name}</div>
                      <div className="cart-item-price">{fmt(p.price)} each</div>
                    </div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => onRemoveFromCart(id)}>−</button>
                      <div className="qty-num">{qty}</div>
                      <button className="qty-btn" onClick={() => onAddToCart(Number(id))}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-value">{fmt(totalPrice)}</span>
              </div>
              <button className="btn-primary" style={{ padding: "16px", fontSize: "20px" }}
                onClick={() => { setShowCart(false); onCheckout(); }}>
                CHECKOUT →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KioskAgeVerify({ onVerified, onBack }) {
  const [phase, setPhase] = useState("choose"); // choose | scanning | manual_wait | success
  const [method, setMethod] = useState(null);

  const startScan = (m) => {
    setMethod(m);
    setPhase("scanning");
    setTimeout(() => setPhase("success"), 3000);
  };

  const manualApproval = () => {
    setMethod("Staff Check");
    setPhase("manual_wait");
    setTimeout(() => setPhase("success"), 4000);
  };

  if (phase === "success") {
    return (
      <div className="age-verify-screen">
        <div style={{ fontSize: 80 }}>✅</div>
        <div className="age-heading" style={{ color: DS.colors.accent }}>AGE VERIFIED</div>
        <div className="age-sub">Your identity has been confirmed via <strong style={{ color: DS.colors.white }}>{method}</strong>. Proceeding to payment.</div>
        <button className="btn-primary" onClick={onVerified}>CONTINUE TO PAYMENT →</button>
      </div>
    );
  }

  if (phase === "manual_wait") {
    return (
      <div className="age-verify-screen">
        <div style={{ fontSize: 60 }}>👤</div>
        <div className="age-heading">STAFF VERIFICATION</div>
        <div className="age-sub">A staff member will verify your age shortly. Please wait…</div>
        <div className="scanning-animation" style={{ borderColor: DS.colors.warn }}>
          <div className="scan-line" style={{ background: `linear-gradient(90deg, transparent, ${DS.colors.warn}, transparent)` }} />
          <div style={{ fontSize: 40 }}>⏳</div>
          <div className="scan-text" style={{ color: DS.colors.warn }}>Awaiting staff approval</div>
        </div>
      </div>
    );
  }

  if (phase === "scanning") {
    return (
      <div className="age-verify-screen">
        <div className="age-heading">SCANNING {method?.toUpperCase()}</div>
        <div className="scanning-animation">
          <div className="scan-line" />
          <div style={{ fontSize: 40 }}>
            {method === "Yoti" ? "📱" : method === "Passport" ? "📘" : "🪪"}
          </div>
          <div className="scan-text">Reading document…</div>
        </div>
        <div className="age-sub">Hold still and follow on-screen instructions</div>
      </div>
    );
  }

  return (
    <div className="age-verify-screen">
      <div className="age-heading">VERIFY YOUR AGE</div>
      <div className="age-sub">You must be 18+ to purchase. Choose a verification method below.</div>
      <div className="verify-options">
        <div className="verify-option" onClick={() => startScan("Driving Licence")}>
          <div className="verify-icon">🪪</div>
          <div className="verify-label">Driving Licence</div>
          <div className="verify-desc">Scan UK driving licence barcode</div>
        </div>
        <div className="verify-option" onClick={() => startScan("Passport")}>
          <div className="verify-icon">📘</div>
          <div className="verify-label">Passport</div>
          <div className="verify-desc">Scan passport MRZ</div>
        </div>
        <div className="verify-option" onClick={() => startScan("Yoti")}>
          <div className="verify-icon">📱</div>
          <div className="verify-label">Yoti Digital ID</div>
          <div className="verify-desc">Show Yoti QR code</div>
        </div>
        <div className="verify-option" onClick={() => startScan("AI Camera")}>
          <div className="verify-icon">🎥</div>
          <div className="verify-label">AI Age Estimation</div>
          <div className="verify-desc">Camera facial analysis</div>
        </div>
        <div className="verify-option" onClick={manualApproval}
          style={{ borderColor: DS.colors.warn }}>
          <div className="verify-icon">👤</div>
          <div className="verify-label">Staff Override</div>
          <div className="verify-desc">Ask staff to verify</div>
        </div>
      </div>
      <button className="btn-sm btn-outline" onClick={onBack}>← Back to products</button>
    </div>
  );
}

function KioskPayment({ cart, onPaid }) {
  const [phase, setPhase] = useState("waiting"); // waiting | processing | done
  const total = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    return s + (p ? p.price * qty : 0);
  }, 0);

  const handleTap = () => {
    setPhase("processing");
    setTimeout(() => { setPhase("done"); setTimeout(onPaid, 1500); }, 2500);
  };

  return (
    <div className="payment-screen">
      <div className="payment-heading">
        {phase === "done" ? "✅ PAYMENT SUCCESS" : phase === "processing" ? "PROCESSING…" : "READY TO PAY"}
      </div>
      <div className="payment-amount">{fmt(total)}</div>
      <div className="payment-terminal" onClick={phase === "waiting" ? handleTap : undefined}
        style={{ cursor: phase === "waiting" ? "pointer" : "default" }}>
        <div className="nfc-icon"
          style={{ borderColor: phase === "done" ? DS.colors.accent : phase === "processing" ? DS.colors.blue : DS.colors.accent }}>
          {phase === "done" ? "✓" : phase === "processing" ? "⟳" : "📲"}
        </div>
        <div style={{ fontSize: 14, color: DS.colors.textSub, textAlign: "center" }}>
          {phase === "waiting" ? "Tap card, phone or watch" : phase === "processing" ? "Processing payment…" : "Payment complete!"}
        </div>
        <div className="pay-methods">
          {["💳 Card", "  Apple Pay", "Google Pay"].map(m => (
            <div key={m} className="pay-method">{m}</div>
          ))}
        </div>
      </div>
      {phase === "waiting" && (
        <div style={{ fontSize: 13, color: DS.colors.textMuted }}>
          Powered by Stripe · PCI DSS Compliant · End-to-end encrypted
        </div>
      )}
    </div>
  );
}

function KioskConfirmation({ cart, orderId }) {
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    return p ? { ...p, qty } : null;
  }).filter(Boolean);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="confirm-screen">
      <div className="confirm-icon">🎉</div>
      <div className="confirm-heading">ORDER PLACED!</div>
      <div className="order-id">{orderId}</div>
      <div className="age-sub">
        Your order has been sent to a member of staff for fulfilment. No products are dispensed automatically — a team member will verify and hand over your items at the counter.
      </div>
      <div className="confirm-items">
        {items.map(i => (
          <div key={i.id} className="confirm-item">
            <span>{i.image} {i.name} ×{i.qty}</span>
            <span style={{ color: DS.colors.accent }}>{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="confirm-item" style={{ borderColor: DS.colors.accent, background: DS.colors.accentGlow }}>
          <span style={{ fontWeight: 700 }}>Total Paid</span>
          <span style={{ color: DS.colors.accent, fontWeight: 700, fontFamily: DS.font.display, fontSize: 18 }}>{fmt(total)}</span>
        </div>
      </div>
      <div style={{
        padding: "16px 24px", borderRadius: 12, background: DS.colors.accentGlow,
        border: `1px solid ${DS.colors.accent}`, color: DS.colors.accent,
        fontSize: 16, fontWeight: 600, textAlign: "center"
      }}>
        👤 A staff member will bring your order to you shortly
      </div>
      <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: "center" }}>
        JarvID is an ordering &amp; compliance platform. Products are never dispensed automatically.
      </div>
    </div>
  );
}

// Progress indicator
function KioskProgress({ step }) {
  const steps = ["Browse", "Age Check", "Payment", "Done"];
  return (
    <div className="kiosk-progress">
      <div className="progress-steps">
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={`prog-step ${i < step ? "done" : i === step ? "active" : ""}`}>
              <div className={`prog-dot ${i < step ? "done" : i === step ? "active" : ""}`} />
              {s}
            </div>
            {i < steps.length - 1 && <div className={`prog-line ${i < step ? "done" : ""}`} />}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: "right", lineHeight: 1.5 }}>
        <div>Kiosk 1 · The Crown Pub</div>
        <div style={{ color: DS.colors.accent, opacity: 0.6 }}>Powered by JarvID</div>
      </div>
    </div>
  );
}

function KioskView() {
  const [screen, setScreen] = useState("welcome");
  const [cart, setCart] = useState({});
  const [orderId] = useState(uid());

  const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(c => {
    const n = { ...c };
    if (n[id] > 1) n[id]--;
    else delete n[id];
    return n;
  });

  const step = { welcome: -1, browse: 0, verify: 1, payment: 2, confirm: 3 }[screen] ?? 0;

  return (
    <div className="kiosk-shell">
      {screen === "welcome" && <KioskWelcome onStart={() => setScreen("browse")} />}
      {screen === "browse" && <KioskBrowse cart={cart} onAddToCart={addToCart} onRemoveFromCart={removeFromCart} onCheckout={() => setScreen("verify")} />}
      {screen === "verify" && <KioskAgeVerify onVerified={() => setScreen("payment")} onBack={() => setScreen("browse")} />}
      {screen === "payment" && <KioskPayment cart={cart} onPaid={() => setScreen("confirm")} />}
      {screen === "confirm" && <KioskConfirmation cart={cart} orderId={orderId} />}
      {screen !== "welcome" && <KioskProgress step={step} />}
    </div>
  );
}

// ============================================================
// STAFF DASHBOARD
// ============================================================
function StaffView() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [filter, setFilter] = useState("all");

  const updateStatus = (id, status) => {
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  const shown = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="staff-layout">
      <div className="staff-header">
        <div>
          <div className="staff-heading">STAFF ORDERS</div>
          <div className="staff-meta">The Crown Pub · Live Queue</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "pending", "preparing", "completed"].map(f => (
            <button key={f} className={`btn-sm ${filter === f ? "btn-accent" : "btn-outline"}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && orders.filter(o => o.status === "pending").length > 0 &&
                <span className="badge" style={{ marginLeft: 6 }}>
                  {orders.filter(o => o.status === "pending").length}
                </span>
              }
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: DS.colors.textSub }}>
          🟢 {orders.filter(o => o.status === "pending").length} pending · {orders.filter(o => o.status === "preparing").length} preparing
        </div>
      </div>

      <div className="orders-grid">
        {shown.map(order => (
          <div key={order.id} className={`order-card ${order.status}`}>
            <div className="order-header">
              <div className="order-id-tag">{order.id}</div>
              <div className={`status-pill status-${order.status}`}>{order.status}</div>
            </div>
            <div className="order-items-list">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <span className="order-item-name">{item.name}</span>
                  <span>×{item.qty} · {fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="order-total-row">
              <span>Total</span>
              <span className="order-total-amount">{fmt(order.total)}</span>
            </div>
            <div className="order-meta">
              <span>🕐 {order.time}</span>
              <span>✓ {order.ageVerified}</span>
              <span>📱 {order.kiosk}</span>
            </div>
            <div className="order-actions">
              {order.status === "pending" && (
                <>
                  <button className="btn-action btn-approve" onClick={() => updateStatus(order.id, "preparing")}>✓ Prepare</button>
                  <button className="btn-action btn-reject" onClick={() => updateStatus(order.id, "rejected")}>✕ Reject</button>
                </>
              )}
              {order.status === "preparing" && (
                <button className="btn-action btn-complete" onClick={() => updateStatus(order.id, "completed")}>✅ Mark Fulfilled</button>
              )}
              {order.status === "completed" && (
                <div style={{ fontSize: 13, color: DS.colors.accent, textAlign: "center", width: "100%" }}>
                  ✅ Fulfilled · Customer collected
                </div>
              )}
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: DS.colors.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <div>No orders in this category</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MANAGER DASHBOARD
// ============================================================
const SALES_DATA = [
  { day: "Mon", sales: 280 }, { day: "Tue", sales: 340 }, { day: "Wed", sales: 190 },
  { day: "Thu", sales: 420 }, { day: "Fri", sales: 680 }, { day: "Sat", sales: 890 }, { day: "Sun", sales: 520 },
];
const maxSale = Math.max(...SALES_DATA.map(d => d.sales));

const COMPLIANCE_LOG = [
  { time: "14:32", method: "Yoti", result: "pass", anon: "U#a1f3…" },
  { time: "14:28", method: "AI Camera", result: "fail", anon: "U#b2e4…" },
  { time: "14:28", method: "Driving Lic", result: "pass", anon: "U#b2e4…" },
  { time: "14:15", method: "Passport", result: "pass", anon: "U#c3d5…" },
  { time: "13:58", method: "Staff Check", result: "pass", anon: "U#d4f6…" },
  { time: "13:44", method: "Yoti", result: "pass", anon: "U#e5a7…" },
];

function ManagerView() {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQ, setSearchQ] = useState("");

  const filteredProducts = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQ.toLowerCase())
  );

  const navItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "products", icon: "📦", label: "Products" },
    { id: "inventory", icon: "🏭", label: "Inventory" },
    { id: "compliance", icon: "🔒", label: "Compliance" },
    { id: "staff", icon: "👥", label: "Staff" },
  ];

  return (
    <div className="manager-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Venue</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>The Crown Pub</div>
          <div style={{ fontSize: 12, color: DS.colors.textSub }}>Manchester</div>
        </div>
        <div className="sidebar-section">Navigation</div>
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => setActiveSection(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>

      <div className="manager-content">
        {activeSection === "overview" && (
          <>
            <div>
              <div className="section-title">TODAY'S OVERVIEW</div>
              <div className="section-sub">Tuesday, 10 March 2026</div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Today's Revenue</div>
                <div className="stat-value">£342</div>
                <div className="stat-delta delta-up">↑ 18% vs yesterday</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Orders</div>
                <div className="stat-value">47</div>
                <div className="stat-delta delta-up">↑ 12 orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Order Value</div>
                <div className="stat-value">£7.28</div>
                <div className="stat-delta delta-down">↓ £0.40</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Age Verifications</div>
                <div className="stat-value">51</div>
                <div className="stat-delta" style={{ color: DS.colors.textSub }}>100% compliance</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Kiosk Uptime</div>
                <div className="stat-value">99.9%</div>
                <div className="stat-delta delta-up">↑ 2 kiosks online</div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Weekly Sales (£)</div>
              <div className="bar-chart">
                {SALES_DATA.map(d => (
                  <div key={d.day} className="bar-col">
                    <div className="bar-val">{d.sales}</div>
                    <div className="bar-fill" style={{ height: `${(d.sales / maxSale) * 80}px` }} />
                    <div className="bar-label">{d.day}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Top Products Today</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Units Sold</th><th>Revenue</th><th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.filter(p => p.popular).map(p => (
                    <tr key={p.id}>
                      <td><ProductImage imageUrl={p.imageUrl} name={p.name} size="row" />{p.name}</td>
                      <td>{Math.floor(Math.random() * 20) + 5}</td>
                      <td style={{ color: DS.colors.accent }}>{fmt(p.price * (Math.floor(Math.random() * 20) + 5))}</td>
                      <td>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar-bg">
                            <div className="stock-bar-fill" style={{
                              width: `${(p.stock / 40) * 100}%`,
                              background: p.stock < 5 ? DS.colors.danger : p.stock < 15 ? DS.colors.warn : DS.colors.accent
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: DS.colors.textSub, width: 30 }}>{p.stock}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "products" && (
          <>
            <div>
              <div className="section-title">PRODUCT CATALOGUE</div>
              <div className="section-sub">Manage products, pricing and visibility</div>
            </div>
            <div className="prod-manage">
              <div className="prod-search-row">
                <input className="search-input" placeholder="Search products…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                <button className="btn-sm btn-accent">+ Add Product</button>
              </div>
              <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <ProductImage imageUrl={p.imageUrl} name={p.name} size="row" />
                          <span>{p.name}<br />
                            <span style={{ fontSize: 11, color: DS.colors.textMuted }}>{p.brand}</span>
                          </span>
                        </td>
                        <td>
                          <span className="tag-pill" style={{ background: "rgba(124,92,191,0.15)", color: DS.colors.purple }}>
                            {p.category.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ color: DS.colors.accent, fontFamily: DS.font.display, fontSize: 16 }}>{fmt(p.price)}</td>
                        <td>
                          <span style={{ color: p.stock < 5 ? DS.colors.danger : p.stock < 15 ? DS.colors.warn : DS.colors.accent }}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>
                          <span className={`tag-pill ${p.stock > 0 ? "status-completed" : "status-rejected"}`}
                            style={p.stock > 0 ? { background: DS.colors.accentGlow, color: DS.colors.accent } : { background: DS.colors.dangerGlow, color: DS.colors.danger }}>
                            {p.stock > 0 ? "Active" : "Out of Stock"}
                          </span>
                        </td>
                        <td>
                          <button className="btn-sm btn-outline" style={{ marginRight: 6 }}>Edit</button>
                          <button className="btn-sm" style={{ background: DS.colors.dangerGlow, color: DS.colors.danger, border: `1px solid ${DS.colors.danger}` }}>Hide</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeSection === "inventory" && (
          <>
            <div>
              <div className="section-title">INVENTORY</div>
              <div className="section-sub">Stock levels and reorder alerts</div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Total SKUs</div>
                <div className="stat-value">{PRODUCTS.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Low Stock</div>
                <div className="stat-value" style={{ color: DS.colors.warn }}>{PRODUCTS.filter(p => p.stock < 10).length}</div>
                <div className="stat-delta" style={{ color: DS.colors.warn }}>⚠ Reorder needed</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Out of Stock</div>
                <div className="stat-value" style={{ color: DS.colors.danger }}>{PRODUCTS.filter(p => p.stock === 0).length}</div>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">⚠ Low Stock Alerts</div>
              {PRODUCTS.filter(p => p.stock < 15).sort((a, b) => a.stock - b.stock).map(p => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "12px 0",
                  borderBottom: `1px solid ${DS.colors.border}`
                }}>
                  <ProductImage imageUrl={p.imageUrl} name={p.name} size="thumb" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="stock-bar-wrap" style={{ marginTop: 4 }}>
                      <div className="stock-bar-bg" style={{ flex: 1 }}>
                        <div className="stock-bar-fill" style={{
                          width: `${(p.stock / 40) * 100}%`,
                          background: p.stock < 5 ? DS.colors.danger : DS.colors.warn
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: DS.colors.textSub, width: 60 }}>
                        {p.stock} / 40
                      </span>
                    </div>
                  </div>
                  <button className="btn-sm btn-accent">Reorder</button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection === "compliance" && (
          <>
            <div>
              <div className="section-title">COMPLIANCE LOG</div>
              <div className="section-sub">GDPR-compliant anonymised age verification records</div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Verifications Today</div>
                <div className="stat-value">51</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pass Rate</div>
                <div className="stat-value" style={{ color: DS.colors.accent }}>94%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Failed / Blocked</div>
                <div className="stat-value" style={{ color: DS.colors.danger }}>3</div>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">Verification Events (anonymised)</div>
              <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 12 }}>
                No personal data is stored. User identifiers are one-way hashed tokens.
              </div>
              <div className="compliance-log">
                {COMPLIANCE_LOG.map((entry, i) => (
                  <div key={i} className="log-entry">
                    <div className={`log-dot ${entry.result === "pass" ? "log-dot-pass" : "log-dot-fail"}`} />
                    <div className="log-time">{entry.time}</div>
                    <div className="log-method">{entry.method}</div>
                    <div className={entry.result === "pass" ? "log-result-pass" : "log-result-fail"}>
                      {entry.result === "pass" ? "✓ PASS" : "✗ FAIL"}
                    </div>
                    <div className="log-anon">{entry.anon}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === "staff" && (
          <>
            <div>
              <div className="section-title">STAFF MANAGEMENT</div>
              <div className="section-sub">Manage staff accounts and permissions</div>
            </div>
            <div className="chart-card">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {[
                    { name: "Sarah Mitchell", role: "Manager", status: "online", last: "Now" },
                    { name: "Jake Thompson", role: "Staff", status: "online", last: "Now" },
                    { name: "Emma Clarke", role: "Staff", status: "offline", last: "1h ago" },
                    { name: "Ryan Foster", role: "Staff", status: "offline", last: "Yesterday" },
                  ].map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td><span className="tag-pill" style={{ background: "rgba(124,92,191,0.15)", color: DS.colors.purple }}>{s.role}</span></td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: s.status === "online" ? DS.colors.accent : DS.colors.textMuted,
                            display: "inline-block"
                          }} />
                          {s.status}
                        </span>
                      </td>
                      <td>{s.last}</td>
                      <td>
                        <button className="btn-sm btn-outline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PLATFORM ADMIN
// ============================================================
function AdminView() {
  const [adminSection, setAdminSection] = useState("venues");

  const navItems = [
    { id: "venues", icon: "🏢", label: "Venues" },
    { id: "devices", icon: "📱", label: "Devices" },
    { id: "billing", icon: "💳", label: "Billing" },
    { id: "schema", icon: "🗄️", label: "DB Schema" },
    { id: "api", icon: "🔌", label: "API Docs" },
  ];

  return (
    <div className="admin-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Platform</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>JarvID Admin</div>
          <div style={{ fontSize: 11, color: DS.colors.textSub, marginBottom: 4, lineHeight: 1.4 }}>Technology &amp; Compliance Platform for Age-Restricted Retail</div>
          <div style={{ fontSize: 12, color: DS.colors.accent }}>● System Healthy</div>
        </div>
        <div className="sidebar-section">Management</div>
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${adminSection === item.id ? "active" : ""}`}
            onClick={() => setAdminSection(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>

      <div className="manager-content">
        {adminSection === "venues" && (
          <>
            <div>
              <div className="section-title">ALL VENUES</div>
              <div className="section-sub">Network-wide overview</div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Total Venues</div>
                <div className="stat-value">{VENUES.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Network Revenue Today</div>
                <div className="stat-value">£1,814</div>
                <div className="stat-delta delta-up">↑ 22%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Kiosks</div>
                <div className="stat-value">{VENUES.reduce((s, v) => s + v.kiosks, 0)}</div>
                <div className="stat-delta" style={{ color: DS.colors.textSub }}>7 online · 1 offline</div>
              </div>
            </div>
            <div className="venue-cards">
              {VENUES.map(v => (
                <div key={v.id} className="venue-card">
                  <div className="venue-top">
                    <div>
                      <div className="venue-name">{v.name}</div>
                      <div className="venue-loc">📍 {v.location}</div>
                    </div>
                    <div className={`online-dot ${v.status === "online" ? "dot-online" : "dot-offline"}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 4 }}>Today's Revenue</div>
                    <div className="venue-sales">{fmt(v.todaySales)}</div>
                  </div>
                  <div className="venue-meta">
                    <span>📱 {v.kiosks} kiosk{v.kiosks !== 1 ? "s" : ""}</span>
                    <span style={{ color: v.status === "online" ? DS.colors.accent : DS.colors.danger }}>
                      ● {v.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-outline" style={{ flex: 1 }}>View</button>
                    <button className="btn-sm btn-accent" style={{ flex: 1 }}>Manage</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {adminSection === "devices" && (
          <>
            <div>
              <div className="section-title">DEVICE MONITORING</div>
              <div className="section-sub">Remote kiosk management and shutdown</div>
            </div>
            <div className="chart-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "K-001", name: "Kiosk 1", venue: "The Crown Pub", ip: "192.168.1.10", uptime: "99.9%", version: "v2.4.1", status: "online" },
                { id: "K-002", name: "Kiosk 2", venue: "The Crown Pub", ip: "192.168.1.11", uptime: "99.7%", version: "v2.4.1", status: "online" },
                { id: "K-003", name: "Kiosk 1", venue: "Vape HQ Shop", ip: "10.0.0.5", uptime: "100%", version: "v2.4.0", status: "online" },
                { id: "K-004", name: "Kiosk 2", venue: "Vape HQ Shop", ip: "10.0.0.6", uptime: "98.2%", version: "v2.3.9", status: "needs_update" },
                { id: "K-005", name: "Kiosk 1", venue: "The Fox & Hound", ip: "172.16.0.3", uptime: "—", version: "v2.4.1", status: "offline" },
              ].map(d => (
                <div key={d.id} className="device-row">
                  <div>
                    <div className="device-name">{d.id} — {d.name}</div>
                    <div style={{ fontSize: 12, color: DS.colors.textMuted }}>{d.venue} · {d.ip}</div>
                  </div>
                  <div className="device-status">
                    <span>⬆ {d.uptime}</span>
                    <span
                      className="tag-pill"
                      style={{
                        background: d.status === "online" ? DS.colors.accentGlow : d.status === "needs_update" ? DS.colors.warnGlow : DS.colors.dangerGlow,
                        color: d.status === "online" ? DS.colors.accent : d.status === "needs_update" ? DS.colors.warn : DS.colors.danger,
                      }}>
                      {d.status === "needs_update" ? "⚠ Update" : d.status}
                    </span>
                    <span style={{ fontSize: 12 }}>{d.version}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {d.status === "needs_update" && <button className="btn-sm btn-accent">Update</button>}
                    <button className="btn-danger-sm">Shutdown</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {adminSection === "billing" && (
          <>
            <div>
              <div className="section-title">BILLING</div>
              <div className="section-sub">Venue subscriptions and platform fees</div>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">MRR</div>
                <div className="stat-value">£1,196</div>
                <div className="stat-delta delta-up">↑ 8%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Platform Commission</div>
                <div className="stat-value">£181</div>
                <div className="stat-delta" style={{ color: DS.colors.textSub }}>10% of sales today</div>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">Venue Subscriptions</div>
              <table className="data-table">
                <thead>
                  <tr><th>Venue</th><th>Plan</th><th>Monthly Fee</th><th>Kiosks</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {VENUES.map(v => (
                    <tr key={v.id}>
                      <td>{v.name}</td>
                      <td><span className="tag-pill" style={{ background: "rgba(47,134,235,0.1)", color: DS.colors.blue }}>Pro</span></td>
                      <td style={{ color: DS.colors.accent }}>{fmt(v.kiosks * 149)}/mo</td>
                      <td>{v.kiosks}</td>
                      <td>
                        <span className="tag-pill" style={{
                          background: v.status === "online" ? DS.colors.accentGlow : DS.colors.dangerGlow,
                          color: v.status === "online" ? DS.colors.accent : DS.colors.danger
                        }}>
                          {v.status === "online" ? "Active" : "Suspended"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {adminSection === "schema" && (
          <>
            <div>
              <div className="section-title">DATABASE SCHEMA</div>
              <div className="section-sub">PostgreSQL / Supabase — Production Schema</div>
            </div>
            <div className="schema-block">
              <span className="cm">-- JarvID MVP Database Schema (PostgreSQL / Supabase){"\n"}</span>
              {"\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">venues</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}name <span className="str">TEXT NOT NULL</span>,{"\n"}
              {"  "}location <span className="str">TEXT</span>,{"\n"}
              {"  "}subscription_plan <span className="str">TEXT DEFAULT 'pro'</span>,{"\n"}
              {"  "}created_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">kiosks</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}venue_id <span className="str">UUID REFERENCES venues(id)</span>,{"\n"}
              {"  "}device_id <span className="str">TEXT UNIQUE NOT NULL</span>,{"\n"}
              {"  "}name <span className="str">TEXT</span>,{"\n"}
              {"  "}status <span className="str">TEXT DEFAULT 'online'</span>, <span className="cm">-- online|offline|maintenance</span>{"\n"}
              {"  "}app_version <span className="str">TEXT</span>,{"\n"}
              {"  "}last_heartbeat <span className="str">TIMESTAMPTZ</span>,{"\n"}
              {"  "}config <span className="str">JSONB DEFAULT '{"{}"}'</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">products</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}venue_id <span className="str">UUID REFERENCES venues(id)</span>,{"\n"}
              {"  "}name <span className="str">TEXT NOT NULL</span>,{"\n"}
              {"  "}brand <span className="str">TEXT</span>,{"\n"}
              {"  "}category <span className="str">TEXT</span>, <span className="cm">-- disposable|pod_kit|eliquid|nicotine_pouch</span>{"\n"}
              {"  "}price_pence <span className="str">INTEGER NOT NULL</span>, <span className="cm">-- store in pence</span>{"\n"}
              {"  "}nicotine_mg <span className="str">TEXT</span>,{"\n"}
              {"  "}flavour <span className="str">TEXT</span>,{"\n"}
              {"  "}image_url <span className="str">TEXT</span>,{"\n"}
              {"  "}is_active <span className="str">BOOLEAN DEFAULT TRUE</span>,{"\n"}
              {"  "}created_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">inventory</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}product_id <span className="str">UUID REFERENCES products(id)</span>,{"\n"}
              {"  "}venue_id <span className="str">UUID REFERENCES venues(id)</span>,{"\n"}
              {"  "}quantity <span className="str">INTEGER DEFAULT 0</span>,{"\n"}
              {"  "}low_stock_threshold <span className="str">INTEGER DEFAULT 10</span>,{"\n"}
              {"  "}updated_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">orders</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}kiosk_id <span className="str">UUID REFERENCES kiosks(id)</span>,{"\n"}
              {"  "}venue_id <span className="str">UUID REFERENCES venues(id)</span>,{"\n"}
              {"  "}status <span className="str">TEXT DEFAULT 'pending'</span>, <span className="cm">-- pending|preparing|completed|rejected</span>{"\n"}
              {"  "}total_pence <span className="str">INTEGER</span>,{"\n"}
              {"  "}payment_intent_id <span className="str">TEXT</span>, <span className="cm">-- Stripe PaymentIntent ID</span>{"\n"}
              {"  "}payment_method <span className="str">TEXT</span>, <span className="cm">-- card|apple_pay|google_pay</span>{"\n"}
              {"  "}age_verification_id <span className="str">UUID</span>, <span className="cm">-- FK to age_verifications</span>{"\n"}
              {"  "}created_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">order_items</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}order_id <span className="str">UUID REFERENCES orders(id)</span>,{"\n"}
              {"  "}product_id <span className="str">UUID REFERENCES products(id)</span>,{"\n"}
              {"  "}quantity <span className="str">INTEGER NOT NULL</span>,{"\n"}
              {"  "}unit_price_pence <span className="str">INTEGER NOT NULL</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">age_verifications</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}kiosk_id <span className="str">UUID REFERENCES kiosks(id)</span>,{"\n"}
              {"  "}method <span className="str">TEXT NOT NULL</span>, <span className="cm">-- yoti|driving_licence|passport|ai_camera|staff_override</span>{"\n"}
              {"  "}result <span className="str">TEXT NOT NULL</span>, <span className="cm">-- pass|fail</span>{"\n"}
              {"  "}user_token_hash <span className="str">TEXT</span>, <span className="cm">-- SHA-256 of ephemeral token, GDPR-safe</span>{"\n"}
              {"  "}provider_reference <span className="str">TEXT</span>, <span className="cm">-- Yoti/1account session ref</span>{"\n"}
              {"  "}verified_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="kw">CREATE TABLE </span><span className="tb">staff_users</span> ({"\n"}
              {"  "}id <span className="str">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,{"\n"}
              {"  "}venue_id <span className="str">UUID REFERENCES venues(id)</span>,{"\n"}
              {"  "}email <span className="str">TEXT UNIQUE NOT NULL</span>,{"\n"}
              {"  "}role <span className="str">TEXT DEFAULT 'staff'</span>, <span className="cm">-- staff|manager|admin</span>{"\n"}
              {"  "}is_active <span className="str">BOOLEAN DEFAULT TRUE</span>,{"\n"}
              {"  "}created_at <span className="str">TIMESTAMPTZ DEFAULT NOW()</span>{"\n"}
              );{"\n\n"}
              <span className="cm">-- Row Level Security (RLS) enabled on all tables{"\n"}</span>
              <span className="cm">-- Venues can only access their own data{"\n"}</span>
              <span className="kw">ALTER TABLE </span><span className="tb">orders</span> <span className="kw">ENABLE ROW LEVEL SECURITY</span>;{"\n"}
              <span className="kw">ALTER TABLE </span><span className="tb">products</span> <span className="kw">ENABLE ROW LEVEL SECURITY</span>;{"\n"}
              <span className="kw">ALTER TABLE </span><span className="tb">inventory</span> <span className="kw">ENABLE ROW LEVEL SECURITY</span>;{"\n"}
            </div>
          </>
        )}

        {adminSection === "api" && (
          <>
            <div>
              <div className="section-title">API STRUCTURE</div>
              <div className="section-sub">REST API — Base URL: https://api.jarvid.io/v1</div>
            </div>
            {[
              {
                group: "Products", color: DS.colors.accent,
                endpoints: [
                  { method: "GET", path: "/venues/:id/products", desc: "List all active products for venue" },
                  { method: "POST", path: "/venues/:id/products", desc: "Create product (manager+)" },
                  { method: "PUT", path: "/products/:id", desc: "Update product / price" },
                  { method: "DELETE", path: "/products/:id", desc: "Soft-delete product" },
                ]
              },
              {
                group: "Orders", color: DS.colors.blue,
                endpoints: [
                  { method: "POST", path: "/orders", desc: "Create order (kiosk, after payment)" },
                  { method: "GET", path: "/venues/:id/orders", desc: "Get order queue (staff)" },
                  { method: "PATCH", path: "/orders/:id/status", desc: "Update order status" },
                  { method: "GET", path: "/orders/:id", desc: "Get single order details" },
                ]
              },
              {
                group: "Age Verification", color: DS.colors.purple,
                endpoints: [
                  { method: "POST", path: "/verify/yoti", desc: "Initiate Yoti verification session" },
                  { method: "POST", path: "/verify/id-scan", desc: "Submit ID barcode/MRZ data" },
                  { method: "POST", path: "/verify/ai-estimate", desc: "Submit image for AI age estimation" },
                  { method: "POST", path: "/verify/staff-override", desc: "Staff approves age manually" },
                  { method: "GET", path: "/verify/:sessionId", desc: "Poll verification result" },
                ]
              },
              {
                group: "Payments", color: DS.colors.warn,
                endpoints: [
                  { method: "POST", path: "/payments/intent", desc: "Create Stripe PaymentIntent" },
                  { method: "POST", path: "/payments/webhook", desc: "Stripe webhook handler" },
                ]
              },
              {
                group: "Analytics", color: DS.colors.textSub,
                endpoints: [
                  { method: "GET", path: "/venues/:id/analytics/sales", desc: "Daily/weekly/monthly sales" },
                  { method: "GET", path: "/venues/:id/analytics/products", desc: "Product performance" },
                  { method: "GET", path: "/venues/:id/analytics/compliance", desc: "Age verification summary" },
                ]
              },
            ].map(group => (
              <div key={group.group} className="chart-card">
                <div className="chart-title" style={{ color: group.color }}>{group.group}</div>
                <table className="data-table">
                  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
                  <tbody>
                    {group.endpoints.map((ep, i) => (
                      <tr key={i}>
                        <td>
                          <span className="tag-pill" style={{
                            background: ep.method === "GET" ? "rgba(0,245,196,0.1)" : ep.method === "POST" ? "rgba(47,134,235,0.1)" : ep.method === "PUT" || ep.method === "PATCH" ? "rgba(255,165,2,0.1)" : "rgba(255,71,87,0.1)",
                            color: ep.method === "GET" ? DS.colors.accent : ep.method === "POST" ? DS.colors.blue : ep.method === "PUT" || ep.method === "PATCH" ? DS.colors.warn : DS.colors.danger,
                          }}>
                            {ep.method}
                          </span>
                        </td>
                        <td style={{ fontFamily: DS.font.mono, fontSize: 12 }}>{ep.path}</td>
                        <td>{ep.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState("kiosk");
  const [pendingOrders] = useState(2);

  const tabs = [
    { id: "kiosk", label: "🖥 Customer Kiosk" },
    { id: "staff", label: "👤 Staff Dashboard" },
    { id: "manager", label: "📊 Venue Manager" },
    { id: "admin", label: "⚙️ Platform Admin" },
  ];

  return (
    <>
      <GlobalStyles />
      <div className="app-root">
        <nav className="top-nav">
          <div className="nav-logo">J<span>arv</span>ID</div>
          <div className="nav-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`nav-tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
                {t.id === "staff" && pendingOrders > 0 && (
                  <span className="badge" style={{ marginLeft: 6 }}>{pendingOrders}</span>
                )}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <span style={{ fontSize: 12, color: DS.colors.textMuted }}>MVP v1.0</span>
            <span style={{ fontSize: 12, color: DS.colors.accent }}>● Live</span>
          </div>
        </nav>
        <div className="main-content">
          {activeTab === "kiosk" && <KioskView />}
          {activeTab === "staff" && <StaffView />}
          {activeTab === "manager" && <ManagerView />}
          {activeTab === "admin" && <AdminView />}
        </div>
      </div>
    </>
  );
}
