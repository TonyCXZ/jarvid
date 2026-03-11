import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

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
// CATEGORIES
// ============================================================
const CATEGORIES = [
  { id: "all",            label: "All",              icon: "✦" },
  { id: "eliquid",        label: "E-Liquids",        icon: "💧" },
  { id: "prefilled_pod",  label: "Prefilled Pods",   icon: "🫧" },
  { id: "refillable_kit", label: "Refillable Kits",  icon: "⚡" },
  { id: "refillable_pods",label: "Replacement Pods", icon: "🔄" },
];

// ============================================================
// MOCK VENUES (until auth is wired)
// ============================================================
const MOCK_VENUES = [
  { id: null, name: "The Crown Pub", location: "Manchester", kiosks: 2, todaySales: 342.50, status: "online" },
  { id: null, name: "Vape HQ Shop", location: "London", kiosks: 3, todaySales: 891.20, status: "online" },
  { id: null, name: "The Fox & Hound", location: "Birmingham", kiosks: 1, todaySales: 156.80, status: "offline" },
  { id: null, name: "Cloud Nine Vapes", location: "Leeds", kiosks: 2, todaySales: 423.60, status: "online" },
];

const SALES_DATA = [
  { day: "Mon", sales: 280 }, { day: "Tue", sales: 340 }, { day: "Wed", sales: 190 },
  { day: "Thu", sales: 420 }, { day: "Fri", sales: 680 }, { day: "Sat", sales: 890 }, { day: "Sun", sales: 520 },
];
const maxSale = Math.max(...SALES_DATA.map(d => d.sales));

const COMPLIANCE_LOG = [
  { time: "14:32", method: "Yoti",        result: "pass", anon: "U#a1f3…" },
  { time: "14:28", method: "AI Camera",   result: "fail", anon: "U#b2e4…" },
  { time: "14:28", method: "Driving Lic", result: "pass", anon: "U#b2e4…" },
  { time: "14:15", method: "Passport",    result: "pass", anon: "U#c3d5…" },
  { time: "13:58", method: "Staff Check", result: "pass", anon: "U#d4f6…" },
  { time: "13:44", method: "Yoti",        result: "pass", anon: "U#e5a7…" },
];

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width: 100%; height: 100%; background: ${DS.colors.bg}; color: ${DS.colors.text}; font-family: ${DS.font.body}; overflow: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${DS.colors.surface}; }
    ::-webkit-scrollbar-thumb { background: ${DS.colors.border}; border-radius: 2px; }
    .app-root { width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .top-nav { display: flex; align-items: center; gap: 0; background: ${DS.colors.surface}; border-bottom: 1px solid ${DS.colors.border}; padding: 0 24px; height: 56px; flex-shrink: 0; }
    .nav-logo { font-family: ${DS.font.display}; font-weight: 900; font-size: 22px; letter-spacing: 0.05em; color: ${DS.colors.accent}; margin-right: 32px; }
    .nav-logo span { color: ${DS.colors.textSub}; }
    .nav-tabs { display: flex; gap: 2px; flex: 1; }
    .nav-tab { padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; color: ${DS.colors.textSub}; cursor: pointer; border: none; background: transparent; transition: all 0.15s; letter-spacing: 0.01em; }
    .nav-tab:hover { color: ${DS.colors.text}; background: ${DS.colors.card}; }
    .nav-tab.active { color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .nav-right { display: flex; align-items: center; gap: 12px; }
    .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: ${DS.colors.danger}; color: white; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .main-content { flex: 1; overflow: hidden; display: flex; }
    .kiosk-shell { width: 100%; height: 100%; display: flex; flex-direction: column; background: linear-gradient(160deg, #0d0d18 0%, #0a0a10 100%); overflow: hidden; }
    .welcome-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; padding: 40px; text-align: center; background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,245,196,0.06) 0%, transparent 70%); }
    .welcome-logo { font-family: ${DS.font.display}; font-weight: 900; font-size: 72px; letter-spacing: 0.08em; color: ${DS.colors.white}; line-height: 1; }
    .welcome-logo .glow { color: ${DS.colors.accent}; text-shadow: 0 0 40px ${DS.colors.accent}; }
    .welcome-sub { font-size: 20px; color: ${DS.colors.textSub}; font-weight: 300; letter-spacing: 0.06em; text-transform: uppercase; }
    .welcome-age-notice { padding: 18px 28px; border: 1px solid ${DS.colors.warn}; border-radius: 8px; background: ${DS.colors.warnGlow}; color: ${DS.colors.warn}; font-size: 15px; font-weight: 500; letter-spacing: 0.02em; max-width: 520px; text-align: center; line-height: 1.7; }
    .btn-primary { padding: 20px 64px; border-radius: 12px; font-family: ${DS.font.display}; font-size: 28px; font-weight: 700; letter-spacing: 0.08em; background: ${DS.colors.accent}; color: ${DS.colors.bg}; border: none; cursor: pointer; box-shadow: 0 0 40px rgba(0,245,196,0.4); transition: all 0.2s; text-transform: uppercase; }
    .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 60px rgba(0,245,196,0.6); }
    .btn-primary:active { transform: scale(0.99); }
    .browse-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .browse-header { padding: 16px 20px 0; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .browse-title { font-family: ${DS.font.display}; font-size: 28px; font-weight: 800; letter-spacing: 0.05em; color: ${DS.colors.white}; flex: 1; }
    .cart-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 10px; background: ${DS.colors.accentGlow}; border: 1px solid ${DS.colors.accent}; color: ${DS.colors.accent}; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .cart-btn:hover { background: rgba(0,245,196,0.25); }
    .cat-bar { display: flex; gap: 8px; padding: 12px 20px; overflow-x: auto; flex-shrink: 0; }
    .cat-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; border: 1px solid ${DS.colors.border}; background: ${DS.colors.card}; color: ${DS.colors.textSub}; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .cat-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.text}; }
    .cat-btn.active { border-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-auto-rows: max-content; align-items: start; gap: 14px; padding: 14px 20px 28px; }
    .product-card { background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; border-radius: 12px; padding: 14px; transition: all 0.15s; display: flex; flex-direction: column; gap: 7px; position: relative; height: auto; }
    .product-card:hover { border-color: ${DS.colors.accent}; transform: translateY(-2px); background: ${DS.colors.cardHover}; }
    .product-card.in-cart { border-color: ${DS.colors.accent}; background: rgba(0,245,196,0.05); }
    .product-card.low-stock { border-color: ${DS.colors.warn}; }
    .popular-badge { position: absolute; top: 10px; right: 10px; padding: 2px 8px; border-radius: 4px; background: ${DS.colors.accent}; color: ${DS.colors.bg}; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .product-image { width: 100%; height: 120px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,0.04); display: block; }
    .product-image-wrap { width: 100%; height: 120px; border-radius: 8px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .product-brand { font-size: 11px; color: ${DS.colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em; }
    .product-name { font-size: 14px; font-weight: 600; color: ${DS.colors.text}; line-height: 1.3; }
    .product-flavour { font-size: 12px; color: ${DS.colors.textSub}; }
    .product-nic { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(124,92,191,0.2); color: ${DS.colors.purple}; width: fit-content; font-weight: 500; }
    .product-price { font-family: ${DS.font.display}; font-size: 22px; font-weight: 700; color: ${DS.colors.accent}; }
    .product-stock { font-size: 11px; color: ${DS.colors.textMuted}; }
    .low-stock-tag { color: ${DS.colors.warn}; }
    .product-qty-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .product-qty-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.text}; font-size: 20px; font-weight: 300; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
    .product-qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .product-qty-btn.minus:hover { border-color: ${DS.colors.danger}; color: ${DS.colors.danger}; background: ${DS.colors.dangerGlow}; }
    .product-qty-num { flex: 1; text-align: center; font-family: ${DS.font.display}; font-size: 20px; font-weight: 800; color: ${DS.colors.accent}; }
    .product-add-btn { width: 100%; height: 36px; border-radius: 8px; border: 1.5px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.textSub}; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 4px; }
    .product-add-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .cart-overlay { position: absolute; inset: 0; z-index: 50; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; }
    .cart-drawer { width: 360px; height: 100%; background: ${DS.colors.surface}; border-left: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; animation: slideIn 0.2s ease; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .cart-header { padding: 20px; border-bottom: 1px solid ${DS.colors.border}; display: flex; align-items: center; justify-content: space-between; }
    .cart-title { font-family: ${DS.font.display}; font-size: 24px; font-weight: 800; }
    .close-btn { width: 36px; height: 36px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; color: ${DS.colors.textSub}; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .cart-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; }
    .cart-item-info { flex: 1; }
    .cart-item-name { font-size: 14px; font-weight: 600; }
    .cart-item-price { font-size: 13px; color: ${DS.colors.textSub}; }
    .qty-control { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.text}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
    .qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .qty-num { font-weight: 700; font-size: 15px; min-width: 20px; text-align: center; }
    .cart-footer { padding: 16px; border-top: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 12px; }
    .cart-total-row { display: flex; justify-content: space-between; align-items: center; }
    .cart-total-label { font-size: 15px; color: ${DS.colors.textSub}; }
    .cart-total-value { font-family: ${DS.font.display}; font-size: 28px; font-weight: 800; color: ${DS.colors.accent}; }
    .age-verify-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; padding: 40px; text-align: center; }
    .age-heading { font-family: ${DS.font.display}; font-size: 48px; font-weight: 900; letter-spacing: 0.06em; color: ${DS.colors.white}; }
    .age-sub { font-size: 17px; color: ${DS.colors.textSub}; max-width: 400px; }
    .verify-options { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .verify-option { width: 180px; padding: 28px 20px; border-radius: 16px; background: ${DS.colors.card}; border: 2px solid ${DS.colors.border}; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .verify-option:hover { border-color: ${DS.colors.accent}; transform: translateY(-4px); background: ${DS.colors.cardHover}; }
    .verify-icon { font-size: 48px; }
    .verify-label { font-size: 15px; font-weight: 600; color: ${DS.colors.text}; }
    .verify-desc { font-size: 12px; color: ${DS.colors.textSub}; }
    .scanning-animation { width: 240px; height: 240px; border-radius: 20px; border: 2px solid ${DS.colors.accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: rgba(0,245,196,0.03); position: relative; overflow: hidden; }
    .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, ${DS.colors.accent}, transparent); animation: scanMove 2s linear infinite; }
    @keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }
    .scan-text { font-size: 15px; color: ${DS.colors.accent}; font-weight: 500; z-index: 1; }
    .payment-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px; }
    .payment-heading { font-family: ${DS.font.display}; font-size: 48px; font-weight: 900; letter-spacing: 0.06em; }
    .payment-amount { font-family: ${DS.font.display}; font-size: 80px; font-weight: 900; color: ${DS.colors.accent}; text-shadow: 0 0 40px rgba(0,245,196,0.3); }
    .payment-terminal { width: 280px; padding: 28px; border-radius: 20px; background: ${DS.colors.card}; border: 2px solid ${DS.colors.border}; display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .nfc-icon { width: 80px; height: 80px; border: 3px solid ${DS.colors.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,245,196,0.4); } 50% { box-shadow: 0 0 0 20px rgba(0,245,196,0); } }
    .pay-methods { display: flex; gap: 10px; }
    .pay-method { padding: 8px 16px; border-radius: 8px; border: 1px solid ${DS.colors.border}; background: ${DS.colors.surface}; font-size: 13px; font-weight: 500; color: ${DS.colors.textSub}; }
    .confirm-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px; text-align: center; }
    .confirm-icon { font-size: 80px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
    .confirm-heading { font-family: ${DS.font.display}; font-size: 52px; font-weight: 900; letter-spacing: 0.06em; color: ${DS.colors.accent}; }
    .order-id { font-family: ${DS.font.mono}; font-size: 24px; color: ${DS.colors.textSub}; letter-spacing: 0.1em; }
    .confirm-items { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
    .confirm-item { display: flex; justify-content: space-between; padding: 10px 16px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; font-size: 14px; }
    .staff-layout { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
    .staff-header { padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${DS.colors.border}; flex-shrink: 0; }
    .staff-heading { font-family: ${DS.font.display}; font-size: 26px; font-weight: 800; }
    .staff-meta { font-size: 13px; color: ${DS.colors.textSub}; }
    .orders-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px; }
    .order-card { background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: border-color 0.2s; }
    .order-card.pending { border-left: 4px solid ${DS.colors.warn}; }
    .order-card.preparing { border-left: 4px solid ${DS.colors.blue}; }
    .order-card.completed { border-left: 4px solid ${DS.colors.accent}; opacity: 0.6; }
    .order-card.rejected { border-left: 4px solid ${DS.colors.danger}; opacity: 0.5; }
    .order-header { display: flex; align-items: center; justify-content: space-between; }
    .order-id-tag { font-family: ${DS.font.mono}; font-size: 14px; font-weight: 600; color: ${DS.colors.accent}; }
    .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pending { background: ${DS.colors.warnGlow}; color: ${DS.colors.warn}; border: 1px solid ${DS.colors.warn}; }
    .status-preparing { background: rgba(47,134,235,0.15); color: ${DS.colors.blue}; border: 1px solid ${DS.colors.blue}; }
    .status-completed { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .status-rejected { background: ${DS.colors.dangerGlow}; color: ${DS.colors.danger}; border: 1px solid ${DS.colors.danger}; }
    .order-items-list { display: flex; flex-direction: column; gap: 6px; }
    .order-item-row { display: flex; justify-content: space-between; font-size: 13px; color: ${DS.colors.textSub}; }
    .order-item-name { color: ${DS.colors.text}; }
    .order-total-row { display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid ${DS.colors.border}; font-weight: 600; }
    .order-total-amount { color: ${DS.colors.accent}; font-family: ${DS.font.display}; font-size: 18px; }
    .order-meta { display: flex; gap: 16px; font-size: 12px; color: ${DS.colors.textMuted}; flex-wrap: wrap; }
    .order-actions { display: flex; gap: 8px; }
    .btn-action { flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-approve { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .btn-approve:hover { background: rgba(0,245,196,0.3); }
    .btn-complete { background: ${DS.colors.accent}; color: ${DS.colors.bg}; }
    .btn-complete:hover { background: ${DS.colors.accentDim}; }
    .btn-reject { background: ${DS.colors.dangerGlow}; color: ${DS.colors.danger}; border: 1px solid ${DS.colors.danger}; }
    .btn-reject:hover { background: rgba(255,71,87,0.3); }
    .manager-layout { width: 100%; height: 100%; display: flex; overflow: hidden; }
    .sidebar { width: 220px; flex-shrink: 0; background: ${DS.colors.surface}; border-right: 1px solid ${DS.colors.border}; padding: 20px 0; display: flex; flex-direction: column; gap: 4px; }
    .sidebar-section { padding: 8px 16px 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 14px; color: ${DS.colors.textSub}; transition: all 0.1s; border-left: 2px solid transparent; }
    .sidebar-item:hover { color: ${DS.colors.text}; background: rgba(255,255,255,0.03); }
    .sidebar-item.active { color: ${DS.colors.accent}; border-left-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .manager-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat-card { padding: 20px; border-radius: 12px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 8px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .stat-value { font-family: ${DS.font.display}; font-size: 32px; font-weight: 800; color: ${DS.colors.white}; }
    .stat-delta { font-size: 13px; }
    .delta-up { color: ${DS.colors.accent}; }
    .delta-down { color: ${DS.colors.danger}; }
    .chart-card { padding: 20px; border-radius: 12px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; }
    .chart-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
    .bar-fill { width: 100%; border-radius: 3px 3px 0 0; background: ${DS.colors.accent}; transition: height 0.5s; min-height: 4px; opacity: 0.8; }
    .bar-label { font-size: 10px; color: ${DS.colors.textMuted}; }
    .bar-val { font-size: 10px; color: ${DS.colors.textSub}; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: ${DS.colors.textMuted}; font-weight: 600; border-bottom: 1px solid ${DS.colors.border}; }
    .data-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid rgba(42,42,62,0.5); color: ${DS.colors.textSub}; }
    .data-table td:first-child { color: ${DS.colors.text}; font-weight: 500; }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }
    .prod-manage { display: flex; flex-direction: column; gap: 16px; }
    .prod-search-row { display: flex; gap: 12px; align-items: center; }
    .search-input { flex: 1; padding: 10px 14px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; color: ${DS.colors.text}; font-size: 14px; outline: none; font-family: ${DS.font.body}; }
    .search-input:focus { border-color: ${DS.colors.accent}; }
    .search-input::placeholder { color: ${DS.colors.textMuted}; }
    .btn-sm { padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; }
    .btn-outline { background: transparent; border: 1px solid ${DS.colors.border}; color: ${DS.colors.textSub}; }
    .btn-outline:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .btn-accent { background: ${DS.colors.accent}; color: ${DS.colors.bg}; }
    .btn-accent:hover { background: ${DS.colors.accentDim}; }
    .compliance-log { display: flex; flex-direction: column; gap: 8px; }
    .log-entry { padding: 12px 16px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; align-items: center; gap: 16px; font-size: 13px; }
    .log-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .log-dot-pass { background: ${DS.colors.accent}; }
    .log-dot-fail { background: ${DS.colors.danger}; }
    .log-time { color: ${DS.colors.textMuted}; font-family: ${DS.font.mono}; font-size: 12px; width: 80px; }
    .log-method { color: ${DS.colors.purple}; font-weight: 500; width: 100px; }
    .log-result-pass { color: ${DS.colors.accent}; font-weight: 600; }
    .log-result-fail { color: ${DS.colors.danger}; font-weight: 600; }
    .log-anon { color: ${DS.colors.textMuted}; font-size: 12px; font-family: ${DS.font.mono}; }
    .admin-layout { width: 100%; height: 100%; display: flex; overflow: hidden; }
    .venue-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .venue-card { padding: 20px; border-radius: 14px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: all 0.15s; }
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
    .kiosk-progress { padding: 12px 20px; background: ${DS.colors.surface}; border-top: 1px solid ${DS.colors.border}; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .progress-steps { display: flex; align-items: center; gap: 8px; flex: 1; }
    .prog-step { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: ${DS.colors.textMuted}; }
    .prog-step.done { color: ${DS.colors.accent}; }
    .prog-step.active { color: ${DS.colors.white}; }
    .prog-dot { width: 8px; height: 8px; border-radius: 50%; background: ${DS.colors.textMuted}; }
    .prog-dot.done { background: ${DS.colors.accent}; }
    .prog-dot.active { background: ${DS.colors.white}; box-shadow: 0 0 8px white; }
    .prog-line { flex: 1; height: 1px; background: ${DS.colors.border}; max-width: 30px; }
    .prog-line.done { background: ${DS.colors.accent}; }
    .section-title { font-family: ${DS.font.display}; font-size: 20px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 4px; }
    .section-sub { font-size: 13px; color: ${DS.colors.textSub}; margin-bottom: 16px; }
    .stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .stock-bar-bg { flex: 1; height: 4px; border-radius: 2px; background: ${DS.colors.border}; }
    .stock-bar-fill { height: 4px; border-radius: 2px; transition: width 0.3s; }
    .tag-pill { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
    .auth-screen { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,245,196,0.06) 0%, transparent 70%); }
    .auth-card { width: 420px; padding: 48px 40px; background: #12121a; border: 1px solid #2a2a3e; border-radius: 20px; display: flex; flex-direction: column; gap: 28px; }
    .auth-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 48px; letter-spacing: 0.08em; color: white; text-align: center; }
    .auth-logo span { color: #00f5c4; text-shadow: 0 0 30px #00f5c4; }
    .auth-subtitle { font-size: 14px; color: #8888aa; text-align: center; margin-top: -20px; letter-spacing: 0.04em; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .auth-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #8888aa; font-weight: 600; margin-bottom: 4px; }
    .auth-input { width: 100%; padding: 14px 16px; border-radius: 10px; background: #1a1a26; border: 1px solid #2a2a3e; color: #e8e8f0; font-size: 15px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
    .auth-input:focus { border-color: #00f5c4; }
    .auth-input::placeholder { color: #555570; }
    .auth-btn { width: 100%; padding: 16px; border-radius: 10px; background: #00f5c4; color: #0a0a0f; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.08em; border: none; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
    .auth-btn:hover { background: #00c49a; }
    .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-error { padding: 12px 16px; border-radius: 8px; background: rgba(255,71,87,0.1); border: 1px solid #ff4757; color: #ff4757; font-size: 13px; text-align: center; }
    .auth-role-badge { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 8px; background: rgba(0,245,196,0.1); border: 1px solid rgba(0,245,196,0.3); font-size: 13px; color: #00f5c4; font-weight: 600; }
    .logout-btn { padding: 6px 14px; border-radius: 6px; background: transparent; border: 1px solid #2a2a3e; color: #8888aa; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .logout-btn:hover { border-color: #ff4757; color: #ff4757; }

    .spinner { width: 40px; height: 40px; border: 3px solid ${DS.colors.border}; border-top-color: ${DS.colors.accent}; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { padding: 12px 16px; border-radius: 8px; background: ${DS.colors.dangerGlow}; border: 1px solid ${DS.colors.danger}; color: ${DS.colors.danger}; font-size: 13px; margin-bottom: 16px; }
    .success-banner { padding: 12px 16px; border-radius: 8px; background: ${DS.colors.accentGlow}; border: 1px solid ${DS.colors.accent}; color: ${DS.colors.accent}; font-size: 13px; margin-bottom: 16px; }
  `}</style>
);

// ============================================================
// UTILITY
// ============================================================
const fmt = (n) => `£${Number(n).toFixed(2)}`;
const uid = () => "ORD-" + Math.random().toString(36).substr(2, 4).toUpperCase();
const penceToGBP = (p) => p / 100;
const GBPtoPence = (p) => Math.round(p * 100);

// ============================================================
// PRODUCT IMAGE
// ============================================================
function ProductImage({ imageUrl, name, size = "card" }) {
  const [errored, setErrored] = useState(false);
  const FALLBACK = { "ELUX": "💧", "HAYATI": "🫧", "VAPORESSO": "⚡", "OXVA": "🔋" };
  const brand = name?.split(" ")[0]?.toUpperCase();
  const fallback = FALLBACK[brand] || "🛒";

  if (size === "card") {
    return (
      <div className="product-image-wrap">
        {!errored
          ? <img src={imageUrl} alt={name} className="product-image" onError={() => setErrored(true)} crossOrigin="anonymous" />
          : <span style={{ fontSize: 48 }}>{fallback}</span>}
      </div>
    );
  }
  const s = size === "thumb" ? 48 : 32;
  return errored
    ? <span style={{ fontSize: s * 0.7, width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center" }}>{fallback}</span>
    : <img src={imageUrl} alt={name} crossOrigin="anonymous" onError={() => setErrored(true)}
        style={{ width: s, height: s, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.03)", flexShrink: 0 }} />;
}

// ============================================================
// KIOSK — WELCOME
// ============================================================
function KioskWelcome({ onStart }) {
  return (
    <div className="welcome-screen">
      <div>
        <div className="welcome-logo">J<span className="glow">arv</span>ID</div>
        <div className="welcome-sub">Compliance & Ordering Platform for Age-Restricted Retail</div>
      </div>
      <div className="welcome-age-notice">
        ⚠️ You must be 18 or over to purchase these products.
        Age verification is required before your order can be completed.
        Please have a valid form of ID ready — driving licence, passport, or Yoti digital ID.
      </div>
      <button className="btn-primary" onClick={onStart}>TAP TO START</button>
      <div style={{ fontSize: 13, color: DS.colors.textMuted }}>Staff Fulfilled · Age Verified · Fully Compliant</div>
      <div style={{ fontSize: 12, color: DS.colors.textMuted, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "6px 14px", letterSpacing: "0.04em" }}>
        ℹ️ This is not a vending machine. All orders are fulfilled by a member of staff.
      </div>
    </div>
  );
}

// ============================================================
// KIOSK — BROWSE (loads products from Supabase)
// ============================================================
function KioskBrowse({ cart, onAddToCart, onRemoveFromCart, onCheckout, venueId, onProductsLoaded }) {
  const [cat, setCat] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        // Always fetch all active products; filter by venue if venueId is provided
        let query = supabase
          .from("products")
          .select(`*, inventory(quantity)`)
          .eq("is_active", true)
          .order("name");

        if (venueId) query = query.eq("venue_id", venueId);

        const { data, error: err } = await query;
        if (err) throw err;

        const mapped = (data || []).map(p => ({
          ...p,
          stock: p.inventory?.[0]?.quantity ?? 0,
          price: penceToGBP(p.price_pence),
        }));
        setProducts(mapped);
        // Pass products up to KioskView so payment screen can use them
        if (onProductsLoaded) onProductsLoaded(mapped);
      } catch (e) {
        console.error("Error loading products:", e);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [venueId]);

  const filtered = cat === "all" ? products : products.filter(p => p.category === cat);
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalPrice = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
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
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, flexDirection: "column", gap: 16 }}>
            <div className="spinner" />
            <div style={{ color: DS.colors.textMuted, fontSize: 13 }}>Loading products…</div>
          </div>
        )}
        {error && <div className="error-banner" style={{ margin: 20 }}>{error}</div>}
        {!loading && !error && (
          <div className="product-grid">
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: DS.colors.textMuted }}>
                No products in this category
              </div>
            )}
            {filtered.map(p => {
              const inCart = cart[p.id] || 0;
              const lowStock = p.stock < 5;
              return (
                <div key={p.id} className={`product-card ${inCart > 0 ? "in-cart" : ""} ${lowStock ? "low-stock" : ""}`}>
                  {p.popular && <div className="popular-badge">HOT</div>}
                  <ProductImage imageUrl={p.image_url} name={p.name} size="card" />
                  <div className="product-brand">{p.brand}</div>
                  <div className="product-name">{p.name}</div>
                  {p.flavour && <div className="product-flavour">{p.flavour}</div>}
                  {p.nicotine_mg && p.nicotine_mg !== "N/A" && <div className="product-nic">{p.nicotine_mg}</div>}
                  <div className="product-price">{fmt(p.price)}</div>
                  <div className="product-stock">
                    {lowStock ? <span className="low-stock-tag">⚠ Only {p.stock} left</span> : <span>{p.stock} in stock</span>}
                  </div>
                  {inCart > 0 ? (
                    <div className="product-qty-row">
                      <button className="product-qty-btn minus" onClick={e => { e.stopPropagation(); onRemoveFromCart(p.id); }}>−</button>
                      <div className="product-qty-num">{inCart}</div>
                      <button className="product-qty-btn" onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}>+</button>
                    </div>
                  ) : (
                    <button className="product-add-btn" onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}>+</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                const p = products.find(x => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="cart-item">
                    <ProductImage imageUrl={p.image_url} name={p.name} size="thumb" />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{p.name}</div>
                      <div className="cart-item-price">{fmt(p.price)} each</div>
                    </div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => onRemoveFromCart(id)}>−</button>
                      <div className="qty-num">{qty}</div>
                      <button className="qty-btn" onClick={() => onAddToCart(id)}>+</button>
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

// ============================================================
// KIOSK — AGE VERIFY (logs to Supabase)
// ============================================================
function KioskAgeVerify({ onVerified, onBack, kioskId }) {
  const [phase, setPhase] = useState("choose");
  const [method, setMethod] = useState(null);
  const [verificationId, setVerificationId] = useState(null);

  const logVerification = async (methodName, result) => {
    try {
      const { data, error } = await supabase
        .from("age_verifications")
        .insert({
          kiosk_id: kioskId || null,
          method: methodName.toLowerCase().replace(/\s+/g, "_"),
          result,
          user_token_hash: `anon_${Math.random().toString(36).substr(2, 8)}`,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) console.error("Age verification log error:", error);
      return data?.id || null;
    } catch (e) {
      console.error("Age verification log failed:", e);
      return null;
    }
  };

  const startScan = async (m) => {
    setMethod(m);
    setPhase("scanning");
    setTimeout(async () => {
      const vid = await logVerification(m, "pass");
      setVerificationId(vid);
      setPhase("success");
    }, 3000);
  };

  const manualApproval = () => {
    setMethod("Staff Check");
    setPhase("manual_wait");
    setTimeout(async () => {
      const vid = await logVerification("Staff Check", "pass");
      setVerificationId(vid);
      setPhase("success");
    }, 4000);
  };

  if (phase === "success") {
    return (
      <div className="age-verify-screen">
        <div style={{ fontSize: 80 }}>✅</div>
        <div className="age-heading" style={{ color: DS.colors.accent }}>AGE VERIFIED</div>
        <div className="age-sub">Your identity has been confirmed via <strong style={{ color: DS.colors.white }}>{method}</strong>. Proceeding to payment.</div>
        <button className="btn-primary" onClick={() => onVerified(verificationId)}>CONTINUE TO PAYMENT →</button>
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
          <div style={{ fontSize: 40 }}>{method === "Yoti" ? "📱" : method === "Passport" ? "📘" : "🪪"}</div>
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
        {[
          { m: "Driving Licence", icon: "🪪", desc: "Scan UK driving licence barcode" },
          { m: "Passport",        icon: "📘", desc: "Scan passport MRZ" },
          { m: "Yoti",            icon: "📱", desc: "Show Yoti QR code" },
          { m: "AI Camera",       icon: "🎥", desc: "Camera facial analysis" },
        ].map(v => (
          <div key={v.m} className="verify-option" onClick={() => startScan(v.m)}>
            <div className="verify-icon">{v.icon}</div>
            <div className="verify-label">{v.m}</div>
            <div className="verify-desc">{v.desc}</div>
          </div>
        ))}
        <div className="verify-option" onClick={manualApproval} style={{ borderColor: DS.colors.warn }}>
          <div className="verify-icon">👤</div>
          <div className="verify-label">Staff Override</div>
          <div className="verify-desc">Ask staff to verify</div>
        </div>
      </div>
      <button className="btn-sm btn-outline" onClick={onBack}>← Back to products</button>
    </div>
  );
}

// ============================================================
// KIOSK — PAYMENT (simulated; creates real order in Supabase)
// ============================================================
function KioskPayment({ cart, products, onPaid, verificationId, kioskId, venueId }) {
  const [phase, setPhase] = useState("waiting");
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  const total = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);

  const createOrder = async () => {
    try {
      // 1. Create order record
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          kiosk_id: kioskId || null,
          venue_id: venueId || null,
          status: "pending",
          total_pence: GBPtoPence(total),
          payment_method: "card",
          age_verification_id: verificationId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create order items
      const items = Object.entries(cart).map(([id, qty]) => {
        const p = products.find(x => x.id === id);
        return {
          order_id: order.id,
          product_id: id,
          quantity: qty,
          unit_price_pence: GBPtoPence(p?.price || 0),
        };
      });

      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      return order.id;
    } catch (e) {
      console.error("Order creation failed:", e);
      throw e;
    }
  };

  const handleTap = async () => {
    setPhase("processing");
    setError(null);
    try {
      // Simulate payment delay, then create order
      await new Promise(r => setTimeout(r, 2500));
      const oid = await createOrder();
      setOrderId(oid);
      setPhase("done");
      setTimeout(() => onPaid(oid), 1500);
    } catch (e) {
      setError("Payment failed. Please try again.");
      setPhase("waiting");
    }
  };

  return (
    <div className="payment-screen">
      {error && <div className="error-banner">{error}</div>}
      <div className="payment-heading">
        {phase === "done" ? "✅ PAYMENT SUCCESS" : phase === "processing" ? "PROCESSING…" : "READY TO PAY"}
      </div>
      <div className="payment-amount">{fmt(total)}</div>
      <div className="payment-terminal" onClick={phase === "waiting" ? handleTap : undefined}
        style={{ cursor: phase === "waiting" ? "pointer" : "default" }}>
        <div className="nfc-icon" style={{ borderColor: phase === "done" ? DS.colors.accent : phase === "processing" ? DS.colors.blue : DS.colors.accent }}>
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
        <div style={{ fontSize: 13, color: DS.colors.textMuted }}>Powered by Stripe · PCI DSS Compliant · End-to-end encrypted</div>
      )}
    </div>
  );
}

// ============================================================
// KIOSK — CONFIRMATION
// ============================================================
function KioskConfirmation({ cart, products, orderId, onReset }) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); onReset(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onReset]);
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return p ? { ...p, qty } : null;
  }).filter(Boolean);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : uid();

  return (
    <div className="confirm-screen">
      <div className="confirm-icon">🎉</div>
      <div className="confirm-heading">ORDER PLACED!</div>
      <div className="order-id">#{shortId}</div>
      <div className="age-sub">
        Your order has been sent to a member of staff for fulfilment. No products are dispensed automatically — a team member will verify and hand over your items at the counter.
      </div>
      <div className="confirm-items">
        {items.map(i => (
          <div key={i.id} className="confirm-item">
            <span>{i.name} ×{i.qty}</span>
            <span style={{ color: DS.colors.accent }}>{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="confirm-item" style={{ borderColor: DS.colors.accent, background: DS.colors.accentGlow }}>
          <span style={{ fontWeight: 700 }}>Total Paid</span>
          <span style={{ color: DS.colors.accent, fontWeight: 700, fontFamily: DS.font.display, fontSize: 18 }}>{fmt(total)}</span>
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderRadius: 12, background: DS.colors.accentGlow, border: `1px solid ${DS.colors.accent}`, color: DS.colors.accent, fontSize: 16, fontWeight: 600, textAlign: "center" }}>
        👤 A staff member will bring your order to you shortly
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 13, color: DS.colors.textMuted }}>
          Returning to start in <strong style={{ color: DS.colors.white }}>{countdown}</strong> seconds…
        </div>
        <button className="btn-sm btn-outline" onClick={onReset}>Start New Order</button>
      </div>
    </div>
  );
}

// ============================================================
// KIOSK — PROGRESS BAR
// ============================================================
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

// ============================================================
// KIOSK VIEW
// ============================================================
function KioskView() {
  const [screen, setScreen] = useState("welcome");
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [verificationId, setVerificationId] = useState(null);
  const [placedOrderId, setPlacedOrderId] = useState(null);

  // Using null venueId for now (loads all products); replace with real venue UUID once auth is added
  const venueId = null;
  const kioskId = null;

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
      {screen === "browse" && (
        <KioskBrowse
          cart={cart}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onCheckout={() => setScreen("verify")}
          venueId={venueId}
          onProductsLoaded={setProducts}
        />
      )}
      {screen === "verify" && (
        <KioskAgeVerify
          onVerified={(vid) => { setVerificationId(vid); setScreen("payment"); }}
          onBack={() => setScreen("browse")}
          kioskId={kioskId}
        />
      )}
      {screen === "payment" && (
        <KioskPayment
          cart={cart}
          products={products}
          verificationId={verificationId}
          kioskId={kioskId}
          venueId={venueId}
          onPaid={(oid) => { setPlacedOrderId(oid); setScreen("confirm"); }}
        />
      )}
      {screen === "confirm" && (
        <KioskConfirmation cart={cart} products={products} orderId={placedOrderId} onReset={() => { setCart({}); setVerificationId(null); setPlacedOrderId(null); setScreen("welcome"); }} />
      )}
      {screen !== "welcome" && <KioskProgress step={step} />}
    </div>
  );
}

// ============================================================
// STAFF VIEW — live orders from Supabase with realtime
// ============================================================
function StaffView({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [venueName, setVenueName] = useState("");

  useEffect(() => {
    if (user?.venue_id) {
      supabase.from("venues").select("name").eq("id", user.venue_id).single()
        .then(({ data }) => { if (data) setVenueName(data.name); });
    }
  }, [user?.venue_id]);

  const loadOrders = useCallback(async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            unit_price_pence,
            products ( name, brand )
          ),
          age_verifications ( method )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter by venue for staff and managers
      if (user?.venue_id) query = query.eq("venue_id", user.venue_id);

      const { data, error: err } = await query;
      if (err) throw err;
      setOrders(data || []);
    } catch (e) {
      console.error("Error loading orders:", e);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [user?.venue_id]);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("orders-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadOrders]);

  const updateStatus = async (id, status) => {
    const { error: err } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (err) {
      console.error("Status update error:", err);
    } else {
      setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
    }
  };

  const shown = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => o.status === "pending").length;

  const formatTime = (ts) => {
    if (!ts) return "–";
    const d = new Date(ts);
    const diff = Math.round((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff} min ago`;
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="staff-layout">
      <div className="staff-header">
        <div>
          <div className="staff-heading">STAFF ORDERS</div>
          <div className="staff-meta">Live Queue · {loading ? "Loading…" : `${orders.length} total`}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "pending", "preparing", "completed"].map(f => (
            <button key={f} className={`btn-sm ${filter === f ? "btn-accent" : "btn-outline"}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && <span className="badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: DS.colors.textSub }}>
          🟢 {pendingCount} pending · {orders.filter(o => o.status === "preparing").length} preparing
        </div>
      </div>

      {error && <div className="error-banner" style={{ margin: "0 20px" }}>{error}</div>}

      <div className="orders-grid">
        {loading && (
          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        )}
        {!loading && shown.map(order => {
          const items = order.order_items || [];
          const total = items.reduce((s, i) => s + (i.unit_price_pence * i.quantity), 0);
          const verifyMethod = order.age_verifications?.method || "Unknown";

          return (
            <div key={order.id} className={`order-card ${order.status}`}>
              <div className="order-header">
                <div className="order-id-tag">#{order.id.slice(0, 8).toUpperCase()}</div>
                <div className={`status-pill status-${order.status}`}>{order.status}</div>
              </div>
              <div className="order-items-list">
                {items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span className="order-item-name">{item.products?.name || "Product"}</span>
                    <span>×{item.quantity} · {fmt(penceToGBP(item.unit_price_pence * item.quantity))}</span>
                  </div>
                ))}
              </div>
              <div className="order-total-row">
                <span>Total</span>
                <span className="order-total-amount">{fmt(penceToGBP(total))}</span>
              </div>
              <div className="order-meta">
                <span>🕐 {formatTime(order.created_at)}</span>
                <span>✓ {verifyMethod}</span>
                <span>💳 {order.payment_method || "card"}</span>
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
                  <div style={{ fontSize: 13, color: DS.colors.accent, textAlign: "center", width: "100%" }}>✅ Fulfilled · Customer collected</div>
                )}
                {order.status === "rejected" && (
                  <div style={{ fontSize: 13, color: DS.colors.danger, textAlign: "center", width: "100%" }}>✕ Order rejected</div>
                )}
              </div>
            </div>
          );
        })}
        {!loading && shown.length === 0 && (
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
// MANAGER VIEW — loads products from Supabase
// ============================================================
function ManagerView({ user }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQ, setSearchQ] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [weeklySales, setWeeklySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [complianceStats, setComplianceStats] = useState(null);
  const [complianceLog, setComplianceLog] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [venueName, setVenueName] = useState("Loading...");
  const [orgVenues, setOrgVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(user?.venue_id || null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [loadingDayDetail, setLoadingDayDetail] = useState(false);
  const [analyticsView, setAnalyticsView] = useState("weekly");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(null);
  const isOrgAdmin = user?.role === "org_admin";
  const VENUE_ID = selectedVenueId;

  useEffect(() => {
    // Load venue name
    if (selectedVenueId) {
      supabase.from("venues").select("name").eq("id", selectedVenueId).single()
        .then(({ data }) => { if (data) setVenueName(data.name); });
    }
    // Load org venues for org_admin
    if (isOrgAdmin && user?.org_id) {
      supabase.from("venues").select("id, name, location").eq("org_id", user.org_id)
        .then(({ data }) => {
          if (data?.length) {
            setOrgVenues(data);
            if (!selectedVenueId) setSelectedVenueId(data[0].id);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (!VENUE_ID) return;
    loadOverview();
    loadWeeklySales();
    loadTopProducts();
  }, [VENUE_ID]);

  useEffect(() => {
    if (!VENUE_ID) return;
    if (activeSection === "products" || activeSection === "inventory") loadProducts();
    if (activeSection === "compliance") loadCompliance();
    if (activeSection === "staff") loadStaff();
    if (activeSection === "analytics") loadAnalytics("weekly");
  }, [activeSection, VENUE_ID]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [todayRes, yesterdayRes, verifyRes] = await Promise.all([
      supabase.from("orders").select("total_pence, status").eq("venue_id", VENUE_ID).gte("created_at", todayStart.toISOString()).eq("status", "completed"),
      supabase.from("orders").select("total_pence, status").eq("venue_id", VENUE_ID).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()).eq("status", "completed"),
      supabase.from("age_verifications").select("result").gte("verified_at", todayStart.toISOString()),
    ]);

    const todayOrders = todayRes.data || [];
    const yesterdayOrders = yesterdayRes.data || [];
    const verifications = verifyRes.data || [];

    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total_pence || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total_pence || 0), 0);
    const todayCount = todayOrders.length;
    const yesterdayCount = yesterdayOrders.length;
    const avgOrder = todayCount > 0 ? todayRevenue / todayCount : 0;
    const prevAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;
    const passCount = verifications.filter(v => v.result === "pass").length;
    const passRate = verifications.length > 0 ? Math.round((passCount / verifications.length) * 100) : 100;
    const revDelta = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

    setOverview({ todayRevenue, todayCount, avgOrder, prevAvg, verifications: verifications.length, passRate, revDelta, countDelta: todayCount - yesterdayCount });
    setLoadingOverview(false);
  };

  const loadWeeklySales = async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const { data } = await supabase.from("orders").select("total_pence").eq("venue_id", VENUE_ID).eq("status", "completed").gte("created_at", d.toISOString()).lt("created_at", next.toISOString());
      const total = (data || []).reduce((s, o) => s + (o.total_pence || 0), 0);
      days.push({ day: d.toLocaleDateString("en-GB", { weekday: "short" }), fullDate: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), date: new Date(d), sales: penceToGBP(total) });
    }
    setWeeklySales(days);
  };

  const loadTopProducts = async () => {
    const { data } = await supabase.from("order_items").select("product_id, quantity, unit_price_pence, products(name, brand, image_url, category)").order("quantity", { ascending: false });
    if (!data) return;
    const map = {};
    data.forEach(item => {
      const id = item.product_id;
      if (!map[id]) map[id] = { ...item.products, id, units: 0, revenue: 0 };
      map[id].units += item.quantity;
      map[id].revenue += item.quantity * item.unit_price_pence;
    });
    const sorted = Object.values(map).sort((a, b) => b.units - a.units).slice(0, 8);
    setTopProducts(sorted);
  };

  const loadDayDetail = async (dayObj) => {
    setSelectedDay(dayObj);
    setLoadingDayDetail(true);
    const start = new Date(dayObj.date); start.setHours(0,0,0,0);
    const end = new Date(dayObj.date); end.setHours(23,59,59,999);

    const [ordersRes, itemsRes, verifyRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_pence, payment_method, created_at").eq("venue_id", VENUE_ID).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()).order("created_at", { ascending: false }),
      supabase.from("order_items").select("product_id, quantity, unit_price_pence, products(name, brand, image_url), orders!inner(venue_id, created_at)").eq("orders.venue_id", VENUE_ID).gte("orders.created_at", start.toISOString()).lte("orders.created_at", end.toISOString()),
      supabase.from("age_verifications").select("method, result").gte("verified_at", start.toISOString()).lte("verified_at", end.toISOString()),
    ]);

    const orders = ordersRes.data || [];
    const completed = orders.filter(o => o.status === "completed");
    const revenue = completed.reduce((s, o) => s + (o.total_pence || 0), 0);

    // Aggregate product sales
    const productMap = {};
    (itemsRes.data || []).forEach(item => {
      const id = item.product_id;
      if (!productMap[id]) productMap[id] = { ...item.products, id, units: 0, revenue: 0 };
      productMap[id].units += item.quantity;
      productMap[id].revenue += item.quantity * item.unit_price_pence;
    });

    // Payment method breakdown
    const paymentMap = {};
    completed.forEach(o => {
      const m = o.payment_method || "unknown";
      paymentMap[m] = (paymentMap[m] || 0) + 1;
    });

    const verifications = verifyRes.data || [];
    const passes = verifications.filter(v => v.result === "pass").length;

    setDayDetail({
      orders,
      revenue,
      completedCount: completed.length,
      rejectedCount: orders.filter(o => o.status === "rejected").length,
      avgOrder: completed.length > 0 ? revenue / completed.length : 0,
      topProducts: Object.values(productMap).sort((a, b) => b.units - a.units).slice(0, 6),
      paymentBreakdown: paymentMap,
      verifications: verifications.length,
      passRate: verifications.length > 0 ? Math.round((passes / verifications.length) * 100) : 100,
    });
    setLoadingDayDetail(false);
  };

  const loadAnalytics = async (view) => {
    if (!VENUE_ID) return;
    setLoadingAnalytics(true);
    setAnalyticsView(view);
    setAnalyticsSelected(null);

    const { data: orders } = await supabase
      .from("orders")
      .select("total_pence, status, created_at")
      .eq("venue_id", VENUE_ID)
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    const allOrders = orders || [];

    if (view === "weekly") {
      // Group by ISO week
      const weekMap = {};
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay() + 1); // Monday
        startOfWeek.setHours(0,0,0,0);
        const key = startOfWeek.toISOString().slice(0,10);
        if (!weekMap[key]) weekMap[key] = { key, label: startOfWeek.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: 0, orders: 0, startDate: new Date(startOfWeek) };
        weekMap[key].revenue += o.total_pence || 0;
        weekMap[key].orders += 1;
      });
      const weeks = Object.values(weekMap).sort((a, b) => a.startDate - b.startDate);
      // Add wow (week-over-week) change
      weeks.forEach((w, i) => {
        w.prev = i > 0 ? weeks[i-1].revenue : null;
        w.change = w.prev ? Math.round(((w.revenue - w.prev) / w.prev) * 100) : null;
      });
      setAnalyticsData(weeks);
    } else {
      // Group by month
      const monthMap = {};
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        if (!monthMap[key]) monthMap[key] = { key, label, revenue: 0, orders: 0, sortKey: key };
        monthMap[key].revenue += o.total_pence || 0;
        monthMap[key].orders += 1;
      });
      const months = Object.values(monthMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      months.forEach((m, i) => {
        m.prev = i > 0 ? months[i-1].revenue : null;
        m.change = m.prev ? Math.round(((m.revenue - m.prev) / m.prev) * 100) : null;
      });
      setAnalyticsData(months);
    }
    setLoadingAnalytics(false);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase.from("products").select("*, inventory(quantity)").eq("venue_id", VENUE_ID).order("brand");
    if (data) setProducts(data.map(p => ({ ...p, stock: p.inventory?.[0]?.quantity ?? 0, price: penceToGBP(p.price_pence) })));
    setLoadingProducts(false);
  };

  const loadCompliance = async () => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const [statsRes, logRes] = await Promise.all([
      supabase.from("age_verifications").select("result").gte("verified_at", todayStart.toISOString()),
      supabase.from("age_verifications").select("method, result, user_token_hash, verified_at").order("verified_at", { ascending: false }).limit(20),
    ]);
    const all = statsRes.data || [];
    const passes = all.filter(v => v.result === "pass").length;
    setComplianceStats({ total: all.length, passes, fails: all.length - passes, passRate: all.length > 0 ? Math.round((passes / all.length) * 100) : 100 });
    setComplianceLog(logRes.data || []);
  };

  const loadStaff = async () => {
    const { data } = await supabase.from("staff_users").select("*").eq("venue_id", VENUE_ID).order("role");
    setStaffList(data || []);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(searchQ.toLowerCase())
  );

  const maxWeeklySale = Math.max(...weeklySales.map(d => d.sales), 1);

  const navItems = [
    { id: "overview",   icon: "📊", label: "Overview" },
    { id: "analytics",  icon: "📈", label: "Analytics" },
    { id: "products",   icon: "📦", label: "Products" },
    { id: "inventory",  icon: "🏭", label: "Inventory" },
    { id: "compliance", icon: "🔒", label: "Compliance" },
    { id: "staff",      icon: "👥", label: "Staff" },
  ];

  return (
    <div className="manager-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{isOrgAdmin ? "Organisation" : "Venue"}</div>
          {isOrgAdmin && orgVenues.length > 0 ? (
            <select
              value={selectedVenueId || ""}
              onChange={e => setSelectedVenueId(e.target.value)}
              style={{ width: "100%", background: DS.colors.card, border: `1px solid ${DS.colors.border}`, color: DS.colors.text, padding: "6px 8px", borderRadius: 6, fontSize: 13, cursor: "pointer", outline: "none" }}
            >
              {orgVenues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 15, fontWeight: 700 }}>{venueName}</div>
          )}
        </div>
        <div className="sidebar-section">Navigation</div>
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${activeSection === item.id ? "active" : ""}`} onClick={() => setActiveSection(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>

      <div className="manager-content">
        {activeSection === "overview" && (
          <>
            <div>
              <div className="section-title">TODAY'S OVERVIEW</div>
              <div className="section-sub">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
            {loadingOverview ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : overview && (
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Today's Revenue</div>
                  <div className="stat-value">{fmt(penceToGBP(overview.todayRevenue))}</div>
                  <div className={`stat-delta ${overview.revDelta >= 0 ? "delta-up" : "delta-down"}`}>{overview.revDelta >= 0 ? "↑" : "↓"} {Math.abs(overview.revDelta)}% vs yesterday</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Orders Today</div>
                  <div className="stat-value">{overview.todayCount}</div>
                  <div className={`stat-delta ${overview.countDelta >= 0 ? "delta-up" : "delta-down"}`}>{overview.countDelta >= 0 ? "↑" : "↓"} {Math.abs(overview.countDelta)} vs yesterday</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value">{fmt(penceToGBP(overview.avgOrder))}</div>
                  <div className={`stat-delta ${overview.avgOrder >= overview.prevAvg ? "delta-up" : "delta-down"}`}>{overview.avgOrder >= overview.prevAvg ? "↑" : "↓"} vs yesterday</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Age Verifications</div>
                  <div className="stat-value">{overview.verifications}</div>
                  <div className="stat-delta" style={{ color: overview.passRate === 100 ? DS.colors.accent : DS.colors.warn }}>{overview.passRate}% pass rate</div>
                </div>
              </div>
            )}
            <div className="chart-card">
              <div className="chart-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Last 7 Days Sales (£)</span>
                <span style={{ fontSize: 11, color: DS.colors.textMuted, fontWeight: 400 }}>Click a bar for daily breakdown</span>
              </div>
              <div className="bar-chart">
                {weeklySales.map(d => (
                  <div key={d.day} className="bar-col" onClick={() => loadDayDetail(d)} style={{ cursor: "pointer" }}>
                    <div className="bar-val">{d.sales.toFixed(0)}</div>
                    <div className="bar-fill" style={{ height: `${(d.sales / maxWeeklySale) * 80}px`, background: selectedDay?.day === d.day ? DS.colors.purple : DS.colors.accent, opacity: selectedDay && selectedDay.day !== d.day ? 0.4 : 0.9 }} />
                    <div className="bar-label" style={{ color: selectedDay?.day === d.day ? DS.colors.white : DS.colors.textMuted }}>{d.day}</div>
                    <div style={{ fontSize: 9, color: DS.colors.textMuted }}>{d.fullDate}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedDay && (
              <div className="chart-card" style={{ borderColor: DS.colors.purple }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div className="chart-title" style={{ marginBottom: 2 }}>{selectedDay.fullDate} — Daily Breakdown</div>
                    <div style={{ fontSize: 12, color: DS.colors.textMuted }}>{selectedDay.day}</div>
                  </div>
                  <button className="btn-sm btn-outline" onClick={() => { setSelectedDay(null); setDayDetail(null); }}>✕ Close</button>
                </div>
                {loadingDayDetail ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
                ) : dayDetail && (
                  <>
                    <div className="stats-row" style={{ marginBottom: 16 }}>
                      <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(dayDetail.revenue))}</div></div>
                      <div className="stat-card"><div className="stat-label">Completed Orders</div><div className="stat-value" style={{ fontSize: 20 }}>{dayDetail.completedCount}</div></div>
                      <div className="stat-card"><div className="stat-label">Avg Order</div><div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(dayDetail.avgOrder))}</div></div>
                      <div className="stat-card"><div className="stat-label">Rejected</div><div className="stat-value" style={{ fontSize: 20, color: DS.colors.danger }}>{dayDetail.rejectedCount}</div></div>
                      <div className="stat-card"><div className="stat-label">Age Verifications</div><div className="stat-value" style={{ fontSize: 20 }}>{dayDetail.verifications}</div><div className="stat-delta" style={{ color: dayDetail.passRate === 100 ? DS.colors.accent : DS.colors.warn }}>{dayDetail.passRate}% pass</div></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div className="chart-title" style={{ fontSize: 12, marginBottom: 10 }}>Top Products</div>
                        {dayDetail.topProducts.length === 0 ? (
                          <div style={{ color: DS.colors.textMuted, fontSize: 13 }}>No sales data</div>
                        ) : dayDetail.topProducts.map(p => (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${DS.colors.border}` }}>
                            <ProductImage imageUrl={p.image_url} name={p.name} size="thumb" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: DS.colors.textMuted }}>{p.brand}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, color: DS.colors.accent }}>{fmt(penceToGBP(p.revenue))}</div>
                              <div style={{ fontSize: 11, color: DS.colors.textMuted }}>{p.units} units</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="chart-title" style={{ fontSize: 12, marginBottom: 10 }}>Payment Methods</div>
                        {Object.entries(dayDetail.paymentBreakdown).length === 0 ? (
                          <div style={{ color: DS.colors.textMuted, fontSize: 13 }}>No payments</div>
                        ) : Object.entries(dayDetail.paymentBreakdown).map(([method, count]) => (
                          <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${DS.colors.border}` }}>
                            <div style={{ fontSize: 13, textTransform: "capitalize" }}>{method.replace("_", " ")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 80, height: 6, background: DS.colors.border, borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${(count / dayDetail.completedCount) * 100}%`, height: "100%", background: DS.colors.accent, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 13, color: DS.colors.white, width: 20, textAlign: "right" }}>{count}</span>
                            </div>
                          </div>
                        ))}
                        <div style={{ marginTop: 16 }}>
                          <div className="chart-title" style={{ fontSize: 12, marginBottom: 10 }}>All Orders</div>
                          <div style={{ maxHeight: 180, overflowY: "auto" }}>
                            {dayDetail.orders.map(o => (
                              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${DS.colors.border}`, fontSize: 12 }}>
                                <span style={{ color: DS.colors.textMuted }}>{new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span className="tag-pill" style={o.status === "completed" ? { background: DS.colors.accentGlow, color: DS.colors.accent } : o.status === "rejected" ? { background: DS.colors.dangerGlow, color: DS.colors.danger } : { background: "rgba(255,180,0,0.1)", color: DS.colors.warn }}>{o.status}</span>
                                <span style={{ color: DS.colors.accent }}>{fmt(penceToGBP(o.total_pence))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="chart-card">
              <div className="chart-title">Top Products by Units Sold</div>
              <table className="data-table">
                <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ProductImage imageUrl={p.image_url} name={p.name} size="row" />
                        <span>{p.name}<br /><span style={{ fontSize: 11, color: DS.colors.textMuted }}>{p.brand}</span></span>
                      </td>
                      <td style={{ color: DS.colors.white, fontWeight: 600 }}>{p.units}</td>
                      <td style={{ color: DS.colors.accent, fontFamily: DS.font.display, fontSize: 16 }}>{fmt(penceToGBP(p.revenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "analytics" && (
          <>
            <div>
              <div className="section-title">SALES ANALYTICS</div>
              <div className="section-sub">All-time performance · click any row or bar to compare</div>
            </div>

            {/* Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              {["weekly", "monthly"].map(v => (
                <button key={v} className={`btn-sm ${analyticsView === v ? "btn-accent" : "btn-outline"}`}
                  onClick={() => loadAnalytics(v)}
                  style={{ textTransform: "capitalize", minWidth: 90 }}>
                  {v === "weekly" ? "📅 Weekly" : "🗓 Monthly"}
                </button>
              ))}
            </div>

            {loadingAnalytics ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : analyticsData.length === 0 ? (
              <div className="chart-card" style={{ textAlign: "center", padding: 40, color: DS.colors.textMuted }}>No sales data yet</div>
            ) : (() => {
              const maxRev = Math.max(...analyticsData.map(d => d.revenue), 1);
              const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
              const totalOrders = analyticsData.reduce((s, d) => s + d.orders, 0);
              const bestPeriod = [...analyticsData].sort((a,b) => b.revenue - a.revenue)[0];
              const avgPerPeriod = analyticsData.length > 0 ? totalRevenue / analyticsData.length : 0;

              return (
                <>
                  {/* Summary stats */}
                  <div className="stats-row">
                    <div className="stat-card">
                      <div className="stat-label">All-time Revenue</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(totalRevenue))}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">All-time Orders</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{totalOrders}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Avg per {analyticsView === "weekly" ? "Week" : "Month"}</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(avgPerPeriod))}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Best {analyticsView === "weekly" ? "Week" : "Month"}</div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(bestPeriod.revenue))}</div>
                      <div className="stat-delta delta-up">{bestPeriod.label}</div>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="chart-card">
                    <div className="chart-title">{analyticsView === "weekly" ? "Weekly" : "Monthly"} Revenue (£)</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: analyticsData.length > 20 ? 2 : 4, height: 120, marginTop: 8 }}>
                      {analyticsData.map(d => (
                        <div key={d.key} onClick={() => setAnalyticsSelected(analyticsSelected?.key === d.key ? null : d)}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: 2 }}>
                          <div style={{ fontSize: analyticsData.length > 16 ? 0 : 9, color: DS.colors.textSub }}>{d.revenue > 0 ? penceToGBP(d.revenue).toFixed(0) : ""}</div>
                          <div style={{
                            width: "100%", borderRadius: "3px 3px 0 0", minHeight: 4,
                            height: `${(d.revenue / maxRev) * 90}px`,
                            background: analyticsSelected?.key === d.key ? DS.colors.purple : DS.colors.accent,
                            opacity: analyticsSelected && analyticsSelected.key !== d.key ? 0.35 : 0.85,
                            transition: "all 0.2s"
                          }} />
                          <div style={{ fontSize: analyticsData.length > 20 ? 7 : 9, color: analyticsSelected?.key === d.key ? DS.colors.white : DS.colors.textMuted, whiteSpace: "nowrap" }}>{d.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparison table */}
                  <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.colors.border}` }}>
                      <div className="chart-title" style={{ marginBottom: 0 }}>Period Breakdown</div>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{analyticsView === "weekly" ? "Week of" : "Month"}</th>
                          <th>Revenue</th>
                          <th>Orders</th>
                          <th>Avg Order</th>
                          <th>vs Previous</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...analyticsData].reverse().map(d => (
                          <tr key={d.key}
                            onClick={() => setAnalyticsSelected(analyticsSelected?.key === d.key ? null : d)}
                            style={{ cursor: "pointer", background: analyticsSelected?.key === d.key ? "rgba(124,92,191,0.1)" : "transparent" }}>
                            <td style={{ fontWeight: analyticsSelected?.key === d.key ? 700 : 400 }}>{d.label}</td>
                            <td style={{ color: DS.colors.accent, fontFamily: DS.font.display, fontSize: 15 }}>{fmt(penceToGBP(d.revenue))}</td>
                            <td>{d.orders}</td>
                            <td>{d.orders > 0 ? fmt(penceToGBP(d.revenue / d.orders)) : "—"}</td>
                            <td>
                              {d.change === null ? <span style={{ color: DS.colors.textMuted }}>—</span>
                                : d.change >= 0
                                  ? <span style={{ color: DS.colors.accent }}>↑ {d.change}%</span>
                                  : <span style={{ color: DS.colors.danger }}>↓ {Math.abs(d.change)}%</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected period highlight */}
                  {analyticsSelected && (
                    <div className="chart-card" style={{ borderColor: DS.colors.purple }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div className="chart-title" style={{ marginBottom: 0 }}>{analyticsSelected.label} — Snapshot</div>
                        <button className="btn-sm btn-outline" onClick={() => setAnalyticsSelected(null)}>✕</button>
                      </div>
                      <div className="stats-row">
                        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(analyticsSelected.revenue))}</div></div>
                        <div className="stat-card"><div className="stat-label">Orders</div><div className="stat-value" style={{ fontSize: 20 }}>{analyticsSelected.orders}</div></div>
                        <div className="stat-card"><div className="stat-label">Avg Order</div><div className="stat-value" style={{ fontSize: 20 }}>{analyticsSelected.orders > 0 ? fmt(penceToGBP(analyticsSelected.revenue / analyticsSelected.orders)) : "—"}</div></div>
                        <div className="stat-card">
                          <div className="stat-label">vs Previous {analyticsView === "weekly" ? "Week" : "Month"}</div>
                          <div className="stat-value" style={{ fontSize: 20, color: analyticsSelected.change === null ? DS.colors.textMuted : analyticsSelected.change >= 0 ? DS.colors.accent : DS.colors.danger }}>
                            {analyticsSelected.change === null ? "—" : `${analyticsSelected.change >= 0 ? "↑" : "↓"} ${Math.abs(analyticsSelected.change)}%`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {activeSection === "products" && (
          <>
            <div>
              <div className="section-title">PRODUCT CATALOGUE</div>
              <div className="section-sub">Live from database · {products.length} products</div>
            </div>
            <div className="prod-manage">
              <div className="prod-search-row">
                <input className="search-input" placeholder="Search products…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                <button className="btn-sm btn-accent">+ Add Product</button>
              </div>
              {loadingProducts ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
              ) : (
                <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProductImage imageUrl={p.image_url} name={p.name} size="row" />
                            <span>{p.name}<br /><span style={{ fontSize: 11, color: DS.colors.textMuted }}>{p.brand}</span></span>
                          </td>
                          <td><span className="tag-pill" style={{ background: "rgba(124,92,191,0.15)", color: DS.colors.purple }}>{(p.category || "").replace("_", " ")}</span></td>
                          <td style={{ color: DS.colors.accent, fontFamily: DS.font.display, fontSize: 16 }}>{fmt(p.price)}</td>
                          <td><span style={{ color: p.stock < 5 ? DS.colors.danger : p.stock < 15 ? DS.colors.warn : DS.colors.accent }}>{p.stock} units</span></td>
                          <td>
                            <span className="tag-pill" style={p.is_active && p.stock > 0 ? { background: DS.colors.accentGlow, color: DS.colors.accent } : { background: DS.colors.dangerGlow, color: DS.colors.danger }}>
                              {p.is_active && p.stock > 0 ? "Active" : "Inactive"}
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
              )}
            </div>
          </>
        )}

        {activeSection === "inventory" && (
          <>
            <div>
              <div className="section-title">INVENTORY</div>
              <div className="section-sub">Stock levels and reorder alerts</div>
            </div>
            {loadingProducts ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-label">Total SKUs</div><div className="stat-value">{products.length}</div></div>
                  <div className="stat-card"><div className="stat-label">Low Stock</div><div className="stat-value" style={{ color: DS.colors.warn }}>{products.filter(p => p.stock < 10).length}</div><div className="stat-delta" style={{ color: DS.colors.warn }}>⚠ Reorder needed</div></div>
                  <div className="stat-card"><div className="stat-label">Out of Stock</div><div className="stat-value" style={{ color: DS.colors.danger }}>{products.filter(p => p.stock === 0).length}</div></div>
                </div>
                <div className="chart-card">
                  <div className="chart-title">⚠ Low Stock Alerts</div>
                  {products.filter(p => p.stock < 15).sort((a, b) => a.stock - b.stock).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: `1px solid ${DS.colors.border}` }}>
                      <ProductImage imageUrl={p.image_url} name={p.name} size="thumb" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="stock-bar-wrap" style={{ marginTop: 4 }}>
                          <div className="stock-bar-bg" style={{ flex: 1 }}>
                            <div className="stock-bar-fill" style={{ width: `${(p.stock / 40) * 100}%`, background: p.stock < 5 ? DS.colors.danger : DS.colors.warn }} />
                          </div>
                          <span style={{ fontSize: 12, color: DS.colors.textSub, width: 60 }}>{p.stock} / 40</span>
                        </div>
                      </div>
                      <button className="btn-sm btn-accent">Reorder</button>
                    </div>
                  ))}
                  {products.filter(p => p.stock < 15).length === 0 && (
                    <div style={{ textAlign: "center", padding: 40, color: DS.colors.textMuted }}>✅ All stock levels are healthy</div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {activeSection === "compliance" && (
          <>
            <div>
              <div className="section-title">COMPLIANCE LOG</div>
              <div className="section-sub">GDPR-compliant anonymised age verification records</div>
            </div>
            {complianceStats && (
              <div className="stats-row">
                <div className="stat-card"><div className="stat-label">Verifications Today</div><div className="stat-value">{complianceStats.total}</div></div>
                <div className="stat-card"><div className="stat-label">Pass Rate</div><div className="stat-value" style={{ color: DS.colors.accent }}>{complianceStats.passRate}%</div></div>
                <div className="stat-card"><div className="stat-label">Failed / Blocked</div><div className="stat-value" style={{ color: DS.colors.danger }}>{complianceStats.fails}</div></div>
              </div>
            )}
            <div className="chart-card">
              <div className="chart-title">Verification Events (anonymised)</div>
              <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 12 }}>No personal data is stored. User identifiers are one-way hashed tokens.</div>
              <div className="compliance-log">
                {complianceLog.map((entry, i) => (
                  <div key={i} className="log-entry">
                    <div className={`log-dot ${entry.result === "pass" ? "log-dot-pass" : "log-dot-fail"}`} />
                    <div className="log-time">{new Date(entry.verified_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="log-method">{(entry.method || "").replace(/_/g, " ")}</div>
                    <div className={entry.result === "pass" ? "log-result-pass" : "log-result-fail"}>{entry.result === "pass" ? "✓ PASS" : "✗ FAIL"}</div>
                    <div className="log-anon">{entry.user_token_hash || "anon"}</div>
                  </div>
                ))}
                {complianceLog.length === 0 && <div style={{ textAlign: "center", padding: 40, color: DS.colors.textMuted }}>No verifications recorded today</div>}
              </div>
            </div>
          </>
        )}

        {activeSection === "staff" && (
          <>
            <div>
              <div className="section-title">STAFF MANAGEMENT</div>
              <div className="section-sub">Live from database · {staffList.length} accounts</div>
            </div>
            <div className="chart-card">
              <table className="data-table">
                <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s.id}>
                      <td>{s.email}</td>
                      <td><span className="tag-pill" style={{ background: "rgba(124,92,191,0.15)", color: DS.colors.purple }}>{s.role}</span></td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.is_active ? DS.colors.accent : DS.colors.textMuted, display: "inline-block" }} />
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td><button className="btn-sm btn-outline">Edit</button></td>
                    </tr>
                  ))}
                  {staffList.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: DS.colors.textMuted }}>No staff accounts found</td></tr>}
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
// ADMIN VIEW (mostly static for now)
// ============================================================
function AdminView() {
  const [adminSection, setAdminSection] = useState("venues");
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  useEffect(() => {
    if (adminSection === "venues") loadVenues();
  }, [adminSection]);

  const loadVenues = async () => {
    setLoadingVenues(true);
    const { data, error } = await supabase.from("venues").select("*").order("name");
    if (!error && data?.length) {
      setVenues(data.map(v => ({ ...v, todaySales: Math.random() * 500 + 100, status: "online" })));
    } else {
      setVenues(MOCK_VENUES);
    }
    setLoadingVenues(false);
  };

  const navItems = [
    { id: "venues",  icon: "🏢", label: "Venues" },
    { id: "devices", icon: "📱", label: "Devices" },
    { id: "billing", icon: "💳", label: "Billing" },
  ];

  return (
    <div className="admin-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Platform</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>JarvID Admin</div>
          <div style={{ fontSize: 12, color: DS.colors.accent }}>● System Healthy</div>
        </div>
        <div className="sidebar-section">Management</div>
        {navItems.map(item => (
          <div key={item.id} className={`sidebar-item ${adminSection === item.id ? "active" : ""}`} onClick={() => setAdminSection(item.id)}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>

      <div className="manager-content">
        {adminSection === "venues" && (
          <>
            <div>
              <div className="section-title">ALL VENUES</div>
              <div className="section-sub">Network-wide overview · {venues.length} venues</div>
            </div>
            <div className="stats-row">
              <div className="stat-card"><div className="stat-label">Total Venues</div><div className="stat-value">{venues.length}</div></div>
              <div className="stat-card"><div className="stat-label">Network Revenue Today</div><div className="stat-value">£1,814</div><div className="stat-delta delta-up">↑ 22%</div></div>
              <div className="stat-card"><div className="stat-label">Total Kiosks</div><div className="stat-value">{venues.reduce((s, v) => s + (v.kiosks || 1), 0)}</div></div>
            </div>
            {loadingVenues ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div className="venue-cards">
                {venues.map((v, i) => (
                  <div key={v.id || i} className="venue-card">
                    <div className="venue-top">
                      <div>
                        <div className="venue-name">{v.name}</div>
                        <div className="venue-loc">📍 {v.location}</div>
                      </div>
                      <div className={`online-dot ${v.status === "online" ? "dot-online" : "dot-offline"}`} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 4 }}>Today's Revenue</div>
                      <div className="venue-sales">{fmt(v.todaySales || 0)}</div>
                    </div>
                    <div className="venue-meta">
                      <span>📱 {v.kiosks || 1} kiosk{(v.kiosks || 1) !== 1 ? "s" : ""}</span>
                      <span style={{ color: v.status === "online" ? DS.colors.accent : DS.colors.danger }}>● {v.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-sm btn-outline" style={{ flex: 1 }}>View</button>
                      <button className="btn-sm btn-accent" style={{ flex: 1 }}>Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {adminSection === "devices" && (
          <>
            <div>
              <div className="section-title">DEVICE MONITORING</div>
              <div className="section-sub">Remote kiosk management</div>
            </div>
            <div className="chart-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "K-001", name: "Kiosk 1", venue: "The Crown Pub", uptime: "99.9%", version: "v2.4.1", status: "online" },
                { id: "K-002", name: "Kiosk 2", venue: "The Crown Pub", uptime: "99.7%", version: "v2.4.1", status: "online" },
                { id: "K-003", name: "Kiosk 1", venue: "Vape HQ Shop", uptime: "100%", version: "v2.4.0", status: "online" },
                { id: "K-004", name: "Kiosk 2", venue: "Vape HQ Shop", uptime: "98.2%", version: "v2.3.9", status: "needs_update" },
                { id: "K-005", name: "Kiosk 1", venue: "The Fox & Hound", uptime: "—", version: "v2.4.1", status: "offline" },
              ].map(d => (
                <div key={d.id} className="device-row">
                  <div>
                    <div className="device-name">{d.id} — {d.name}</div>
                    <div style={{ fontSize: 12, color: DS.colors.textMuted }}>{d.venue}</div>
                  </div>
                  <div className="device-status">
                    <span>⬆ {d.uptime}</span>
                    <span className="tag-pill" style={{
                      background: d.status === "online" ? DS.colors.accentGlow : d.status === "needs_update" ? DS.colors.warnGlow : DS.colors.dangerGlow,
                      color: d.status === "online" ? DS.colors.accent : d.status === "needs_update" ? DS.colors.warn : DS.colors.danger,
                    }}>{d.status === "needs_update" ? "⚠ Update" : d.status}</span>
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
              <div className="stat-card"><div className="stat-label">MRR</div><div className="stat-value">£1,196</div><div className="stat-delta delta-up">↑ 8%</div></div>
              <div className="stat-card"><div className="stat-label">Platform Commission</div><div className="stat-value">£181</div><div className="stat-delta" style={{ color: DS.colors.textSub }}>10% of sales today</div></div>
            </div>
            <div className="chart-card">
              <div className="chart-title">Venue Subscriptions</div>
              <table className="data-table">
                <thead><tr><th>Venue</th><th>Plan</th><th>Monthly Fee</th><th>Status</th></tr></thead>
                <tbody>
                  {venues.map((v, i) => (
                    <tr key={v.id || i}>
                      <td>{v.name}</td>
                      <td><span className="tag-pill" style={{ background: "rgba(47,134,235,0.1)", color: DS.colors.blue }}>Pro</span></td>
                      <td style={{ color: DS.colors.accent }}>{fmt((v.kiosks || 1) * 149)}/mo</td>
                      <td><span className="tag-pill" style={{ background: DS.colors.accentGlow, color: DS.colors.accent }}>Active</span></td>
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
// APP ROOT
// ============================================================

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Fetch role from staff_users table
      const { data: staffData, error: staffError } = await supabase
        .from("staff_users")
        .select("role, venue_id, org_id")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (staffError || !staffData) throw new Error("No staff account found for this email.");
      onLogin({ ...data.user, role: staffData.role, venue_id: staffData.venue_id, org_id: staffData.org_id });
    } catch (e) {
      setError(e.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div>
          <div className="auth-logo">J<span>arv</span>ID</div>
          <div className="auth-subtitle">STAFF & MANAGER PORTAL</div>
        </div>
        <form className="auth-form" onSubmit={handleLogin}>
          <div>
            <div className="auth-label">Email</div>
            <input className="auth-input" type="email" placeholder="you@venue.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <div className="auth-label">Password</div>
            <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div style={{ fontSize: 12, color: "#555570", textAlign: "center" }}>
          This portal is for authorised staff only.<br />Customer kiosk does not require login.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("kiosk");
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: staffData } = await supabase
          .from("staff_users")
          .select("role, venue_id, org_id")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .single();
        if (staffData) setUser({ ...session.user, role: staffData.role, venue_id: staffData.venue_id, org_id: staffData.org_id });
      }
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setActiveTab("kiosk"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Keep pending badge count in sync — scoped to user's venue
  useEffect(() => {
    const fetchPending = async () => {
      let query = supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (user?.venue_id) query = query.eq("venue_id", user.venue_id);
      const { count } = await query;
      setPendingCount(count || 0);
    };

    fetchPending();

    const channel = supabase
      .channel("pending-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchPending)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.venue_id]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowLogin(false);
    // Auto-navigate to correct dashboard based on role
    if (loggedInUser.role === "admin") {
      setActiveTab("admin");
    } else if (loggedInUser.role === "manager") {
      setActiveTab("manager");
    } else {
      setActiveTab("staff");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab("kiosk");
  };

  if (!authChecked) return <><GlobalStyles /><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}><div className="spinner" /></div></>;

  if (showLogin) return <><GlobalStyles /><LoginScreen onLogin={handleLogin} /></>;

  // Tab visibility based on role
  const isStaff = user?.role === "staff";
  const isManager = user?.role === "manager";
  const isOrgAdmin = user?.role === "org_admin";
  const isAdmin = user?.role === "admin";

  const tabs = [
    { id: "kiosk",   label: "🖥 Customer Kiosk", show: true },
    { id: "staff",   label: "👤 Staff Dashboard", show: !!user },
    { id: "manager", label: "📊 Venue Manager", show: isManager || isOrgAdmin || isAdmin },
    { id: "admin",   label: "⚙️ Platform Admin", show: isAdmin },
  ].filter(t => t.show);

  return (
    <>
      <GlobalStyles />
      <div className="app-root">
        <nav className="top-nav">
          <div className="nav-logo">J<span>arv</span>ID</div>
          <div className="nav-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`nav-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => {
                if (!t.public && !user) { setShowLogin(true); return; }
                setActiveTab(t.id);
              }}>
                {t.label}
                {t.id === "staff" && pendingCount > 0 && <span className="badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
              </button>
            ))}
          </div>
          <div className="nav-right">
            {user ? (
              <>
                <div className="auth-role-badge">
                  {user.role === "admin" ? "⚙️" : user.role === "org_admin" ? "🏢" : user.role === "manager" ? "📊" : "👤"} {user.role === "org_admin" ? "Org Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                <span style={{ fontSize: 12, color: DS.colors.textSub }}>{user.email}</span>
                <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <button className="logout-btn" style={{ borderColor: DS.colors.accent, color: DS.colors.accent }} onClick={() => setShowLogin(true)}>
                Staff Login
              </button>
            )}
            <span style={{ fontSize: 12, color: DS.colors.accent }}>● Live</span>
          </div>
        </nav>
        <div className="main-content">
          {activeTab === "kiosk" && <KioskView />}
          {activeTab === "staff" && (user ? <StaffView user={user} /> : <LoginScreen onLogin={handleLogin} />)}
          {activeTab === "manager" && ((isManager || isOrgAdmin || isAdmin) ? <ManagerView user={user} /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, color: DS.colors.textMuted }}>
              <div style={{ fontSize: 48 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Manager access required</div>
              <div style={{ fontSize: 13 }}>Please log in with a manager account</div>
            </div>
          ))}
          {activeTab === "admin" && (isAdmin ? <AdminView /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, color: DS.colors.textMuted }}>
              <div style={{ fontSize: 48 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Admin access required</div>
              <div style={{ fontSize: 13 }}>Please log in with a platform admin account</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
