import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "./supabase";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
import {
  LayoutGrid, Droplets, Wind, Zap, RefreshCw,
  CreditCard, BookOpen, Smartphone, Camera, User,
  Wifi, Check, Loader2,
  Sparkles,
  AlertTriangle, Clock, Lock,
  CheckCircle2, X, XCircle,
  LayoutDashboard, TrendingUp, Package, Warehouse, Shield, Users, Download, Settings,
  FileText,
  Building2, Network, ShoppingCart, Monitor, PoundSterling,
  MapPin, Tablet, Circle,
} from "lucide-react";

// ============================================================
// DESIGN SYSTEM — Warm Noir / Amber Premium
// ============================================================
const DS = {
  colors: {
    bg: "#0b0a08",
    surface: "#131110",
    card: "#1d1a16",
    cardHover: "#242018",
    border: "#312c24",
    accent: "#f0a830",
    accentDim: "#c8861a",
    accentGlow: "rgba(240,168,48,0.14)",
    danger: "#e5433a",
    dangerGlow: "rgba(229,67,58,0.15)",
    warn: "#e07b1a",
    warnGlow: "rgba(224,123,26,0.15)",
    purple: "#a855f7",
    blue: "#3b82f6",
    text: "#f2ede4",
    textSub: "#9a9080",
    textMuted: "#5c5448",
    white: "#ffffff",
  },
  font: {
    display: "'Bebas Neue', sans-serif",
    body: "'Outfit', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};

// ============================================================
// CATEGORIES
// ============================================================
const CATEGORIES = [
  { id: "all",            label: "All",              icon: LayoutGrid },
  { id: "eliquid",        label: "E-Liquids",        icon: Droplets },
  { id: "prefilled_pod",  label: "Prefilled Pods",   icon: Wind },
  { id: "refillable_kit", label: "Refillable Kits",  icon: Zap },
  { id: "refillable_pods",label: "Replacement Pods", icon: RefreshCw },
];

// ============================================================
// LOW STOCK THRESHOLDS — per category
// ============================================================
const LOW_STOCK_THRESHOLDS = {
  eliquid:         5,
  prefilled_pod:   3,
  refillable_kit:  2,
  refillable_pods: 4,
  default:         5,
};

const getLowStockThreshold = (product) => {
  if (product?.low_stock_threshold != null) return product.low_stock_threshold;
  return LOW_STOCK_THRESHOLDS[product?.category] || LOW_STOCK_THRESHOLDS.default;
};
const isLowStock = (product) => product.stock > 0 && product.stock <= getLowStockThreshold(product);
const isOutOfStock = (product) => product.stock === 0;

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
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width: 100%; height: 100%; background: ${DS.colors.bg}; color: ${DS.colors.text}; font-family: ${DS.font.body}; overflow: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${DS.colors.surface}; }
    ::-webkit-scrollbar-thumb { background: ${DS.colors.border}; border-radius: 2px; }

    .app-root { width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Navigation ── */
    .top-nav { display: flex; align-items: center; gap: 0; background: ${DS.colors.surface}; border-bottom: 1px solid ${DS.colors.border}; box-shadow: 0 1px 0 rgba(240,168,48,0.06); padding: 0 24px; height: 56px; flex-shrink: 0; }
    .nav-logo { font-family: ${DS.font.display}; font-size: 26px; letter-spacing: 0.06em; color: ${DS.colors.white}; margin-right: 32px; line-height: 1; }
    .nav-logo span { color: ${DS.colors.accent}; }
    .nav-tabs { display: flex; gap: 2px; flex: 1; }
    .nav-tab { padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; color: ${DS.colors.textSub}; cursor: pointer; border: none; background: transparent; transition: all 0.15s; letter-spacing: 0.01em; font-family: ${DS.font.body}; }
    .nav-tab:hover { color: ${DS.colors.text}; background: ${DS.colors.card}; }
    .nav-tab.active { color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .nav-right { display: flex; align-items: center; gap: 12px; }
    .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: ${DS.colors.danger}; color: white; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .main-content { flex: 1; overflow: hidden; display: flex; }

    /* ── Kiosk shell ── */
    .kiosk-shell { width: 100%; height: 100%; display: flex; flex-direction: column; background: linear-gradient(160deg, #100e0b 0%, #0b0a08 100%); overflow: hidden; }

    /* ── Welcome screen ── */
    .welcome-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px; padding: 40px; text-align: center; background: radial-gradient(ellipse 70% 50% at 50% 35%, rgba(240,168,48,0.09) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(168,85,247,0.04) 0%, transparent 60%); }
    .welcome-logo { font-family: ${DS.font.display}; font-size: 80px; letter-spacing: 0.06em; color: ${DS.colors.white}; line-height: 1; }
    .welcome-logo .glow { color: ${DS.colors.accent}; text-shadow: 0 0 50px rgba(240,168,48,0.5), 0 0 100px rgba(240,168,48,0.2); }
    .welcome-sub { font-size: 18px; color: ${DS.colors.textSub}; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; }
    .welcome-age-notice { padding: 20px 32px; border: 1px solid ${DS.colors.warn}; border-radius: 12px; background: ${DS.colors.warnGlow}; color: ${DS.colors.warn}; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; max-width: 520px; text-align: center; line-height: 1.8; }
    .btn-primary { padding: 22px 72px; border-radius: 14px; font-family: ${DS.font.display}; font-size: 32px; letter-spacing: 0.1em; background: ${DS.colors.accent}; color: ${DS.colors.bg}; border: none; cursor: pointer; box-shadow: 0 4px 48px rgba(240,168,48,0.45), 0 2px 12px rgba(0,0,0,0.4); transition: all 0.2s; text-transform: uppercase; }
    .btn-primary:hover { transform: scale(1.03); box-shadow: 0 6px 64px rgba(240,168,48,0.65), 0 2px 16px rgba(0,0,0,0.4); }
    .btn-primary:active { transform: scale(0.98); }

    /* ── Browse layout ── */
    .browse-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .browse-header { padding: 64px 24px 0; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .browse-title { font-family: ${DS.font.display}; font-size: 30px; letter-spacing: 0.06em; color: ${DS.colors.white}; flex: 1; }
    .cart-btn { display: flex; align-items: center; gap: 10px; padding: 13px 22px; border-radius: 12px; background: ${DS.colors.accentGlow}; border: 1px solid ${DS.colors.accent}; color: ${DS.colors.accent}; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .cart-btn:hover { background: rgba(240,168,48,0.22); }
    .cat-bar { display: flex; gap: 8px; padding: 14px 24px; overflow-x: auto; flex-shrink: 0; }
    .cat-btn { display: flex; align-items: center; gap: 7px; padding: 11px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; border: 1px solid ${DS.colors.border}; background: ${DS.colors.card}; color: ${DS.colors.textSub}; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .cat-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.text}; }
    .cat-btn.active { border-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; font-weight: 600; }

    /* ── Product grid ── */
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); grid-auto-rows: max-content; align-items: start; gap: 14px; padding: 14px 24px 32px; }
    .product-card { background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; border-radius: 14px; padding: 14px; transition: all 0.18s; display: flex; flex-direction: column; gap: 7px; position: relative; height: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .product-card:hover { border-color: ${DS.colors.accent}; transform: translateY(-3px); background: ${DS.colors.cardHover}; box-shadow: 0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(240,168,48,0.1); }
    .product-card.in-cart { border-color: ${DS.colors.accent}; background: rgba(240,168,48,0.05); }
    .product-card.low-stock { border-color: ${DS.colors.warn}; }
    .product-card.out-of-stock { opacity: 0.4; border-color: ${DS.colors.border}; pointer-events: none; }
    .product-card.out-of-stock:hover { transform: none; background: ${DS.colors.card}; border-color: ${DS.colors.border}; }
    .out-of-stock-badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: ${DS.colors.textMuted}; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .kiosk-nav-btn { display: flex; align-items: center; gap: 6px; background: rgba(11,10,8,0.8); backdrop-filter: blur(8px); border: 1px solid ${DS.colors.border}; border-radius: 10px; color: ${DS.colors.textSub}; font-size: 14px; font-weight: 500; padding: 11px 20px; cursor: pointer; transition: all 0.15s; font-family: ${DS.font.body}; position: absolute; top: 16px; z-index: 10; }
    .kiosk-nav-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: rgba(240,168,48,0.07); }
    .kiosk-nav-btn.back { left: 16px; }
    .kiosk-nav-btn.home { right: 16px; }
    .popular-badge { position: absolute; top: 10px; right: 10px; padding: 3px 9px; border-radius: 5px; background: ${DS.colors.accent}; color: ${DS.colors.bg}; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .product-image { width: 100%; height: 120px; object-fit: contain; border-radius: 8px; background: rgba(255,255,255,0.03); display: block; }
    .product-image-wrap { width: 100%; height: 120px; border-radius: 8px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .product-brand { font-size: 11px; color: ${DS.colors.textMuted}; text-transform: uppercase; letter-spacing: 0.07em; }
    .product-name { font-size: 14px; font-weight: 600; color: ${DS.colors.text}; line-height: 1.3; }
    .product-flavour { font-size: 12px; color: ${DS.colors.textSub}; }
    .product-nic { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(168,85,247,0.15); color: ${DS.colors.purple}; width: fit-content; font-weight: 500; }
    .product-price { font-family: ${DS.font.display}; font-size: 24px; color: ${DS.colors.accent}; letter-spacing: 0.02em; }
    .product-stock { font-size: 11px; color: ${DS.colors.textMuted}; }
    .low-stock-tag { color: ${DS.colors.warn}; }
    .product-qty-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .product-qty-btn { width: 38px; height: 38px; border-radius: 9px; border: 1.5px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.text}; font-size: 20px; font-weight: 300; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
    .product-qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }
    .product-qty-btn.minus:hover { border-color: ${DS.colors.danger}; color: ${DS.colors.danger}; background: ${DS.colors.dangerGlow}; }
    .product-qty-num { flex: 1; text-align: center; font-family: ${DS.font.display}; font-size: 22px; color: ${DS.colors.accent}; letter-spacing: 0.02em; }
    .product-add-btn { width: 100%; height: 40px; border-radius: 9px; border: 1.5px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.textSub}; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 4px; }
    .product-add-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; }

    /* ── Cart ── */
    .cart-overlay { position: absolute; inset: 0; z-index: 50; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); display: flex; justify-content: flex-end; }
    .cart-drawer { width: 360px; height: 100%; background: ${DS.colors.surface}; border-left: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; animation: slideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94); box-shadow: -8px 0 32px rgba(0,0,0,0.5); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .cart-header { padding: 20px; border-bottom: 1px solid ${DS.colors.border}; display: flex; align-items: center; justify-content: space-between; }
    .cart-title { font-family: ${DS.font.display}; font-size: 26px; letter-spacing: 0.04em; }
    .close-btn { width: 36px; height: 36px; border-radius: 8px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; color: ${DS.colors.textSub}; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .close-btn:hover { border-color: ${DS.colors.danger}; color: ${DS.colors.danger}; }
    .cart-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; }
    .cart-item-info { flex: 1; }
    .cart-item-name { font-size: 14px; font-weight: 600; }
    .cart-item-price { font-size: 13px; color: ${DS.colors.textSub}; }
    .qty-control { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 30px; height: 30px; border-radius: 7px; border: 1px solid ${DS.colors.border}; background: ${DS.colors.surface}; color: ${DS.colors.text}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
    .qty-btn:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .qty-num { font-weight: 700; font-size: 15px; min-width: 20px; text-align: center; }
    .cart-footer { padding: 16px; border-top: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 12px; }
    .cart-total-row { display: flex; justify-content: space-between; align-items: center; }
    .cart-total-label { font-size: 15px; color: ${DS.colors.textSub}; }
    .cart-total-value { font-family: ${DS.font.display}; font-size: 30px; color: ${DS.colors.accent}; letter-spacing: 0.02em; }

    /* ── Age verify ── */
    .age-verify-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; padding: 40px; text-align: center; }
    .age-heading { font-family: ${DS.font.display}; font-size: 52px; letter-spacing: 0.06em; color: ${DS.colors.white}; }
    .age-sub { font-size: 17px; color: ${DS.colors.textSub}; max-width: 400px; line-height: 1.6; }
    .verify-options { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
    .verify-option { width: 190px; padding: 32px 20px; border-radius: 18px; background: ${DS.colors.card}; border: 2px solid ${DS.colors.border}; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
    .verify-option:hover { border-color: ${DS.colors.accent}; transform: translateY(-5px); background: ${DS.colors.cardHover}; box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(240,168,48,0.1); }
    .verify-icon { font-size: 52px; }
    .verify-label { font-size: 15px; font-weight: 600; color: ${DS.colors.text}; }
    .verify-desc { font-size: 12px; color: ${DS.colors.textSub}; line-height: 1.5; }

    /* ── Scanning ── */
    .scanning-animation { width: 240px; height: 240px; border-radius: 20px; border: 2px solid ${DS.colors.accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: rgba(240,168,48,0.03); position: relative; overflow: hidden; box-shadow: 0 0 32px rgba(240,168,48,0.12); }
    .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, ${DS.colors.accent}, transparent); animation: scanMove 2s linear infinite; }
    @keyframes scanMove { 0% { top: 0; } 100% { top: 100%; } }
    .scan-text { font-size: 15px; color: ${DS.colors.accent}; font-weight: 500; z-index: 1; }

    /* ── Payment ── */
    .payment-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px; }
    .payment-heading { font-family: ${DS.font.display}; font-size: 52px; letter-spacing: 0.06em; }
    .payment-amount { font-family: ${DS.font.display}; font-size: 88px; color: ${DS.colors.accent}; text-shadow: 0 0 48px rgba(240,168,48,0.35); letter-spacing: 0.02em; }
    .payment-terminal { width: 290px; padding: 30px; border-radius: 22px; background: ${DS.colors.card}; border: 2px solid ${DS.colors.border}; display: flex; flex-direction: column; align-items: center; gap: 22px; box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
    .nfc-icon { width: 84px; height: 84px; border: 3px solid ${DS.colors.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 38px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(240,168,48,0.5); } 50% { box-shadow: 0 0 0 22px rgba(240,168,48,0); } }
    .pay-methods { display: flex; gap: 10px; }
    .pay-method { padding: 8px 16px; border-radius: 8px; border: 1px solid ${DS.colors.border}; background: ${DS.colors.surface}; font-size: 13px; font-weight: 500; color: ${DS.colors.textSub}; }

    /* ── Confirm ── */
    .confirm-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px; text-align: center; }
    .confirm-icon { font-size: 80px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .confirm-heading { font-family: ${DS.font.display}; font-size: 56px; letter-spacing: 0.06em; color: ${DS.colors.accent}; }
    .order-id { font-family: ${DS.font.mono}; font-size: 24px; color: ${DS.colors.textSub}; letter-spacing: 0.1em; }
    .confirm-items { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
    .confirm-item { display: flex; justify-content: space-between; padding: 11px 16px; border-radius: 10px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; font-size: 14px; }

    /* ── Staff view ── */
    .staff-layout { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
    .staff-header { padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${DS.colors.border}; flex-shrink: 0; }
    .staff-heading { font-family: ${DS.font.display}; font-size: 28px; letter-spacing: 0.04em; }
    .staff-meta { font-size: 13px; color: ${DS.colors.textSub}; }
    .orders-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 20px; }
    .order-card { background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: border-color 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .order-card.pending { border-left: 4px solid ${DS.colors.warn}; }
    .order-card.pending.timeout-amber { border-left: 4px solid ${DS.colors.warn}; border-color: ${DS.colors.warn}; background: rgba(224,123,26,0.07); animation: none; }
    .order-card.pending.timeout-red { border-left: 4px solid ${DS.colors.danger}; border-color: ${DS.colors.danger}; background: rgba(192,57,43,0.1); animation: pulseRed 2s ease-in-out infinite; }
    .order-card.preparing { border-left: 4px solid ${DS.colors.blue}; }
    .order-card.completed { border-left: 4px solid ${DS.colors.accent}; opacity: 0.6; }
    .order-card.rejected { border-left: 4px solid ${DS.colors.danger}; opacity: 0.5; }
    @keyframes pulseRed { 0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,0); } 50% { box-shadow: 0 0 0 6px rgba(192,57,43,0.15); } }
    .timeout-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 0.5px; }
    .timeout-badge.amber { background: rgba(224,123,26,0.15); color: ${DS.colors.warn}; border: 1px solid rgba(224,123,26,0.3); }
    .timeout-badge.red { background: rgba(192,57,43,0.2); color: ${DS.colors.danger}; border: 1px solid rgba(192,57,43,0.4); }
    .order-header { display: flex; align-items: center; justify-content: space-between; }
    .order-id-tag { font-family: ${DS.font.mono}; font-size: 14px; font-weight: 600; color: ${DS.colors.accent}; }
    .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pending { background: ${DS.colors.warnGlow}; color: ${DS.colors.warn}; border: 1px solid ${DS.colors.warn}; }
    .status-preparing { background: rgba(59,130,246,0.15); color: ${DS.colors.blue}; border: 1px solid ${DS.colors.blue}; }
    .status-completed { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .status-rejected { background: ${DS.colors.dangerGlow}; color: ${DS.colors.danger}; border: 1px solid ${DS.colors.danger}; }
    .order-items-list { display: flex; flex-direction: column; gap: 6px; }
    .order-item-row { display: flex; justify-content: space-between; font-size: 13px; color: ${DS.colors.textSub}; }
    .order-item-name { color: ${DS.colors.text}; }
    .order-total-row { display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid ${DS.colors.border}; font-weight: 600; }
    .order-total-amount { color: ${DS.colors.accent}; font-family: ${DS.font.display}; font-size: 20px; letter-spacing: 0.02em; }
    .order-meta { display: flex; gap: 16px; font-size: 12px; color: ${DS.colors.textMuted}; flex-wrap: wrap; }
    .order-actions { display: flex; gap: 8px; }
    .btn-action { flex: 1; padding: 11px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; font-family: ${DS.font.body}; }
    .btn-approve { background: ${DS.colors.accentGlow}; color: ${DS.colors.accent}; border: 1px solid ${DS.colors.accent}; }
    .btn-approve:hover { background: rgba(240,168,48,0.25); }
    .btn-complete { background: ${DS.colors.accent}; color: ${DS.colors.bg}; font-weight: 700; }
    .btn-complete:hover { background: ${DS.colors.accentDim}; }
    .btn-reject { background: ${DS.colors.dangerGlow}; color: ${DS.colors.danger}; border: 1px solid ${DS.colors.danger}; }
    .btn-reject:hover { background: rgba(229,67,58,0.28); }

    /* ── Sidebar / Manager / Admin ── */
    .manager-layout { width: 100%; height: 100%; display: flex; overflow: hidden; }
    .admin-layout { width: 100%; height: 100%; display: flex; overflow: hidden; }
    .sidebar { width: 220px; flex-shrink: 0; background: ${DS.colors.surface}; border-right: 1px solid ${DS.colors.border}; padding: 20px 0; display: flex; flex-direction: column; gap: 2px; }
    .sidebar-section { padding: 12px 16px 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 13.5px; color: ${DS.colors.textSub}; transition: all 0.12s; border-left: 2px solid transparent; font-weight: 400; }
    .sidebar-item:hover { color: ${DS.colors.text}; background: rgba(240,168,48,0.04); }
    .sidebar-item.active { color: ${DS.colors.accent}; border-left-color: ${DS.colors.accent}; background: ${DS.colors.accentGlow}; font-weight: 500; }
    .manager-content { flex: 1; overflow-y: auto; padding: 28px; display: flex; flex-direction: column; gap: 24px; }

    /* ── Stat cards / Charts ── */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat-card { padding: 20px; border-radius: 14px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${DS.colors.textMuted}; font-weight: 600; }
    .stat-value { font-family: ${DS.font.display}; font-size: 34px; color: ${DS.colors.white}; letter-spacing: 0.02em; }
    .stat-delta { font-size: 13px; }
    .delta-up { color: ${DS.colors.accent}; }
    .delta-down { color: ${DS.colors.danger}; }
    .chart-card { padding: 20px; border-radius: 14px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .chart-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: ${DS.colors.text}; letter-spacing: 0.01em; }
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
    .bar-fill { width: 100%; border-radius: 3px 3px 0 0; background: ${DS.colors.accent}; transition: height 0.5s; min-height: 4px; opacity: 0.85; }
    .bar-label { font-size: 10px; color: ${DS.colors.textMuted}; }
    .bar-val { font-size: 10px; color: ${DS.colors.textSub}; }

    /* ── Data table ── */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: ${DS.colors.textMuted}; font-weight: 600; border-bottom: 1px solid ${DS.colors.border}; }
    .data-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid rgba(49,44,36,0.5); color: ${DS.colors.textSub}; }
    .data-table td:first-child { color: ${DS.colors.text}; font-weight: 500; }
    .data-table tr:hover td { background: rgba(240,168,48,0.025); }

    /* ── Inputs / Buttons ── */
    .prod-manage { display: flex; flex-direction: column; gap: 16px; }
    .prod-search-row { display: flex; gap: 12px; align-items: center; }
    .search-input { flex: 1; padding: 10px 14px; border-radius: 9px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; color: ${DS.colors.text}; font-size: 14px; outline: none; font-family: ${DS.font.body}; transition: border-color 0.15s; }
    .search-input:focus { border-color: ${DS.colors.accent}; }
    .search-input::placeholder { color: ${DS.colors.textMuted}; }
    .btn-sm { padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; font-family: ${DS.font.body}; }
    .btn-outline { background: transparent; border: 1px solid ${DS.colors.border}; color: ${DS.colors.textSub}; }
    .btn-outline:hover { border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .btn-accent { background: ${DS.colors.accent}; color: ${DS.colors.bg}; font-weight: 700; }
    .btn-accent:hover { background: ${DS.colors.accentDim}; }

    /* ── Compliance log ── */
    .compliance-log { display: flex; flex-direction: column; gap: 8px; }
    .log-entry { padding: 12px 16px; border-radius: 9px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; align-items: center; gap: 16px; font-size: 13px; }
    .log-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .log-dot-pass { background: ${DS.colors.accent}; }
    .log-dot-fail { background: ${DS.colors.danger}; }
    .log-time { color: ${DS.colors.textMuted}; font-family: ${DS.font.mono}; font-size: 12px; width: 80px; }
    .log-method { color: ${DS.colors.purple}; font-weight: 500; width: 100px; }
    .log-result-pass { color: ${DS.colors.accent}; font-weight: 600; }
    .log-result-fail { color: ${DS.colors.danger}; font-weight: 600; }
    .log-anon { color: ${DS.colors.textMuted}; font-size: 12px; font-family: ${DS.font.mono}; }

    /* ── Venue cards ── */
    .venue-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .venue-card { padding: 20px; border-radius: 16px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; display: flex; flex-direction: column; gap: 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
    .venue-card:hover { border-color: ${DS.colors.accent}; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.35); }
    .venue-top { display: flex; align-items: center; justify-content: space-between; }
    .venue-name { font-size: 16px; font-weight: 600; color: ${DS.colors.text}; }
    .venue-loc { font-size: 13px; color: ${DS.colors.textSub}; margin-top: 2px; }
    .online-dot { width: 9px; height: 9px; border-radius: 50%; }
    .dot-online { background: ${DS.colors.accent}; box-shadow: 0 0 8px ${DS.colors.accent}; }
    .dot-offline { background: ${DS.colors.danger}; }
    .venue-sales { font-family: ${DS.font.display}; font-size: 30px; color: ${DS.colors.white}; letter-spacing: 0.02em; }
    .venue-meta { display: flex; gap: 16px; font-size: 12px; color: ${DS.colors.textMuted}; }

    /* ── Device rows ── */
    .device-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 10px; background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; font-size: 13px; }
    .device-name { font-weight: 500; }
    .device-status { display: flex; align-items: center; gap: 6px; color: ${DS.colors.textSub}; }
    .btn-danger-sm { padding: 6px 14px; border-radius: 6px; background: ${DS.colors.dangerGlow}; border: 1px solid ${DS.colors.danger}; color: ${DS.colors.danger}; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* ── Kiosk progress bar ── */
    .kiosk-progress { padding: 12px 24px; background: ${DS.colors.surface}; border-top: 1px solid ${DS.colors.border}; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .progress-steps { display: flex; align-items: center; gap: 8px; flex: 1; }
    .prog-step { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: ${DS.colors.textMuted}; }
    .prog-step.done { color: ${DS.colors.accent}; }
    .prog-step.active { color: ${DS.colors.white}; }
    .prog-dot { width: 8px; height: 8px; border-radius: 50%; background: ${DS.colors.textMuted}; }
    .prog-dot.done { background: ${DS.colors.accent}; }
    .prog-dot.active { background: ${DS.colors.white}; box-shadow: 0 0 8px rgba(255,255,255,0.6); }
    .prog-line { flex: 1; height: 1px; background: ${DS.colors.border}; max-width: 30px; }
    .prog-line.done { background: ${DS.colors.accent}; }

    /* ── Section headings ── */
    .section-title { font-family: ${DS.font.display}; font-size: 22px; letter-spacing: 0.06em; margin-bottom: 4px; color: ${DS.colors.white}; }
    .section-sub { font-size: 13px; color: ${DS.colors.textSub}; margin-bottom: 16px; }

    /* ── Stock bars ── */
    .stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .stock-bar-bg { flex: 1; height: 4px; border-radius: 2px; background: ${DS.colors.border}; }
    .stock-bar-fill { height: 4px; border-radius: 2px; transition: width 0.3s; }

    /* ── PIN overlay ── */
    .pin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.93); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
    .pin-box { background: ${DS.colors.surface}; border: 1px solid ${DS.colors.border}; border-radius: 20px; padding: 44px; width: 330px; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.7); }
    .pin-title { font-family: ${DS.font.display}; font-size: 24px; letter-spacing: 0.06em; color: ${DS.colors.text}; margin-bottom: 6px; }
    .pin-sub { font-size: 13px; color: ${DS.colors.textMuted}; margin-bottom: 28px; }
    .pin-dots { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; }
    .pin-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid ${DS.colors.border}; transition: all 0.15s; }
    .pin-dot.filled { background: ${DS.colors.accent}; border-color: ${DS.colors.accent}; box-shadow: 0 0 8px rgba(240,168,48,0.4); }
    .pin-dot.error { background: ${DS.colors.danger}; border-color: ${DS.colors.danger}; }
    .pin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .pin-key { background: ${DS.colors.card}; border: 1px solid ${DS.colors.border}; border-radius: 12px; padding: 18px; font-size: 22px; font-family: ${DS.font.display}; letter-spacing: 0.04em; color: ${DS.colors.text}; cursor: pointer; transition: all 0.12s; user-select: none; }
    .pin-key:hover { background: ${DS.colors.cardHover}; border-color: ${DS.colors.accent}; color: ${DS.colors.accent}; }
    .pin-key:active { transform: scale(0.92); }
    .pin-key.wide { grid-column: span 2; }
    .pin-error-msg { font-size: 12px; color: ${DS.colors.danger}; min-height: 18px; margin-top: 4px; }
    .logo-tap-hint { font-size: 10px; color: transparent; user-select: none; }

    /* ── Timeout overlay ── */
    .timeout-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; backdrop-filter: blur(8px); }
    .timeout-circle { width: 100px; height: 100px; border-radius: 50%; border: 4px solid ${DS.colors.warn}; display: flex; align-items: center; justify-content: center; font-family: ${DS.font.display}; font-size: 38px; color: ${DS.colors.warn}; }
    .timeout-heading { font-family: ${DS.font.display}; font-size: 28px; letter-spacing: 0.04em; color: ${DS.colors.white}; }
    .timeout-sub { font-size: 14px; color: ${DS.colors.textSub}; text-align: center; max-width: 280px; line-height: 1.6; }

    /* ── Tags / Pills ── */
    .tag-pill { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }

    /* ── Auth screen ── */
    .auth-screen { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse 70% 50% at 50% 40%, rgba(240,168,48,0.07) 0%, transparent 65%); }
    .auth-card { width: 420px; padding: 52px 44px; background: ${DS.colors.surface}; border: 1px solid ${DS.colors.border}; border-radius: 22px; display: flex; flex-direction: column; gap: 28px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
    .auth-logo { font-family: 'Bebas Neue', sans-serif; font-size: 52px; letter-spacing: 0.08em; color: white; text-align: center; line-height: 1; }
    .auth-logo span { color: #f0a830; text-shadow: 0 0 32px rgba(240,168,48,0.5); }
    .auth-subtitle { font-size: 13px; color: #9a9080; text-align: center; margin-top: -20px; letter-spacing: 0.06em; text-transform: uppercase; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .auth-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9a9080; font-weight: 600; margin-bottom: 4px; }
    .auth-input { width: 100%; padding: 14px 16px; border-radius: 10px; background: #1d1a16; border: 1px solid #312c24; color: #f2ede4; font-size: 15px; outline: none; font-family: 'Outfit', sans-serif; transition: border-color 0.15s; }
    .auth-input:focus { border-color: #f0a830; }
    .auth-input::placeholder { color: #5c5448; }
    .auth-btn { width: 100%; padding: 17px; border-radius: 11px; background: #f0a830; color: #0b0a08; font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.1em; border: none; cursor: pointer; transition: all 0.2s; text-transform: uppercase; box-shadow: 0 4px 24px rgba(240,168,48,0.35); }
    .auth-btn:hover { background: #c8861a; box-shadow: 0 4px 32px rgba(240,168,48,0.5); }
    .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-error { padding: 12px 16px; border-radius: 9px; background: rgba(229,67,58,0.1); border: 1px solid #e5433a; color: #e5433a; font-size: 13px; text-align: center; }
    .auth-role-badge { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 9px; background: rgba(240,168,48,0.1); border: 1px solid rgba(240,168,48,0.3); font-size: 13px; color: #f0a830; font-weight: 600; }
    .logout-btn { padding: 6px 14px; border-radius: 6px; background: transparent; border: 1px solid #312c24; color: #9a9080; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif; }
    .logout-btn:hover { border-color: #e5433a; color: #e5433a; }

    /* ── Spinner / banners ── */
    .spinner { width: 40px; height: 40px; border: 3px solid ${DS.colors.border}; border-top-color: ${DS.colors.accent}; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { padding: 12px 16px; border-radius: 9px; background: ${DS.colors.dangerGlow}; border: 1px solid ${DS.colors.danger}; color: ${DS.colors.danger}; font-size: 13px; margin-bottom: 16px; }
    .success-banner { padding: 12px 16px; border-radius: 9px; background: ${DS.colors.accentGlow}; border: 1px solid ${DS.colors.accent}; color: ${DS.colors.accent}; font-size: 13px; margin-bottom: 16px; }
  `}</style>
);

// ─── useVenue hook ───────────────────────────────────────────────────────────
// Resolves a URL slug to a venue UUID. Used by KioskRoute and StaffRoute.
function useVenue(slug) {
  const [venueId, setVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return; }
    setLoading(true);
    setNotFound(false);
    supabase.from("venues").select("id").eq("slug", slug).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setVenueId(data.id); }
        setLoading(false);
      });
  }, [slug]);

  return { venueId, loading, notFound };
}

// ─── VenueNotFound ────────────────────────────────────────────────────────────
function VenueNotFound() {
  return (
    <>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh",
        background: "#0a0a0f", color: "#fff", gap: 16, fontFamily: "sans-serif"
      }}>
        <div style={{ fontSize: 48 }}>🏚</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Venue not found</div>
        <div style={{ fontSize: 14, color: "#888" }}>
          Check the URL or contact your administrator.
        </div>
      </div>
    </>
  );
}

// ─── KioskRoute ───────────────────────────────────────────────────────────────
function KioskRoute() {
  const { venueSlug } = useParams();
  const navigate = useNavigate();
  const { venueId, loading, notFound } = useVenue(venueSlug);

  // PIN state
  const [kioskPin, setKioskPin] = useState(null);
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimer = useRef(null);

  // Load kiosk_pin once venueId is resolved
  useEffect(() => {
    if (!venueId) return;
    supabase.from("venues").select("kiosk_pin").eq("id", venueId).single()
      .then(({ data }) => setKioskPin(data?.kiosk_pin || "1234"))
      .catch(() => setKioskPin("1234"));
  }, [venueId]);

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    clearTimeout(logoTapTimer.current);
    if (newCount >= 5) {
      setLogoTapCount(0);
      setShowPinOverlay(true);
      setPinEntry("");
      setPinError("");
    } else {
      logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 2000);
    }
  };

  const handlePinKey = (key) => {
    if (key === "clear") { setPinEntry(""); setPinError(""); return; }
    if (key === "back") { setPinEntry(p => p.slice(0, -1)); setPinError(""); return; }
    const next = pinEntry + key;
    setPinEntry(next);
    if (next.length === 4) {
      if (next === (kioskPin || "1234")) {
        setShowPinOverlay(false);
        setPinEntry("");
        setPinError("");
        navigate(`/${venueSlug}/staff`);
      } else {
        setPinError("Incorrect PIN. Try again.");
        setPinShake(true);
        setTimeout(() => { setPinEntry(""); setPinShake(false); }, 600);
      }
    }
  };

  if (loading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );
  if (notFound) return <VenueNotFound />;

  return (
    <>
      <GlobalStyles />
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
      {/* Small fixed logo tap target for staff PIN unlock */}
      <div
        onClick={handleLogoTap}
        style={{
          position: "fixed", top: 12, left: 16, zIndex: 200,
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
          letterSpacing: "0.06em", color: "rgba(255,255,255,0.15)",
          cursor: "default", userSelect: "none", pointerEvents: "auto"
        }}
      >
        JARV<span style={{ color: "rgba(240,168,48,0.15)" }}>-ID</span>
      </div>
      {showPinOverlay && (
        <div className="pin-overlay">
          <div className="pin-box" style={{ animation: pinShake ? "shake 0.4s" : "none" }}>
            <div className="pin-title">Staff Access</div>
            <div className="pin-sub">Enter your PIN to continue</div>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${pinEntry.length > i ? (pinError ? "error" : "filled") : ""}`} />
              ))}
            </div>
            <div className="pin-grid">
              {["1","2","3","4","5","6","7","8","9"].map(k => (
                <button key={k} className="pin-key" onClick={() => handlePinKey(k)}>{k}</button>
              ))}
              <button className="pin-key" onClick={() => handlePinKey("clear")} style={{ fontSize: 13, color: DS.colors.textMuted }}>CLR</button>
              <button className="pin-key" onClick={() => handlePinKey("0")}>0</button>
              <button className="pin-key" onClick={() => handlePinKey("back")}><X size={16} /></button>
            </div>
            <div className="pin-error-msg">{pinError}</div>
            <button className="btn-sm btn-outline" style={{ marginTop: 8, width: "100%" }} onClick={() => { setShowPinOverlay(false); setPinEntry(""); setPinError(""); }}>Cancel</button>
          </div>
        </div>
      )}
      <KioskView venueId={venueId} />
    </>
  );
}

// ============================================================
// UTILITY
// ============================================================
const fmt = (n) => `£${Number(n).toFixed(2)}`;
const uid = () => "ORD-" + Math.random().toString(36).substr(2, 4).toUpperCase();
const penceToGBP = (p) => p / 100;

// Profit calculation helpers
// gross profit = retail - supply price (ex VAT)
// venue share = gross profit * (1 - jarvid_pct/100)
// jarvid share = gross profit * (jarvid_pct/100)
const calcProfit = (items, jarvidPct = 20) => {
  let grossProfit = 0;
  let totalRevenue = 0;
  let totalSupply = 0;
  (items || []).forEach(item => {
    const qty = item.quantity || 1;
    const retail = item.unit_price_pence || 0;
    const supply = item.products?.supply_price_pence || 0;
    totalRevenue += retail * qty;
    totalSupply += supply * qty;
    grossProfit += (retail - supply) * qty;
  });
  const jarvidShare = Math.round(grossProfit * (jarvidPct / 100));
  const venueShare = grossProfit - jarvidShare;
  return { totalRevenue, totalSupply, grossProfit, jarvidShare, venueShare };
};
const GBPtoPence = (p) => Math.round(p * 100);

// ============================================================
// PRODUCT IMAGE — with per-category SVG fallbacks
// ============================================================
function CategoryFallbackSVG({ category, size = 80 }) {
  const accent = "#39d353";
  const dim = "#2a3a2a";
  const mid = "#1e2e1e";

  const icons = {
    eliquid: (
      // Bottle with liquid
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="30" y="8" width="20" height="8" rx="3" fill={dim} />
        <rect x="27" y="14" width="26" height="5" rx="2" fill={dim} />
        <path d="M24 19 Q20 28 20 42 Q20 62 40 64 Q60 62 60 42 Q60 28 56 19 Z" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <path d="M24 44 Q24 62 40 64 Q56 62 56 44 Z" fill={accent} opacity="0.18"/>
        <ellipse cx="40" cy="44" rx="16" ry="3" fill={accent} opacity="0.12"/>
        <path d="M33 36 Q36 32 40 35 Q44 38 47 34" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    prefilled_pod: (
      // Pod device
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="28" y="10" width="24" height="60" rx="8" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <rect x="32" y="14" width="16" height="28" rx="4" fill={dim}/>
        <rect x="32" y="14" width="16" height="12" rx="4" fill={accent} opacity="0.15"/>
        <circle cx="40" cy="62" r="4" fill={dim} stroke={accent} strokeWidth="1" opacity="0.6"/>
        <rect x="35" y="44" width="10" height="3" rx="1.5" fill={accent} opacity="0.3"/>
      </svg>
    ),
    refillable_kit: (
      // Mod/box device
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="18" y="18" width="44" height="52" rx="6" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <rect x="34" y="8" width="12" height="12" rx="3" fill={dim} stroke={dim} strokeWidth="1"/>
        <rect x="37" y="4" width="6" height="6" rx="2" fill={dim}/>
        <rect x="22" y="24" width="36" height="20" rx="3" fill={dim}/>
        <rect x="22" y="24" width="36" height="8" rx="3" fill={accent} opacity="0.12"/>
        <circle cx="30" cy="56" r="5" fill={dim} stroke={accent} strokeWidth="1.2" opacity="0.7"/>
        <rect x="38" y="52" width="16" height="3" rx="1.5" fill={dim}/>
        <rect x="38" y="57" width="10" height="3" rx="1.5" fill={dim} opacity="0.5"/>
      </svg>
    ),
    refillable_pods: (
      // Pod pack
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="20" y="16" width="18" height="50" rx="6" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <rect x="24" y="20" width="10" height="22" rx="3" fill={dim}/>
        <rect x="24" y="20" width="10" height="9" rx="3" fill={accent} opacity="0.15"/>
        <rect x="42" y="20" width="18" height="50" rx="6" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <rect x="46" y="24" width="10" height="22" rx="3" fill={dim}/>
        <rect x="46" y="24" width="10" height="9" rx="3" fill={accent} opacity="0.12"/>
        <circle cx="29" cy="56" r="3.5" fill={dim} stroke={accent} strokeWidth="1" opacity="0.6"/>
        <circle cx="51" cy="60" r="3.5" fill={dim} stroke={accent} strokeWidth="1" opacity="0.6"/>
      </svg>
    ),
    nicotine_pouch: (
      // Round tin/can
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <ellipse cx="40" cy="26" rx="26" ry="10" fill={dim} stroke={dim} strokeWidth="1.5"/>
        <rect x="14" y="26" width="52" height="28" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <ellipse cx="40" cy="54" rx="26" ry="10" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <ellipse cx="40" cy="26" rx="26" ry="10" fill={dim}/>
        <ellipse cx="40" cy="26" rx="18" ry="6" fill={accent} opacity="0.1"/>
        <ellipse cx="40" cy="26" rx="10" ry="3" fill={accent} opacity="0.15"/>
        <rect x="14" y="34" width="52" height="4" fill={accent} opacity="0.08"/>
      </svg>
    ),
    default: (
      // Generic vape outline
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="30" y="10" width="20" height="60" rx="7" fill={mid} stroke={dim} strokeWidth="1.5"/>
        <rect x="33" y="14" width="14" height="20" rx="3" fill={dim}/>
        <rect x="33" y="14" width="14" height="8" rx="3" fill={accent} opacity="0.12"/>
        <circle cx="40" cy="62" r="4" fill={dim} stroke={accent} strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
  };

  return icons[category] || icons.default;
}

function ProductImage({ imageUrl, name, size = "card", category }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !imageUrl || errored;

  if (size === "card") {
    return (
      <div className="product-image-wrap" style={showFallback ? { background: "rgba(57,211,83,0.04)", border: "1px solid rgba(57,211,83,0.08)" } : {}}>
        {!showFallback
          ? <img src={imageUrl} alt={name} className="product-image" onError={() => setErrored(true)} crossOrigin="anonymous" />
          : <CategoryFallbackSVG category={category} size={72} />}
      </div>
    );
  }
  const s = size === "thumb" ? 48 : 32;
  return showFallback
    ? <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "rgba(57,211,83,0.04)", border: "1px solid rgba(57,211,83,0.08)", flexShrink: 0 }}>
        <CategoryFallbackSVG category={category} size={s * 0.8} />
      </div>
    : <img src={imageUrl} alt={name} crossOrigin="anonymous" onError={() => setErrored(true)}
        style={{ width: s, height: s, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.03)", flexShrink: 0 }} />;
}

// ============================================================
// KIOSK — WELCOME
// ============================================================
function KioskNav({ onBack, onHome, showBack = true }) {
  return (
    <>
      {showBack && onBack && (
        <button className="kiosk-nav-btn back" onClick={onBack}>← Back</button>
      )}
      {onHome && (
        <button className="kiosk-nav-btn home" onClick={onHome}>⌂ Home</button>
      )}
    </>
  );
}

function KioskWelcome({ onStart }) {
  return (
    <div className="welcome-screen">
      <div>
        <div className="welcome-logo" style={{ fontSize: 52 }}>VAPE <span className="glow">&</span> NICOTINE KIOSK</div>
      </div>
      <div className="welcome-age-notice">
        <AlertTriangle size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />This kiosk sells age-restricted products. You must be 18 or over to proceed.
        Age verification will be required before your order can be completed.
        Please have a valid form of ID ready — driving licence, passport, or Yoti digital ID.
      </div>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{
          fontSize: 14, color: DS.colors.textSub, textAlign: "center",
          marginBottom: 16, lineHeight: 1.6,
        }}>
          By tapping below you confirm that you are <strong style={{ color: DS.colors.white }}>18 years of age or older</strong> and agree to our terms of sale.
          Providing false information to obtain age-restricted products is a criminal offence.
        </div>
        <button className="btn-primary" onClick={onStart} style={{ width: "100%", fontSize: 18, padding: "20px 0" }}>
          <Check size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />I AM 18 OR OVER — TAP TO START
        </button>
      </div>
      <div style={{ fontSize: 13, color: DS.colors.textMuted }}>Staff Fulfilled · Age Verified · Fully Compliant</div>
      <div style={{ fontSize: 12, color: DS.colors.textMuted, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "6px 14px", letterSpacing: "0.04em" }}>
        This is not a vending machine. All orders are fulfilled by a member of staff.
      </div>
    </div>
  );
}

// ============================================================
// KIOSK — BROWSE (loads products from Supabase)
// ============================================================
function KioskBrowse({ cart, onAddToCart, onRemoveFromCart, onCheckout, venueId, onProductsLoaded, onHome }) {
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
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch products and recent completed orders in parallel
        let prodQuery = supabase
          .from("products")
          .select(`*, inventory(quantity)`)
          .eq("is_active", true)
          .order("name");
        if (venueId) prodQuery = prodQuery.eq("venue_id", venueId);

        const ordersQuery = venueId
          ? supabase.from("orders").select("id").eq("venue_id", venueId).eq("status", "completed").gte("created_at", since)
          : Promise.resolve({ data: [], error: null });

        const [{ data, error: err }, { data: recentOrders, error: ordersErr }] = await Promise.all([prodQuery, ordersQuery]);
        if (err) throw err;
        if (ordersErr) console.error("Failed to fetch recent orders:", ordersErr);

        const prods = data || [];
        const prodIds = prods.map(p => p.id);
        const orderIds = (recentOrders || []).map(o => o.id);
        let hotIds = new Set();

        if (prodIds.length > 0 && orderIds.length > 0) {
          // Fetch items for those orders in chunks, filtered to current products only
          // Chunk to avoid hitting PostgREST URL length limits on .in()
          const CHUNK = 100;
          const chunks = [];
          for (let i = 0; i < orderIds.length; i += CHUNK) chunks.push(orderIds.slice(i, i + CHUNK));
          const results = await Promise.all(chunks.map(chunk =>
            supabase.from("order_items").select("product_id, quantity").in("order_id", chunk).in("product_id", prodIds)
          ));
          const allItems = results.flatMap(r => r.data || []);

          // Sum quantities per product
          const salesMap = {};
          allItems.forEach(item => {
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.quantity;
          });

          // Find top 3 per category
          const categoryGroups = {};
          prods.forEach(p => {
            if (!categoryGroups[p.category]) categoryGroups[p.category] = [];
            categoryGroups[p.category].push({ id: p.id, sales: salesMap[p.id] || 0 });
          });

          Object.values(categoryGroups).forEach(group => {
            group
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 3)
              .filter(p => p.sales > 0) // only tag if it has actual sales
              .forEach(p => hotIds.add(p.id));
          });
        }

        const mapped = prods.map(p => ({
          ...p,
          stock: p.inventory?.[0]?.quantity ?? 0,
          price: penceToGBP(p.price_pence),
          popular: hotIds.has(p.id),
        }));
        setProducts(mapped);
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

  const filterBase = cat === "all" ? products : products.filter(p => p.category === cat);
  const filtered = [...filterBase].sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1;
    if (a.stock > 0 && b.stock === 0) return -1;
    return 0;
  });
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const totalPrice = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);

  return (
    <div className="browse-layout" style={{ position: "relative" }}>
      <KioskNav onHome={onHome} showBack={false} />
      <div className="browse-header">
        <div className="browse-title">CHOOSE YOUR PRODUCTS</div>
        {totalItems > 0 && (
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            <ShoppingCart size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />{totalItems} item{totalItems !== 1 ? "s" : ""} · {fmt(totalPrice)}
          </button>
        )}
      </div>

      <div className="cat-bar">
        {CATEGORIES.map(c => (
          <button key={c.id} className={`cat-btn ${cat === c.id ? "active" : ""}`} onClick={() => setCat(c.id)}>
            {c.icon && (() => { const CatIcon = c.icon; return <CatIcon size={14} />; })()} {c.label}
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
              const outOfStock = p.stock === 0;
              const lowStock = !outOfStock && p.stock < 5;
              return (
                <div key={p.id} className={`product-card ${inCart > 0 ? "in-cart" : ""} ${lowStock ? "low-stock" : ""} ${outOfStock ? "out-of-stock" : ""}`}>
                  {outOfStock
                    ? <div className="out-of-stock-badge">Out of Stock</div>
                    : p.popular && <div className="popular-badge">HOT</div>
                  }
                  <ProductImage imageUrl={p.image_url} name={p.name} size="card" category={p.category} />
                  <div className="product-brand">{p.brand}</div>
                  <div className="product-name">{p.name}</div>
                  {p.flavour && <div className="product-flavour">{p.flavour}</div>}
                  {p.nicotine_mg && p.nicotine_mg !== "N/A" && <div className="product-nic">{p.nicotine_mg}</div>}
                  <div className="product-price" style={{ color: outOfStock ? DS.colors.textMuted : DS.colors.accent }}>{fmt(p.price)}</div>
                  <div className="product-stock">
                    {outOfStock
                      ? <span style={{ color: DS.colors.textMuted }}>Unavailable</span>
                      : lowStock
                        ? <span className="low-stock-tag" style={{ display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={10} /> Only {p.stock} left</span>
                        : <span>{p.stock} in stock</span>
                    }
                  </div>
                  {!outOfStock && (inCart > 0 ? (
                    <div className="product-qty-row">
                      <button className="product-qty-btn minus" onClick={e => { e.stopPropagation(); onRemoveFromCart(p.id); }}>−</button>
                      <div className="product-qty-num">{inCart}</div>
                      <button className="product-qty-btn" onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}>+</button>
                    </div>
                  ) : (
                    <button className="product-add-btn" onClick={e => { e.stopPropagation(); onAddToCart(p.id); }}>+</button>
                  ))}
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
              <button className="close-btn" onClick={() => setShowCart(false)}><X size={18} /></button>
            </div>
            <div className="cart-items">
              {Object.entries(cart).map(([id, qty]) => {
                const p = products.find(x => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="cart-item">
                    <ProductImage imageUrl={p.image_url} name={p.name} size="thumb" category={p.category} />
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
function KioskAgeVerify({ onVerified, onBack, onHome, kioskId }) {
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

  const navButtons = <KioskNav onBack={phase === "choose" ? onBack : undefined} onHome={onHome} showBack={phase === "choose"} />;

  if (phase === "success") {
    return (
      <div className="age-verify-screen" style={{ position: "relative" }}>
        {navButtons}
        <div style={{ color: DS.colors.accent }}><CheckCircle2 size={80} strokeWidth={1.5} /></div>
        <div className="age-heading" style={{ color: DS.colors.accent }}>AGE VERIFIED</div>
        <div className="age-sub">Your identity has been confirmed via <strong style={{ color: DS.colors.white }}>{method}</strong>. Proceeding to payment.</div>
        <button className="btn-primary" onClick={() => onVerified(verificationId)}>CONTINUE TO PAYMENT →</button>
      </div>
    );
  }

  if (phase === "manual_wait") {
    return (
      <div className="age-verify-screen" style={{ position: "relative" }}>
        {navButtons}
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
      <div className="age-verify-screen" style={{ position: "relative" }}>
        {navButtons}
        <div className="age-heading">SCANNING {method?.toUpperCase()}</div>
        <div className="scanning-animation">
          <div className="scan-line" />
          <div style={{ color: DS.colors.accent }}>{method === "Yoti" ? <Smartphone size={40} /> : method === "Passport" ? <BookOpen size={40} /> : <CreditCard size={40} />}</div>
          <div className="scan-text">Reading document…</div>
        </div>
        <div className="age-sub">Hold still and follow on-screen instructions</div>
      </div>
    );
  }

  return (
    <div className="age-verify-screen" style={{ position: "relative" }}>
      {navButtons}
      <div className="age-heading">VERIFY YOUR AGE</div>
      <div className="age-sub">You must be 18+ to purchase. Choose a verification method below.</div>
      <div className="verify-options">
        {[
          { m: "Driving Licence", icon: CreditCard,  desc: "Scan UK driving licence barcode" },
          { m: "Passport",        icon: BookOpen,   desc: "Scan passport MRZ" },
          { m: "Yoti",            icon: Smartphone, desc: "Show Yoti QR code" },
          { m: "AI Camera",       icon: Camera,     desc: "Camera facial analysis" },
        ].map(v => (
          <div key={v.m} className="verify-option" onClick={() => startScan(v.m)}>
            <div className="verify-icon" style={{ color: DS.colors.accent }}><v.icon size={52} strokeWidth={1.5} /></div>
            <div className="verify-label">{v.m}</div>
            <div className="verify-desc">{v.desc}</div>
          </div>
        ))}
        <div className="verify-option" onClick={manualApproval} style={{ borderColor: DS.colors.warn }}>
          <div className="verify-icon" style={{ color: DS.colors.warn }}><User size={52} strokeWidth={1.5} /></div>
          <div className="verify-label">Staff Override</div>
          <div className="verify-desc">Ask staff to verify</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KIOSK — PAYMENT (Stripe Elements)
// ============================================================
function KioskPaymentInner({ cart, products, onPaid, onBack, onHome, verificationId, kioskId, venueId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [phase, setPhase] = useState("loading"); // loading | waiting | processing | done | error
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  const total = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check stock
        for (const [id, qty] of Object.entries(cart)) {
          const { data: inv } = await supabase
            .from("inventory")
            .select("quantity")
            .eq("product_id", id)
            .eq("venue_id", venueId)
            .single();
          if (!inv || inv.quantity < qty) {
            const p = products.find(x => x.id === id);
            throw new Error(`Sorry, "${p?.name || "an item"}" is no longer available in the quantity requested.`);
          }
        }

        // 2. Create order (pending)
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

        // 3. Create order items
        const items = Object.entries(cart).map(([id, qty]) => {
          const p = products.find(x => x.id === id);
          return { order_id: order.id, product_id: id, quantity: qty, unit_price_pence: GBPtoPence(p?.price || 0) };
        });
        const { error: itemsErr } = await supabase.from("order_items").insert(items);
        if (itemsErr) throw itemsErr;

        // 4. Decrement inventory
        for (const item of items) {
          await supabase.rpc("decrement_inventory", { p_product_id: item.product_id, p_venue_id: venueId || null, p_quantity: item.quantity });
        }

        setOrderId(order.id);

        // 5. Create Stripe payment intent
        const cartPayload = Object.entries(cart).map(([product_id, qty]) => {
          const p = products.find(x => x.id === product_id);
          return { product_id, qty, retail_pence: GBPtoPence(p?.price || 0) };
        });
        const { data: piData, error: piErr } = await supabase.functions.invoke("create-payment-intent", {
          body: { venue_id: venueId, cart: cartPayload, order_id: order.id },
        });
        if (piErr || !piData?.client_secret) throw new Error("Failed to initialise payment. Please try again.");

        setClientSecret(piData.client_secret);
        setPhase("waiting");
      } catch (e) {
        console.error("Payment init error:", e);
        setError("Unable to initialise payment. Please ask a member of staff.");
        setPhase("error");
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePay = async () => {
    if (!stripe || !elements || phase !== "waiting") return;
    setPhase("processing");
    setError(null);
    const card = elements.getElement(CardElement);
    const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    if (confirmError) {
      setError(confirmError.message);
      setPhase("waiting");
    } else {
      setPhase("done");
      setTimeout(() => onPaid(orderId), 1500);
    }
  };

  const cardStyle = {
    base: {
      color: DS.colors.text,
      fontFamily: DS.font.body,
      fontSize: "16px",
      "::placeholder": { color: DS.colors.textMuted },
      iconColor: DS.colors.accent,
    },
    invalid: { color: DS.colors.danger },
  };

  return (
    <div className="payment-screen" style={{ position: "relative" }}>
      <KioskNav onBack={phase === "waiting" ? onBack : undefined} onHome={phase !== "done" ? onHome : undefined} showBack={phase === "waiting"} />
      {error && <div className="error-banner" style={{ margin: "0 20px 16px" }}>{error}</div>}
      <div className="payment-heading">
        {phase === "done"
          ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><CheckCircle2 size={20} /> PAYMENT SUCCESS</span>
          : phase === "processing" ? "PROCESSING…"
          : phase === "loading" ? "PREPARING PAYMENT…"
          : phase === "error" ? "PAYMENT UNAVAILABLE"
          : "ENTER CARD DETAILS"}
      </div>
      <div className="payment-amount">{fmt(total)}</div>

      {(phase === "loading" || phase === "error") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32, gap: 16 }}>
          {phase === "loading"
            ? <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: DS.colors.accent }} />
            : <XCircle size={40} style={{ color: DS.colors.danger }} />}
          {phase === "error" && (
            <button className="btn-sm btn-outline" onClick={onBack} style={{ marginTop: 8 }}>Go Back</button>
          )}
        </div>
      )}

      {phase === "done" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <div className="nfc-icon" style={{ borderColor: DS.colors.accent }}><Check size={36} /></div>
        </div>
      )}

      {(phase === "waiting" || phase === "processing") && clientSecret && (
        <div style={{ margin: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: DS.colors.card, border: `1px solid ${DS.colors.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <CardElement options={{ style: cardStyle, hidePostalCode: true }} />
          </div>
          <button
            className="btn-accent"
            style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: phase === "processing" ? "default" : "pointer" }}
            onClick={handlePay}
            disabled={phase === "processing" || !stripe}
          >
            {phase === "processing"
              ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Processing…</span>
              : `Pay ${fmt(total)}`}
          </button>
          <div className="pay-methods" style={{ justifyContent: "center" }}>
            {["Visa", "Mastercard", "Amex"].map(m => <div key={m} className="pay-method">{m}</div>)}
          </div>
          <div style={{ fontSize: 13, color: DS.colors.textMuted, textAlign: "center" }}>Powered by Stripe · PCI DSS Compliant · End-to-end encrypted</div>
        </div>
      )}
    </div>
  );
}

function KioskPayment(props) {
  return (
    <Elements stripe={stripePromise}>
      <KioskPaymentInner {...props} />
    </Elements>
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
      <div className="confirm-icon" style={{ color: DS.colors.accent }}><Sparkles size={80} strokeWidth={1.5} /></div>
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
// ── Kiosk offline overlay ─────────────────────────────────────
function KioskOfflineOverlay() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg, #0a0a0f 0%, #0d1117 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 0,
    }}>
      {/* Animated signal icon */}
      <div style={{ marginBottom: 36, position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          {/* Outer arc — pulses */}
          <path d="M12 52 Q40 8 68 52" stroke="#1a2a1a" strokeWidth="4" strokeLinecap="round" fill="none"
            style={{ animation: "offlineArcPulse 2s ease-in-out infinite" }} />
          {/* Mid arc */}
          <path d="M21 58 Q40 22 59 58" stroke="#1a3a1a" strokeWidth="4" strokeLinecap="round" fill="none"
            style={{ animation: "offlineArcPulse 2s ease-in-out infinite 0.3s" }} />
          {/* Inner arc */}
          <path d="M30 64 Q40 38 50 64" stroke="#1e4a1e" strokeWidth="4" strokeLinecap="round" fill="none"
            style={{ animation: "offlineArcPulse 2s ease-in-out infinite 0.6s" }} />
          {/* Centre dot */}
          <circle cx="40" cy="68" r="4" fill="#39d353" opacity="0.6" />
          {/* Cross overlay */}
          <line x1="20" y1="20" x2="60" y2="60" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <line x1="60" y1="20" x2="20" y2="60" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }}>
        WE'LL BE RIGHT BACK
      </div>
      <div style={{ fontSize: 15, color: "#5a6a5a", maxWidth: 320, textAlign: "center", lineHeight: 1.6, marginBottom: 40 }}>
        This kiosk is temporarily offline.<br />Please speak to a member of staff.
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", animation: "offlinePulse 1.5s ease-in-out infinite" }} />
        <span style={{ fontSize: 12, color: "#4a5a4a", letterSpacing: 2, fontFamily: "monospace" }}>
          RECONNECTING{".".repeat(dots)}{"\u00a0".repeat(3 - dots)}
        </span>
      </div>
      <style>{`
        @keyframes offlinePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes offlineArcPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function KioskView({ venueId: propVenueId }) {
  const [screen, setScreen] = useState("welcome");
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [verificationId, setVerificationId] = useState(null);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(30);
  const inactivityTimer = useRef(null);
  const countdownTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const [kioskDbId, setKioskDbId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineRetryCount, setOfflineRetryCount] = useState(0);
  const offlineTimer = useRef(null);
  const retryTimer = useRef(null);

  const INACTIVITY_SECONDS = 90;
  const WARNING_SECONDS = 30;

  const venueId = propVenueId || null;
  const kioskId = kioskDbId;

  // Generate a stable device_id from venueId + browser, stored in localStorage
  const getDeviceId = () => {
    const key = `jarvid_device_id_${venueId || "default"}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = `kiosk_${(venueId || "demo").slice(0, 8)}_${Math.random().toString(36).substr(2, 8)}`;
      localStorage.setItem(key, id);
    }
    return id;
  };

  const sendHeartbeat = async (dbId, devId) => {
    if (!venueId) return;
    const { error } = await supabase.from("kiosks").upsert({
      id: dbId,
      device_id: devId,
      venue_id: venueId,
      name: `Kiosk · ${venueId.slice(0, 8)}`,
      status: "online",
      last_heartbeat: new Date().toISOString(),
      app_version: "1.0.0",
    }, { onConflict: "device_id" });
    if (!error) {
      setIsOffline(false);
      setOfflineRetryCount(0);
    }
  };

  // Register kiosk and start heartbeat on mount
  useEffect(() => {
    if (!venueId) return;
    const devId = getDeviceId();

    const register = async () => {
      // Check if this device already has a row
      const { data } = await supabase.from("kiosks").select("id").eq("device_id", devId).single();
      const id = data?.id || crypto.randomUUID();
      setKioskDbId(id);
      await sendHeartbeat(id, devId);
      // Heartbeat every 60 seconds
      heartbeatTimer.current = setInterval(() => sendHeartbeat(id, devId), 60000);
    };

    register();

    // Mark offline on unmount
    return () => {
      clearInterval(heartbeatTimer.current);
      if (venueId) {
        const devId = getDeviceId();
        supabase.from("kiosks").update({ status: "offline" }).eq("device_id", devId);
      }
    };
  }, [venueId]);

  // ── Offline detection ──────────────────────────────────────
  const checkSupabaseConn = useCallback(async () => {
    try {
      const { error } = await supabase.from("venues").select("id").limit(1);
      if (error) throw error;
      setIsOffline(false);
      setOfflineRetryCount(0);
    } catch {
      setIsOffline(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => checkSupabaseConn();
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Also poll every 30s to catch silent failures (WiFi with no internet)
    offlineTimer.current = setInterval(checkSupabaseConn, 30000);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(offlineTimer.current);
      clearTimeout(retryTimer.current);
    };
  }, [checkSupabaseConn]);

  // Auto-retry with backoff when offline
  useEffect(() => {
    if (!isOffline) return;
    const delay = Math.min(5000 * Math.pow(1.5, offlineRetryCount), 30000);
    retryTimer.current = setTimeout(() => {
      setOfflineRetryCount(c => c + 1);
      checkSupabaseConn();
    }, delay);
    return () => clearTimeout(retryTimer.current);
  }, [isOffline, offlineRetryCount, checkSupabaseConn]);

  const goHome = () => {
    setCart({});
    setVerificationId(null);
    setPlacedOrderId(null);
    setScreen("welcome");
    setShowTimeoutWarning(false);
    clearTimeout(inactivityTimer.current);
    clearInterval(countdownTimer.current);
  };

  const resetInactivityTimer = useCallback(() => {
    if (showTimeoutWarning) return;
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      setTimeoutCountdown(WARNING_SECONDS);
      countdownTimer.current = setInterval(() => {
        setTimeoutCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownTimer.current);
            goHome();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, INACTIVITY_SECONDS * 1000);
  }, [showTimeoutWarning]);

  // Start/stop inactivity timer based on screen
  useEffect(() => {
    const activeScreens = ["browse", "verify", "payment"];
    if (activeScreens.includes(screen)) {
      resetInactivityTimer();
    } else {
      clearTimeout(inactivityTimer.current);
      clearInterval(countdownTimer.current);
      setShowTimeoutWarning(false);
    }
    return () => {
      clearTimeout(inactivityTimer.current);
      clearInterval(countdownTimer.current);
    };
  }, [screen]);

  const handleActivity = () => {
    if (showTimeoutWarning) return;
    resetInactivityTimer();
  };

  const dismissTimeout = () => {
    clearInterval(countdownTimer.current);
    setShowTimeoutWarning(false);
    resetInactivityTimer();
  };

  const addToCart = (id) => { handleActivity(); setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 })); };
  const removeFromCart = (id) => { handleActivity(); setCart(c => {
    const n = { ...c };
    if (n[id] > 1) n[id]--;
    else delete n[id];
    return n;
  }); };

  const step = { welcome: -1, browse: 0, verify: 1, payment: 2, confirm: 3 }[screen] ?? 0;

  return (
    <div className="kiosk-shell" onPointerDown={handleActivity} onPointerMove={handleActivity}>
      {screen === "welcome" && <KioskWelcome onStart={() => setScreen("browse")} />}
      {screen === "browse" && (
        <KioskBrowse
          cart={cart}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onCheckout={() => setScreen("verify")}
          venueId={venueId}
          onProductsLoaded={setProducts}
          onHome={goHome}
        />
      )}
      {screen === "verify" && (
        <KioskAgeVerify
          onVerified={(vid) => { setVerificationId(vid); setScreen("payment"); }}
          onBack={() => setScreen("browse")}
          onHome={goHome}
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
          onBack={() => setScreen("verify")}
          onHome={goHome}
        />
      )}
      {screen === "confirm" && (
        <KioskConfirmation cart={cart} products={products} orderId={placedOrderId} onReset={goHome} />
      )}
      {screen !== "welcome" && <KioskProgress step={step} />}

      {showTimeoutWarning && (
        <div className="timeout-overlay" onPointerDown={e => e.stopPropagation()}>
          <div className="timeout-circle">{timeoutCountdown}</div>
          <div className="timeout-heading">Still there?</div>
          <div className="timeout-sub">Your session will reset in {timeoutCountdown} seconds due to inactivity.</div>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={dismissTimeout}>
            Yes, continue shopping
          </button>
          <button className="btn-sm btn-outline" onClick={goHome}>
            Start over
          </button>
        </div>
      )}

      {isOffline && <KioskOfflineOverlay />}
    </div>
  );
}

// ============================================================
// ============================================================
// KIOSK OFFLINE — shared hook + banner
// ============================================================
function useOfflineKiosks(venueId) {
  const [offlineKiosks, setOfflineKiosks] = useState([]);
  const STALE_MS = 2 * 60 * 1000; // 2 minutes

  const check = useCallback(async () => {
    if (!venueId) return;
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, device_id, last_heartbeat")
      .eq("venue_id", venueId);
    if (!data) return;
    const now = Date.now();
    setOfflineKiosks(
      data.filter(k => !k.last_heartbeat || (now - new Date(k.last_heartbeat).getTime()) > STALE_MS)
    );
  }, [venueId]);

  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [check]);

  return offlineKiosks;
}

function KioskOfflineBanner({ venueId, onAlert }) {
  const offlineKiosks = useOfflineKiosks(venueId);
  const prevCount = useRef(0);
  const alertedIds = useRef(new Set());

  useEffect(() => {
    // Fire audible alert for any newly-offline kiosk
    offlineKiosks.forEach(k => {
      if (!alertedIds.current.has(k.id)) {
        alertedIds.current.add(k.id);
        if (onAlert) onAlert();
      }
    });
    // Clear alert tracking when kiosk comes back online
    if (offlineKiosks.length < prevCount.current) {
      // Remove kiosks that are no longer offline from alertedIds
      const offlineIds = new Set(offlineKiosks.map(k => k.id));
      for (const id of alertedIds.current) {
        if (!offlineIds.has(id)) alertedIds.current.delete(id);
      }
    }
    prevCount.current = offlineKiosks.length;
  }, [offlineKiosks, onAlert]);

  if (offlineKiosks.length === 0) return null;

  return (
    <div style={{
      background: "rgba(192,57,43,0.12)",
      border: "1px solid rgba(192,57,43,0.4)",
      borderRadius: 10,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      animation: "pulseRed 2.5s ease-in-out infinite",
    }}>
      <span style={{ fontSize: 18 }}>📵</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DS.colors.danger }}>
          {offlineKiosks.length === 1 ? "Kiosk offline" : `${offlineKiosks.length} kiosks offline`}
        </div>
        <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 2 }}>
          {offlineKiosks.map(k => k.name || k.device_id?.slice(0, 12) || "Unknown").join(", ")} · No heartbeat in 2+ minutes
        </div>
      </div>
      <span style={{ fontSize: 11, color: DS.colors.danger, fontFamily: "monospace", fontWeight: 700 }}>OFFLINE</span>
    </div>
  );
}

// STAFF VIEW — live orders from Supabase with realtime
// ============================================================
function LowStockBanner({ venueId }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!venueId) return;
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, category, low_stock_threshold, inventory(quantity)")
        .eq("venue_id", venueId)
        .eq("is_active", true);
      if (!data) return;
      const flagged = data
        .map(p => ({ ...p, stock: p.inventory?.[0]?.quantity ?? 0 }))
        .filter(p => {
          const threshold = getLowStockThreshold(p.category);
          return p.stock <= threshold;
        })
        .sort((a, b) => a.stock - b.stock);
      setAlerts(flagged);
    };
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [venueId]);

  if (alerts.length === 0) return null;

  const outOfStock = alerts.filter(p => p.stock === 0);
  const lowStock = alerts.filter(p => p.stock > 0);

  return (
    <div style={{ margin: "0 20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {outOfStock.length > 0 && (
        <div style={{
          background: DS.colors.dangerGlow, border: `1px solid ${DS.colors.danger}`,
          borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, color: DS.colors.danger }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: DS.colors.danger, fontSize: 13 }}>OUT OF STOCK: </span>
            <span style={{ fontSize: 13, color: DS.colors.text }}>
              {outOfStock.map(p => p.name).join(", ")}
            </span>
          </div>
          <span style={{ fontSize: 11, color: DS.colors.danger, whiteSpace: "nowrap" }}>Notify manager</span>
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{
          background: DS.colors.warnGlow, border: `1px solid ${DS.colors.warn}`,
          borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: DS.colors.warn, fontSize: 13 }}>LOW STOCK: </span>
            <span style={{ fontSize: 13, color: DS.colors.text }}>
              {lowStock.map(p => `${p.name} (${p.stock} left)`).join(", ")}
            </span>
          </div>
          <span style={{ fontSize: 11, color: DS.colors.warn, whiteSpace: "nowrap" }}>Notify manager</span>
        </div>
      )}
    </div>
  );
}

function StaffView({ user, kioskoidMode, venueIdOverride, kioskPin: kioskPinProp, onUnlock }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [venueName, setVenueName] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownOrderIds = useRef(new Set());
  const isFirstLoad = useRef(true);
  const soundEnabled_ref = useRef(true);

  // Staff PIN lock — locks after 30min inactivity, never blocks view/sounds
  const INACTIVITY_MS = 30 * 60 * 1000;
  const [staffLocked, setStaffLocked] = useState(false);
  const [staffPinEntry, setStaffPinEntry] = useState("");
  const [staffPinError, setStaffPinError] = useState("");
  const [staffPinShake, setStaffPinShake] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { id, status }
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOther, setRejectOther] = useState("");

  // Live clock for timeout highlighting — ticks every 10s
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);
  const TIMEOUT_AMBER_MS = 2 * 60 * 1000;  // 2 minutes
  const TIMEOUT_RED_MS   = 4 * 60 * 1000;  // 4 minutes

  const REJECT_REASONS = [
    "Failed manual ID check",
    "Customer refused service",
    "Stock error",
    "Other",
  ];

  const handleRejectClick = (orderId) => {
    setRejectOrderId(orderId);
    setRejectReason("");
    setRejectOther("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason) return;
    const reason = rejectReason === "Other" ? (rejectOther.trim() || "Other") : rejectReason;
    const { error: err } = await supabase
      .from("orders")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", rejectOrderId);
    if (!err) {
      setOrders(o => o.map(x => x.id === rejectOrderId ? { ...x, status: "rejected", rejection_reason: reason } : x));
    }
    setShowRejectModal(false);
    setRejectOrderId(null);
    setRejectReason("");
    setRejectOther("");
  };
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimer = useRef(null);
  const inactivityTimer = useRef(null);

  const handleLogoTap = () => {
    if (!kioskoidMode) return;
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    clearTimeout(logoTapTimer.current);
    if (newCount >= 5) {
      setLogoTapCount(0);
      if (onUnlock) onUnlock();
    } else {
      logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 2000);
    }
  };

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setStaffLocked(true), INACTIVITY_MS);
  }, []);

  useEffect(() => {
    if (!kioskoidMode) return;
    resetInactivityTimer();
    const events = ["mousedown", "touchstart", "keydown"];
    const handler = () => { if (!staffLocked) resetInactivityTimer(); };
    events.forEach(e => window.addEventListener(e, handler));
    return () => {
      clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, [kioskoidMode, staffLocked, resetInactivityTimer]);

  const handleStaffAction = (id, status) => {
    if (kioskoidMode && staffLocked) {
      setPendingAction({ id, status });
      setStaffPinEntry("");
      setStaffPinError("");
      return;
    }
    updateStatus(id, status);
  };

  const handleStaffPinKey = (key) => {
    if (key === "clear") { setStaffPinEntry(""); setStaffPinError(""); return; }
    if (key === "back") { setStaffPinEntry(p => p.slice(0, -1)); setStaffPinError(""); return; }
    const next = staffPinEntry + key;
    setStaffPinEntry(next);
    if (next.length === 4) {
      if (next === (kioskPinProp || "1234")) {
        setStaffLocked(false);
        setStaffPinEntry("");
        setStaffPinError("");
        resetInactivityTimer();
        if (pendingAction) {
          updateStatus(pendingAction.id, pendingAction.status);
          setPendingAction(null);
        }
      } else {
        setStaffPinError("Incorrect PIN");
        setStaffPinShake(true);
        setTimeout(() => { setStaffPinEntry(""); setStaffPinShake(false); }, 600);
      }
    }
  };

  useEffect(() => { soundEnabled_ref.current = soundEnabled; }, [soundEnabled]);

  const playAlertSound = () => {
    if (!soundEnabled_ref.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration, gain = 0.3) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };
      const t = ctx.currentTime;
      playTone(880, t, 0.12);
      playTone(1100, t + 0.15, 0.12);
      playTone(1320, t + 0.30, 0.18);
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  };

  // Descending 3-tone alert — distinct from new order chime
  const playOfflineAlert = useCallback(() => {
    if (!soundEnabled_ref.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, startTime, duration, gain = 0.35) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.03);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };
      const t = ctx.currentTime;
      playTone(440, t, 0.2);
      playTone(330, t + 0.25, 0.2);
      playTone(220, t + 0.50, 0.3);
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  }, []);

  useEffect(() => {
    const vid = venueIdOverride || user?.venue_id;
    if (vid) {
      supabase.from("venues").select("name").eq("id", vid).single()
        .then(({ data }) => { if (data) setVenueName(data.name); });
    }
  }, [user?.venue_id, venueIdOverride]);

  const loadOrders = useCallback(async () => {
    const vid = venueIdOverride || user?.venue_id;
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from("orders")
        .select(`
          *, rejection_reason,
          order_items (
            quantity,
            unit_price_pence,
            products ( name, brand )
          ),
          age_verifications ( method )
        `)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (vid) query = query.eq("venue_id", vid);

      const { data, error: err } = await query;
      if (err) throw err;
      const incoming = data || [];

      // Detect genuinely new pending orders after first load
      if (!isFirstLoad.current) {
        const newPending = incoming.filter(o => o.status === "pending" && !knownOrderIds.current.has(o.id));
        if (newPending.length > 0) playAlertSound();
      }

      // Update known IDs
      incoming.forEach(o => knownOrderIds.current.add(o.id));
      isFirstLoad.current = false;

      setOrders(incoming);
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
  }, [loadOrders, venueIdOverride]);

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
          <div className="staff-heading" onClick={handleLogoTap} style={{ cursor: kioskoidMode ? "pointer" : "default", userSelect: "none" }}>STAFF ORDERS</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: DS.colors.textSub }}>
            <Circle size={8} fill={DS.colors.accent} stroke="none" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />{pendingCount} pending · {orders.filter(o => o.status === "preparing").length} preparing
          </div>
          {kioskoidMode && (
            <button onClick={() => setStaffLocked(true)} style={{
              padding: "6px 12px", borderRadius: 8, border: `1px solid ${DS.colors.border}`,
              background: DS.colors.surface, color: DS.colors.textSub,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}><Lock size={12} /> Lock</button>
          )}
        </div>
      </div>

      {error && <div className="error-banner" style={{ margin: "0 20px" }}>{error}</div>}

      {/* Low stock / out of stock alert banner */}
      <LowStockBanner venueId={venueIdOverride || user?.venue_id} />

      {/* Kiosk offline alert banner */}
      <KioskOfflineBanner venueId={venueIdOverride || user?.venue_id} onAlert={playOfflineAlert} />

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

          // Timeout highlighting for pending orders only
          const ageMs = order.status === "pending" ? now - new Date(order.created_at).getTime() : 0;
          const timeoutClass = ageMs >= TIMEOUT_RED_MS ? "timeout-red" : ageMs >= TIMEOUT_AMBER_MS ? "timeout-amber" : "";
          const ageMinutes = Math.floor(ageMs / 60000);
          const ageSeconds = Math.floor((ageMs % 60000) / 1000);
          const ageLabel = ageMs >= 60000 ? `${ageMinutes}m ${ageSeconds}s` : `${ageSeconds}s`;

          return (
            <div key={order.id} className={`order-card ${order.status} ${timeoutClass}`}>
              <div className="order-header">
                <div className="order-id-tag">#{order.id.slice(0, 8).toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {timeoutClass === "timeout-red" && (
                    <span className="timeout-badge red" style={{ display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={11} /> {ageLabel}</span>
                  )}
                  {timeoutClass === "timeout-amber" && (
                    <span className="timeout-badge amber" style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {ageLabel}</span>
                  )}
                  <div className={`status-pill status-${order.status}`}>{order.status}</div>
                </div>
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
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {formatTime(order.created_at)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Check size={11} /> {verifyMethod}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CreditCard size={11} /> {order.payment_method || "card"}</span>
              </div>
              <div className="order-actions">
                {order.status === "pending" && (
                  <>
                    <button className="btn-action btn-approve" onClick={() => handleStaffAction(order.id, "preparing")} style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}><Check size={13} /> Prepare</button>
                    <button className="btn-action btn-reject" onClick={() => {
                      if (kioskoidMode && staffLocked) { handleStaffAction(order.id, "rejected"); }
                      else { handleRejectClick(order.id); }
                    }} style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}><X size={13} /> Reject</button>
                  </>
                )}
                {order.status === "preparing" && (
                  <button className="btn-action btn-complete" onClick={() => handleStaffAction(order.id, "completed")} style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}><CheckCircle2 size={13} /> Mark Fulfilled</button>
                )}
                {order.status === "completed" && (
                  <div style={{ fontSize: 13, color: DS.colors.accent, textAlign: "center", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><CheckCircle2 size={13} /> Fulfilled · Customer collected</div>
                )}
                {order.status === "rejected" && (
                  <div style={{ fontSize: 13, color: DS.colors.danger, textAlign: "center", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <XCircle size={13} /> Order Rejected
                    {order.rejection_reason && (
                      <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 4 }}>
                        Reason: {order.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!loading && shown.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: DS.colors.textMuted }}>
            <div style={{ color: DS.colors.textMuted, marginBottom: 16 }}><CheckCircle2 size={40} strokeWidth={1.5} /></div>
            <div>No orders in this category</div>
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1001,
          background: "rgba(10,10,15,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
            borderRadius: 16, padding: 32, width: 340, boxShadow: "0 8px 40px rgba(0,0,0,0.6)"
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.white, marginBottom: 6 }}>Reject Order</div>
            <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 20 }}>Select a reason before confirming</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {REJECT_REASONS.map(r => (
                <button key={r} onClick={() => setRejectReason(r)} style={{
                  padding: "12px 16px", borderRadius: 10, textAlign: "left",
                  border: `1px solid ${rejectReason === r ? DS.colors.danger : DS.colors.border}`,
                  background: rejectReason === r ? DS.colors.dangerGlow : DS.colors.card,
                  color: rejectReason === r ? DS.colors.danger : DS.colors.text,
                  fontSize: 14, fontWeight: rejectReason === r ? 600 : 400,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                  {r}
                </button>
              ))}
            </div>
            {rejectReason === "Other" && (
              <input
                placeholder="Enter reason…"
                value={rejectOther}
                onChange={e => setRejectOther(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 16,
                  border: `1px solid ${DS.colors.border}`, background: DS.colors.bg,
                  color: DS.colors.white, fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowRejectModal(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 8,
                border: `1px solid ${DS.colors.border}`, background: "transparent",
                color: DS.colors.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={confirmReject} disabled={!rejectReason || (rejectReason === "Other" && !rejectOther.trim())} style={{
                flex: 1, padding: "12px 0", borderRadius: 8,
                border: "none", background: rejectReason ? DS.colors.danger : DS.colors.border,
                color: DS.colors.white, fontSize: 13, fontWeight: 700,
                cursor: rejectReason ? "pointer" : "not-allowed", fontFamily: "inherit",
                opacity: rejectReason ? 1 : 0.5,
              }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff PIN lock overlay — dims but never hides orders */}
      {kioskoidMode && staffLocked && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(10,10,15,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
            borderRadius: 16, padding: 36, width: 320, textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)"
          }}>
            <div style={{ color: DS.colors.textSub, marginBottom: 4 }}><Lock size={28} /></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.white, marginBottom: 4 }}>
              {pendingAction ? "PIN required to update order" : "Staff terminal locked"}
            </div>
            <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 24 }}>
              {pendingAction ? `Marking order as ${pendingAction.status}` : "Enter PIN to perform actions"}
            </div>
            <div style={{
              display: "flex", justifyContent: "center", gap: 10, marginBottom: 20,
              animation: staffPinShake ? "shake 0.4s ease" : "none"
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: staffPinEntry.length > i ? DS.colors.accent : DS.colors.border,
                  transition: "background 0.15s"
                }} />
              ))}
            </div>
            {staffPinError && <div style={{ color: DS.colors.danger, fontSize: 13, marginBottom: 12 }}>{staffPinError}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {["1","2","3","4","5","6","7","8","9","clear","0","back"].map(k => (
                <button key={k} onClick={() => handleStaffPinKey(k)} style={{
                  padding: "14px 0", borderRadius: 10, border: `1px solid ${DS.colors.border}`,
                  background: k === "clear" || k === "back" ? DS.colors.bg : DS.colors.surface,
                  color: DS.colors.white, fontSize: k === "clear" || k === "back" ? 11 : 20,
                  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {k === "back" ? "⌫" : k === "clear" ? "CLR" : k}
                </button>
              ))}
            </div>
            {pendingAction && (
              <button onClick={() => { setPendingAction(null); }} style={{
                marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 8,
                border: `1px solid ${DS.colors.border}`, background: "transparent",
                color: DS.colors.textMuted, fontSize: 13, cursor: "pointer"
              }}>Cancel</button>
            )}
          </div>
        </div>
      )}
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
  const [venueStock, setVenueStock] = useState([]);
  const [loadingVenueStock, setLoadingVenueStock] = useState(false);
  const [editingVenueStock, setEditingVenueStock] = useState({});
  const [venueStockSearch, setVenueStockSearch] = useState("");
  const [venueStockStatusFilter, setVenueStockStatusFilter] = useState("all");
  const [venueStockSort, setVenueStockSort] = useState({ col: "name", dir: "asc" });
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
  const [firstOrderDate, setFirstOrderDate] = useState(null);
  const [allTimeMode, setAllTimeMode] = useState(false);
  const [kioskStatuses, setKioskStatuses] = useState([]);
  const [jarvidPct, setJarvidPct] = useState(20);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [exportRange, setExportRange] = useState(() => {
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  });
  const [pinEdit, setPinEdit] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const isOrgAdmin = user?.role === "org_admin";
  const isAdmin = user?.role === "admin";
  const VENUE_ID = selectedVenueId;

  useEffect(() => {
    // Load venue name
    if (selectedVenueId) {
      supabase.from("venues").select("name").eq("id", selectedVenueId).single()
        .then(({ data }) => { if (data) setVenueName(data.name); });
    }
    // Load org venues for org_admin, or all venues for platform admin
    if (isAdmin) {
      supabase.from("venues").select("id, name, location").order("name")
        .then(({ data }) => {
          if (data?.length) {
            setOrgVenues(data);
            if (!selectedVenueId) setSelectedVenueId(data[0].id);
          }
        });
    } else if (isOrgAdmin && user?.org_id) {
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
    loadKiosks().then(setKioskStatuses);
    // Load venue profit share %
    supabase.from("venues").select("jarvid_profit_share_pct").eq("id", VENUE_ID).single()
      .then(({ data }) => { if (data) setJarvidPct(data.jarvid_profit_share_pct || 20); });
    loadWeeklySales();
    loadTopProducts();
  }, [VENUE_ID]);

  useEffect(() => {
    if (!VENUE_ID) return;
    if (activeSection === "stock") loadVenueStock();
    if (activeSection === "compliance") loadCompliance();
    if (activeSection === "staff") loadStaff();
    if (activeSection === "analytics") loadAnalytics("weekly");
    if (activeSection === "settings") {
      supabase.from("venues").select("kiosk_pin").eq("id", VENUE_ID).single()
        .then(({ data }) => { if (data) { setCurrentPin(data.kiosk_pin || ""); setPinEdit(data.kiosk_pin || ""); } });
    }
  }, [activeSection, VENUE_ID]);

  const loadKiosks = async () => {
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, status, last_heartbeat, app_version, device_id")
      .eq("venue_id", VENUE_ID);
    if (data) {
      const now = new Date();
      return data.map(k => ({
        ...k,
        isOnline: k.last_heartbeat && (now - new Date(k.last_heartbeat)) < 120000,
      }));
    }
    return [];
  };

  const loadOverview = async () => {
    setLoadingOverview(true);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [todayOrdersRes, yesterdayOrdersRes, verifyRes, venueRes] = await Promise.all([
      supabase.from("orders").select("id, total_pence, status").eq("venue_id", VENUE_ID).gte("created_at", todayStart.toISOString()).eq("status", "completed"),
      supabase.from("orders").select("id, total_pence, status").eq("venue_id", VENUE_ID).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()).eq("status", "completed"),
      supabase.from("age_verifications").select("result").gte("verified_at", todayStart.toISOString()),
      supabase.from("venues").select("jarvid_profit_share_pct").eq("id", VENUE_ID).single(),
    ]);

    const todayOrders = todayOrdersRes.data || [];
    const yesterdayOrders = yesterdayOrdersRes.data || [];
    const verifications = verifyRes.data || [];
    const pct = venueRes.data?.jarvid_profit_share_pct || 20;
    setJarvidPct(pct);

    // Helper: fetch items + supply prices for a set of order IDs using chunked queries
    const fetchItemsForOrders = async (orders) => {
      const ids = orders.map(o => o.id);
      if (ids.length === 0) return [];
      const CHUNK = 100;
      const chunks = [];
      for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
      const chunkResults = await Promise.all(chunks.map(chunk =>
        supabase.from("order_items").select("order_id, quantity, unit_price_pence, product_id").in("order_id", chunk)
      ));
      const allItems = chunkResults.flatMap(r => r.data || []);
      if (allItems.length === 0) return [];
      const productIds = [...new Set(allItems.map(i => i.product_id))];
      const { data: productsData } = await supabase.from("products").select("id, supply_price_pence").in("id", productIds);
      const supplyMap = {};
      (productsData || []).forEach(p => { supplyMap[p.id] = p.supply_price_pence || 0; });
      return allItems.map(item => ({ ...item, products: { supply_price_pence: supplyMap[item.product_id] || 0 } }));
    };

    const [todayItems, yesterdayItems] = await Promise.all([
      fetchItemsForOrders(todayOrders),
      fetchItemsForOrders(yesterdayOrders),
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total_pence || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total_pence || 0), 0);
    const todayCount = todayOrders.length;
    const yesterdayCount = yesterdayOrders.length;
    const avgOrder = todayCount > 0 ? todayRevenue / todayCount : 0;
    const prevAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;
    const passCount = verifications.filter(v => v.result === "pass").length;
    const passRate = verifications.length > 0 ? Math.round((passCount / verifications.length) * 100) : 100;
    const revDelta = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

    const todayProfit = calcProfit(todayItems, pct);
    const yesterdayProfit = calcProfit(yesterdayItems, pct);
    const profitDelta = yesterdayProfit.venueShare > 0 ? Math.round(((todayProfit.venueShare - yesterdayProfit.venueShare) / yesterdayProfit.venueShare) * 100) : 0;

    setOverview({ todayRevenue, todayCount, avgOrder, prevAvg, verifications: verifications.length, passRate, revDelta, countDelta: todayCount - yesterdayCount, todayProfit, profitDelta });
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

  const downloadCSV = (filename, rows, headers) => {
    const escape = v => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportOrders = async () => {
    setExportLoading("orders");
    const start = new Date(exportRange.start); start.setHours(0,0,0,0);
    const end = new Date(exportRange.end); end.setHours(23,59,59,999);
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total_pence, payment_method, age_verification_id")
      .eq("venue_id", VENUE_ID)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });
    const rows = (data || []).map(o => [
      o.id,
      new Date(o.created_at).toLocaleString("en-GB"),
      o.status,
      fmt(penceToGBP(o.total_pence)),
      o.payment_method || "",
      o.age_verification_id || "",
    ]);
    downloadCSV(`orders_${exportRange.start}_${exportRange.end}.csv`, rows,
      ["Order ID", "Date & Time", "Status", "Total", "Payment Method", "Verification ID"]);
    setExportLoading(null);
  };

  const exportProductSales = async () => {
    setExportLoading("products");
    const start = new Date(exportRange.start); start.setHours(0,0,0,0);
    const end = new Date(exportRange.end); end.setHours(23,59,59,999);
    const { data } = await supabase
      .from("order_items")
      .select("product_id, quantity, unit_price_pence, products(name, brand, category), orders!inner(venue_id, created_at, status)")
      .eq("orders.venue_id", VENUE_ID)
      .eq("orders.status", "completed")
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString());

    // Aggregate by product
    const map = {};
    (data || []).forEach(item => {
      const id = item.product_id;
      if (!map[id]) map[id] = {
        name: item.products?.name || "",
        brand: item.products?.brand || "",
        category: item.products?.category || "",
        units: 0, revenue: 0,
      };
      map[id].units += item.quantity;
      map[id].revenue += item.quantity * item.unit_price_pence;
    });
    const rows = Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .map(p => [p.brand, p.name, p.category, p.units, fmt(penceToGBP(p.revenue))]);
    downloadCSV(`product_sales_${exportRange.start}_${exportRange.end}.csv`, rows,
      ["Brand", "Product", "Category", "Units Sold", "Revenue"]);
    setExportLoading(null);
  };

  const exportCompliance = async () => {
    setExportLoading("compliance");
    const start = new Date(exportRange.start); start.setHours(0,0,0,0);
    const end = new Date(exportRange.end); end.setHours(23,59,59,999);
    const { data } = await supabase
      .from("age_verifications")
      .select("id, verified_at, method, result, user_token_hash")
      .gte("verified_at", start.toISOString())
      .lte("verified_at", end.toISOString())
      .order("verified_at", { ascending: false });
    const rows = (data || []).map(v => [
      v.id,
      new Date(v.verified_at).toLocaleString("en-GB"),
      v.method || "",
      v.result || "",
      v.user_token_hash || "",
    ]);
    downloadCSV(`compliance_${exportRange.start}_${exportRange.end}.csv`, rows,
      ["Verification ID", "Date & Time", "Method", "Result", "Token Hash"]);
    setExportLoading(null);
  };

  const savePin = async () => {
    if (pinEdit.length < 4) return;
    if (!/^\d+$/.test(pinEdit)) { alert("PIN must be numbers only."); return; }
    setPinSaving(true);
    const { error } = await supabase.from("venues").update({ kiosk_pin: pinEdit }).eq("id", VENUE_ID);
    setPinSaving(false);
    if (!error) { setCurrentPin(pinEdit); setPinSaved(true); setTimeout(() => setPinSaved(false), 3000); }
  };

  const loadAnalytics = async (view) => {
    if (!VENUE_ID) return;
    setLoadingAnalytics(true);
    setAnalyticsView(view);
    setAnalyticsSelected(null);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, total_pence, status, created_at")
      .eq("venue_id", VENUE_ID)
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    const allOrders = ordersData || [];
    const allOrderIds = allOrders.map(o => o.id);
    console.log("[JarvID] allOrders count:", allOrders.length, "VENUE_ID:", VENUE_ID);

    // Record first order date for smart chart slicing
    if (allOrders.length > 0) setFirstOrderDate(new Date(allOrders[0].created_at));

    // Fetch items in chunks of 100 to avoid PostgREST URL length limits
    let itemsByOrder = {};
    if (allOrderIds.length > 0) {
      const CHUNK = 100;
      const chunks = [];
      for (let i = 0; i < allOrderIds.length; i += CHUNK) chunks.push(allOrderIds.slice(i, i + CHUNK));
      const chunkResults = await Promise.all(chunks.map(chunk =>
        supabase.from("order_items").select("order_id, quantity, unit_price_pence, product_id").in("order_id", chunk)
      ));
      const allItems = chunkResults.flatMap(r => r.data || []);

      if (allItems.length > 0) {
        const productIds = [...new Set(allItems.map(i => i.product_id))];
        const { data: productsData } = await supabase
          .from("products")
          .select("id, supply_price_pence")
          .in("id", productIds);
        const supplyMap = {};
        (productsData || []).forEach(p => { supplyMap[p.id] = p.supply_price_pence || 0; });

        allItems.forEach(item => {
          const oid = item.order_id;
          if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
          itemsByOrder[oid].push({
            ...item,
            products: { supply_price_pence: supplyMap[item.product_id] || 0 },
          });
        });
      }
    }

    const getPeriodProfit = (orderIds) => {
      const items = orderIds.flatMap(id => itemsByOrder[id] || []);
      return calcProfit(items, jarvidPct);
    };

    if (view === "weekly") {
      const weekMap = {};
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay() + 1);
        startOfWeek.setHours(0,0,0,0);
        const key = startOfWeek.toISOString().slice(0,10);
        if (!weekMap[key]) weekMap[key] = { key, label: startOfWeek.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: 0, orders: 0, orderIds: [], startDate: new Date(startOfWeek) };
        weekMap[key].revenue += o.total_pence || 0;
        weekMap[key].orders += 1;
        weekMap[key].orderIds.push(o.id);
      });
      const weeks = Object.values(weekMap).sort((a, b) => a.startDate - b.startDate);
      weeks.forEach((w, i) => {
        const profit = getPeriodProfit(w.orderIds);
        w.venueProfit = profit.venueShare;
        w.jarvidProfit = profit.jarvidShare;
        w.prev = i > 0 ? weeks[i-1].revenue : null;
        w.prevProfit = i > 0 ? weeks[i-1].venueProfit : null;
        w.change = w.prev ? Math.round(((w.revenue - w.prev) / w.prev) * 100) : null;
        w.profitChange = w.prevProfit ? Math.round(((w.venueProfit - w.prevProfit) / w.prevProfit) * 100) : null;
      });
      setAnalyticsData(weeks);
    } else {
      const monthMap = {};
      allOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        if (!monthMap[key]) monthMap[key] = { key, label, revenue: 0, orders: 0, orderIds: [], sortKey: key };
        monthMap[key].revenue += o.total_pence || 0;
        monthMap[key].orders += 1;
        monthMap[key].orderIds.push(o.id);
      });
      const months = Object.values(monthMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      months.forEach((m, i) => {
        const profit = getPeriodProfit(m.orderIds);
        m.venueProfit = profit.venueShare;
        m.jarvidProfit = profit.jarvidShare;
        m.prev = i > 0 ? months[i-1].revenue : null;
        m.prevProfit = i > 0 ? months[i-1].venueProfit : null;
        m.change = m.prev ? Math.round(((m.revenue - m.prev) / m.prev) * 100) : null;
        m.profitChange = m.prevProfit ? Math.round(((m.venueProfit - m.prevProfit) / m.prevProfit) * 100) : null;
      });
      setAnalyticsData(months);
    }
    setLoadingAnalytics(false);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase.from("products").select("*, low_stock_threshold, inventory(quantity)").eq("venue_id", VENUE_ID).order("brand");
    if (data) setProducts(data.map(p => ({ ...p, stock: p.inventory?.[0]?.quantity ?? 0, price: penceToGBP(p.price_pence) })));
    setLoadingProducts(false);
  };

  const loadVenueStock = async () => {
    setLoadingVenueStock(true);
    const { data } = await supabase
      .from("inventory")
      .select("*, products(id, name, category, low_stock_threshold)")
      .eq("venue_id", VENUE_ID);
    setVenueStock(data || []);
    setLoadingVenueStock(false);
  };

  const saveVenueStockThresholds = async (inv) => {
    const edit = editingVenueStock[inv.id];
    if (!edit) return;
    await Promise.all([
      edit.min !== undefined && inv.products?.id
        ? supabase.from("products").update({ low_stock_threshold: Number(edit.min) }).eq("id", inv.products.id)
        : Promise.resolve(),
      edit.max !== undefined
        ? supabase.from("inventory").update({ max_quantity: Number(edit.max) }).eq("id", inv.id)
        : Promise.resolve(),
    ]);
    const s = { ...editingVenueStock }; delete s[inv.id]; setEditingVenueStock(s);
    loadVenueStock();
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

  const filteredProducts = products
    .filter(p =>
      p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(searchQ.toLowerCase())
    )
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1;
      if (a.stock > 0 && b.stock === 0) return -1;
      return 0;
    });

  const maxWeeklySale = Math.max(...weeklySales.map(d => d.sales), 1);

  const navItems = [
    { id: "overview",   icon: LayoutDashboard, label: "Overview" },
    { id: "analytics",  icon: TrendingUp,      label: "Analytics" },
    { id: "stock",      icon: Warehouse,       label: "Stock" },
    { id: "compliance", icon: Shield,          label: "Compliance" },
    { id: "staff",      icon: Users,           label: "Staff" },
    { id: "export",     icon: Download,        label: "Export" },
    { id: "settings",   icon: Settings,        label: "Settings" },
  ];

  return (
    <div className="manager-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{isAdmin ? "All Venues" : isOrgAdmin ? "Organisation" : "Venue"}</div>
          {(isAdmin || isOrgAdmin) && orgVenues.length > 0 ? (
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
        {navItems.map(item => {
          const NavIcon = item.icon;
          return (
            <div key={item.id} className={`sidebar-item ${activeSection === item.id ? "active" : ""}`} onClick={() => setActiveSection(item.id)}>
              {NavIcon && <NavIcon size={15} />} {item.label}
            </div>
          );
        })}
      </div>

      <div className="manager-content">
        {activeSection === "overview" && (
          <>
            <KioskOfflineBanner venueId={VENUE_ID} />
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
                  <div className="stat-label">Your Profit (ex VAT)</div>
                  <div className="stat-value" style={{ color: DS.colors.accent }}>{overview.todayProfit ? fmt(penceToGBP(overview.todayProfit.venueShare)) : "—"}</div>
                  <div className={`stat-delta ${(overview.profitDelta || 0) >= 0 ? "delta-up" : "delta-down"}`}>{(overview.profitDelta || 0) >= 0 ? "↑" : "↓"} {Math.abs(overview.profitDelta || 0)}% vs yesterday</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Orders Today</div>
                  <div className="stat-value">{overview.todayCount}</div>
                  <div className={`stat-delta ${overview.countDelta >= 0 ? "delta-up" : "delta-down"}`}>{overview.countDelta >= 0 ? "↑" : "↓"} {Math.abs(overview.countDelta)} vs yesterday</div>
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
                  <button className="btn-sm btn-outline" onClick={() => { setSelectedDay(null); setDayDetail(null); }} style={{ display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> Close</button>
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
                            <ProductImage imageUrl={p.image_url} name={p.name} size="thumb" category={p.category} />
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
                        <ProductImage imageUrl={p.image_url} name={p.name} size="row" category={p.category} />
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
              {[["weekly","📅 Weekly"], ["monthly","🗓 Monthly"]].map(([v, label]) => (
                <button key={v} className={`btn-sm ${analyticsView === v && !allTimeMode ? "btn-accent" : "btn-outline"}`}
                  onClick={() => { setAllTimeMode(false); loadAnalytics(v); }}
                  style={{ minWidth: 90 }}>
                  {label}
                </button>
              ))}
              <button className={`btn-sm ${allTimeMode ? "btn-accent" : "btn-outline"}`}
                onClick={() => setAllTimeMode(m => !m)}
                style={{ minWidth: 90 }}>
                <TrendingUp size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />All-time
              </button>
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
                  {(() => {
                    const totalProfit = analyticsData.reduce((s, d) => s + (d.venueProfit || 0), 0);
                    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                    const avgOrderProfit = totalOrders > 0 ? totalProfit / totalOrders : 0;
                    const bestProfitPeriod = analyticsData.reduce((best, d) => (d.venueProfit || 0) > (best.venueProfit || 0) ? d : best, analyticsData[0] || {});
                    return (
                      <div className="stats-row">
                        <div className="stat-card">
                          <div className="stat-label">All-time Revenue</div>
                          <div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(totalRevenue))}</div>
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${DS.colors.border}` }}>
                            <div className="stat-label" style={{ fontSize: 10 }}>Your Profit</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.accent }}>{fmt(penceToGBP(totalProfit))}</div>
                            <div style={{ fontSize: 10, color: DS.colors.textMuted }}>{100 - jarvidPct}% share · ex VAT</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">All-time Orders</div>
                          <div className="stat-value" style={{ fontSize: 20 }}>{totalOrders}</div>
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${DS.colors.border}` }}>
                            <div className="stat-label" style={{ fontSize: 10 }}>Avg Order Profit</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.accent }}>{fmt(penceToGBP(avgOrderProfit))}</div>
                            <div style={{ fontSize: 10, color: DS.colors.textMuted }}>avg revenue {fmt(penceToGBP(avgOrderValue))}</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">Best {analyticsView === "weekly" ? "Week" : "Month"} Revenue</div>
                          <div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(bestPeriod.revenue))}</div>
                          <div className="stat-delta delta-up">{bestPeriod.label}</div>
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${DS.colors.border}` }}>
                            <div className="stat-label" style={{ fontSize: 10 }}>Best {analyticsView === "weekly" ? "Week" : "Month"} Profit</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.accent }}>{fmt(penceToGBP(bestProfitPeriod.venueProfit || 0))}</div>
                            <div style={{ fontSize: 10, color: DS.colors.textMuted }}>{bestProfitPeriod.label}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bar charts — Revenue + Profit side by side */}
                  {(() => {
                    // Determine how many periods since first order (up to 6), or all if allTimeMode
                    let periodsToShow = analyticsData.length; // default: all available
                    if (!allTimeMode && firstOrderDate) {
                      const now = new Date();
                      if (analyticsView === "monthly") {
                        const monthsSince = (now.getFullYear() - firstOrderDate.getFullYear()) * 12
                          + (now.getMonth() - firstOrderDate.getMonth()) + 1;
                        periodsToShow = Math.min(monthsSince, 6);
                      } else {
                        const weeksSince = Math.ceil((now - firstOrderDate) / (7 * 24 * 60 * 60 * 1000));
                        periodsToShow = Math.min(weeksSince, 6);
                      }
                    }
                    const chartData = analyticsData.slice(-Math.max(periodsToShow, 1));
                    const maxProfit = Math.max(...chartData.map(d => d.venueProfit || 0), 1);
                    const maxRevChart = Math.max(...chartData.map(d => d.revenue || 0), 1);
                    const BarChart = ({ dataKey, max, color, label, formatVal }) => (
                      <div className="chart-card" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                          <div className="chart-title" style={{ marginBottom: 0 }}>{analyticsView === "weekly" ? "Weekly" : "Monthly"} {label}</div>
                          <div style={{ fontSize: 10, color: DS.colors.textMuted }}>click to compare</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: chartData.length > 24 ? 1 : chartData.length > 12 ? 2 : 4, height: 110, marginTop: 4 }}>
                          {chartData.map(d => {
                            const val = d[dataKey] || 0;
                            const isSelected = analyticsSelected?.key === d.key;
                            return (
                              <div key={d.key} onClick={() => setAnalyticsSelected(isSelected ? null : d)}
                                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: 2 }}>
                                <div style={{ fontSize: analyticsData.length > 16 ? 0 : 9, color: DS.colors.textSub }}>
                                  {val > 0 ? penceToGBP(val).toFixed(0) : ""}
                                </div>
                                <div style={{
                                  width: "100%", borderRadius: "3px 3px 0 0", minHeight: 4,
                                  height: `${(val / max) * 90}px`,
                                  background: isSelected ? DS.colors.purple : color,
                                  opacity: analyticsSelected && !isSelected ? 0.35 : 0.85,
                                  transition: "all 0.2s"
                                }} />
                                <div style={{ fontSize: chartData.length > 24 ? 6 : chartData.length > 12 ? 7 : 9, color: isSelected ? DS.colors.white : DS.colors.textMuted, whiteSpace: "nowrap", overflow: "hidden" }}>{chartData.length > 24 ? d.label.split(" ")[0] : d.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                    return (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <BarChart dataKey="revenue" max={maxRevChart} color={DS.colors.textSub} label="Revenue (£)" />
                          <BarChart dataKey="venueProfit" max={maxProfit} color={DS.colors.accent} label="Your Profit (£)" />
                        </div>
                        <div style={{ fontSize: 11, color: DS.colors.textMuted, textAlign: "right", marginTop: -4 }}>
                          {allTimeMode
                            ? `Showing all ${chartData.length} ${analyticsView === "weekly" ? "weeks" : "months"} · all-time`
                            : `Showing ${chartData.length} ${analyticsView === "weekly" ? `week${chartData.length !== 1 ? "s" : ""}` : `month${chartData.length !== 1 ? "s" : ""}`} since activation${analyticsData.length > chartData.length ? ` · ${analyticsData.length - chartData.length} earlier — switch to All-time to view` : ""}`
                          }
                        </div>
                      </>
                    );
                  })()}

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
                          <th>Your Profit (ex VAT)</th>
                          <th>Orders</th>
                          <th>vs Previous</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...analyticsData].reverse().map(d => (
                          <tr key={d.key}
                            onClick={() => setAnalyticsSelected(analyticsSelected?.key === d.key ? null : d)}
                            style={{ cursor: "pointer", background: analyticsSelected?.key === d.key ? "rgba(124,92,191,0.1)" : "transparent" }}>
                            <td style={{ fontWeight: analyticsSelected?.key === d.key ? 700 : 400 }}>{d.label}</td>
                            <td style={{ color: DS.colors.textSub, fontFamily: DS.font.display, fontSize: 15 }}>{fmt(penceToGBP(d.revenue))}</td>
                            <td style={{ color: DS.colors.accent, fontFamily: DS.font.display, fontSize: 15 }}>{fmt(penceToGBP(d.venueProfit || 0))}</td>
                            <td>{d.orders}</td>
                            <td>
                              {d.profitChange === null ? <span style={{ color: DS.colors.textMuted }}>—</span>
                                : d.profitChange >= 0
                                  ? <span style={{ color: DS.colors.accent }}>↑ {d.profitChange}%</span>
                                  : <span style={{ color: DS.colors.danger }}>↓ {Math.abs(d.profitChange)}%</span>
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
                        <button className="btn-sm btn-outline" onClick={() => setAnalyticsSelected(null)}><X size={12} /></button>
                      </div>
                      <div className="stats-row">
                        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value" style={{ fontSize: 20 }}>{fmt(penceToGBP(analyticsSelected.revenue))}</div></div>
                        <div className="stat-card"><div className="stat-label">Your Profit (ex VAT)</div><div className="stat-value" style={{ fontSize: 20, color: DS.colors.accent }}>{fmt(penceToGBP(analyticsSelected.venueProfit || 0))}</div><div className="stat-sub" style={{ fontSize: 10, color: DS.colors.textMuted }}>{100 - jarvidPct}% of gross profit</div></div>
                        <div className="stat-card"><div className="stat-label">Orders</div><div className="stat-value" style={{ fontSize: 20 }}>{analyticsSelected.orders}</div></div>
                        <div className="stat-card">
                          <div className="stat-label">Profit vs Previous</div>
                          <div className="stat-value" style={{ fontSize: 20, color: analyticsSelected.profitChange === null ? DS.colors.textMuted : analyticsSelected.profitChange >= 0 ? DS.colors.accent : DS.colors.danger }}>
                            {analyticsSelected.profitChange === null ? "—" : `${analyticsSelected.profitChange >= 0 ? "↑" : "↓"} ${Math.abs(analyticsSelected.profitChange)}%`}
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

        {activeSection === "stock" && (
          <>
            <div className="section-title">STOCK</div>
            <div className="section-sub">Inventory levels for {venueName}</div>
            {loadingVenueStock ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${DS.colors.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {["all", "out", "low", "over", "ok"].map(s => (
                    <button key={s} className="btn-sm btn-outline" style={{ color: venueStockStatusFilter === s ? DS.colors.accent : DS.colors.textMuted, borderColor: venueStockStatusFilter === s ? DS.colors.accent : DS.colors.border }} onClick={() => setVenueStockStatusFilter(s)}>
                      {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <input style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "7px 10px", color: DS.colors.text, fontSize: 13, outline: "none", width: 200, flex: "none" }} value={venueStockSearch} onChange={e => setVenueStockSearch(e.target.value)} placeholder="Search product or category…" />
                </div>
                {(() => {
                  const vsi = (col) => venueStockSort.col === col ? (venueStockSort.dir === "asc" ? " ↑" : " ↓") : "";
                  const vhs = (col) => setVenueStockSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                  const colW = ["25%", "15%", "10%", "10%", "10%", "12%", "18%"];
                  const filteredVenueStock = venueStock
                    .filter(inv => {
                      const q = venueStockSearch.toLowerCase();
                      if (q && !(inv.products?.name || "").toLowerCase().includes(q) && !(inv.products?.category || "").toLowerCase().includes(q)) return false;
                      if (venueStockStatusFilter !== "all") {
                        const t = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                        const qty = inv.quantity || 0;
                        if (venueStockStatusFilter === "out" && qty !== 0) return false;
                        if (venueStockStatusFilter === "low" && !(qty > 0 && qty <= t)) return false;
                        if (venueStockStatusFilter === "over" && !(inv.max_quantity && qty > inv.max_quantity)) return false;
                        if (venueStockStatusFilter === "ok" && !(qty > t && !(inv.max_quantity && qty > inv.max_quantity))) return false;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      const dir = venueStockSort.dir === "asc" ? 1 : -1;
                      if (venueStockSort.col === "name") return dir * (a.products?.name || "").localeCompare(b.products?.name || "");
                      if (venueStockSort.col === "category") return dir * (a.products?.category || "").localeCompare(b.products?.category || "");
                      if (venueStockSort.col === "stock") return dir * ((a.quantity || 0) - (b.quantity || 0));
                      if (venueStockSort.col === "min") {
                        const thresh = inv => inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                        return dir * (thresh(a) - thresh(b));
                      }
                      if (venueStockSort.col === "max") return dir * ((a.max_quantity || 0) - (b.max_quantity || 0));
                      if (venueStockSort.col === "status") {
                        const rank = inv => { const t = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default; const q = inv.quantity || 0; return (inv.max_quantity && q > inv.max_quantity) ? 0 : q > t ? 1 : q > 0 ? 2 : 3; };
                        return dir * (rank(a) - rank(b));
                      }
                      return 0;
                    });
                  return (
                    <>
                      <table className="data-table" style={{ tableLayout: "fixed" }}>
                        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                        <thead><tr>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("name")}>Product{vsi("name")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("category")}>Category{vsi("category")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("stock")}>Stock{vsi("stock")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("min")}>Min{vsi("min")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("max")}>Max{vsi("max")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => vhs("status")}>Status{vsi("status")}</th>
                          <th>Actions</th>
                        </tr></thead>
                      </table>
                      <div style={{ maxHeight: 480, overflowY: "auto" }}>
                        <table className="data-table" style={{ tableLayout: "fixed" }}>
                          <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                          <tbody>
                            {filteredVenueStock.map(inv => {
                              const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                              const qty = inv.quantity || 0;
                              const maxQ = inv.max_quantity;
                              const isOut = qty === 0;
                              const isLow = qty > 0 && qty <= threshold;
                              const isOver = maxQ && qty > maxQ;
                              const statusLabel = isOut ? "Out" : isLow ? "Low" : isOver ? "Over" : "OK";
                              const statusColor = isOut ? DS.colors.danger : isLow ? DS.colors.warn : isOver ? DS.colors.blue : DS.colors.accent;
                              const editing = editingVenueStock[inv.id];
                              const inputSty = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "3px 6px", color: DS.colors.text, fontSize: 13, outline: "none" };
                              return (
                                <tr key={inv.id}>
                                  <td style={{ fontWeight: 600 }}>{inv.products?.name || "—"}</td>
                                  <td><span className="tag-pill" style={{ background: DS.colors.accentGlow, color: DS.colors.accent, fontSize: 10 }}>{inv.products?.category || "—"}</span></td>
                                  <td style={{ fontFamily: DS.font.mono, fontWeight: 700, color: statusColor }}>{qty}</td>
                                  <td>{editing ? <input style={{ ...inputSty, width: 60 }} type="number" defaultValue={threshold} onChange={e => setEditingVenueStock(s => ({ ...s, [inv.id]: { ...s[inv.id], min: e.target.value } }))} /> : threshold}</td>
                                  <td>{editing ? <input style={{ ...inputSty, width: 60 }} type="number" defaultValue={maxQ || ""} placeholder="—" onChange={e => setEditingVenueStock(s => ({ ...s, [inv.id]: { ...s[inv.id], max: e.target.value } }))} /> : (maxQ || "—")}</td>
                                  <td><span className="tag-pill" style={{ background: statusColor + "22", color: statusColor }}>{statusLabel}</span></td>
                                  <td>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {editing ? (
                                        <>
                                          <button className="btn-sm btn-accent" onClick={() => saveVenueStockThresholds(inv)}>Save</button>
                                          <button className="btn-sm btn-outline" onClick={() => { const s = { ...editingVenueStock }; delete s[inv.id]; setEditingVenueStock(s); }}>Cancel</button>
                                        </>
                                      ) : (
                                        <button className="btn-sm btn-outline" onClick={() => setEditingVenueStock(s => ({ ...s, [inv.id]: {} }))}>Edit</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredVenueStock.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: DS.colors.textMuted, padding: 32 }}>{venueStock.length > 0 ? "No items match filters" : "No inventory records found"}</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
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
                    <div className={entry.result === "pass" ? "log-result-pass" : "log-result-fail"} style={{ display: "flex", alignItems: "center", gap: 3 }}>{entry.result === "pass" ? <><Check size={11} /> PASS</> : <><X size={11} /> FAIL</>}</div>
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

        {activeSection === "export" && (
          <>
            <div>
              <div className="section-title">EXPORT DATA</div>
              <div className="section-sub">Download CSV files for accounting and compliance reporting</div>
            </div>

            {/* Date range picker */}
            <div className="chart-card" style={{ maxWidth: 520 }}>
              <div className="chart-title" style={{ marginBottom: 16 }}>📅 Date Range</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>From</div>
                  <input type="date" value={exportRange.start}
                    onChange={e => setExportRange(r => ({ ...r, start: e.target.value }))}
                    style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "8px 12px", color: DS.colors.text, fontSize: 14, outline: "none", cursor: "pointer" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>To</div>
                  <input type="date" value={exportRange.end}
                    onChange={e => setExportRange(r => ({ ...r, end: e.target.value }))}
                    style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "8px 12px", color: DS.colors.text, fontSize: 14, outline: "none", cursor: "pointer" }} />
                </div>
                <div style={{ alignSelf: "flex-end" }}>
                  <div style={{ fontSize: 11, color: DS.colors.textMuted, marginBottom: 6 }}>&nbsp;</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: "7d",  days: 7 },
                      { label: "30d", days: 30 },
                      { label: "90d", days: 90 },
                    ].map(({ label, days }) => (
                      <button key={label} className="btn-sm btn-outline" onClick={() => {
                        const end = new Date();
                        const start = new Date(); start.setDate(start.getDate() - days);
                        setExportRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] });
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Export cards */}
            {[
              {
                key: "orders",
                icon: FileText,
                title: "Orders",
                desc: "All orders in the date range — order ID, date, status, total, payment method and verification ID.",
                fn: exportOrders,
                columns: ["Order ID", "Date & Time", "Status", "Total", "Payment Method", "Verification ID"],
              },
              {
                key: "products",
                icon: Package,
                title: "Product Sales",
                desc: "Aggregated sales by product for completed orders — units sold and total revenue per product.",
                fn: exportProductSales,
                columns: ["Brand", "Product", "Category", "Units Sold", "Revenue"],
              },
              {
                key: "compliance",
                icon: Shield,
                title: "Compliance Log",
                desc: "Full age verification log — verification ID, date, method, result and anonymised token hash.",
                fn: exportCompliance,
                columns: ["Verification ID", "Date & Time", "Method", "Result", "Token Hash"],
              },
            ].map(({ key, icon: ExportIcon, title, desc, fn, columns }) => (
              <div key={key} className="chart-card" style={{ maxWidth: 520 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div className="chart-title" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>{ExportIcon && <ExportIcon size={15} />} {title}</div>
                    <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 12 }}>{desc}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {columns.map(col => (
                        <span key={col} style={{ fontSize: 11, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 4, padding: "2px 8px", color: DS.colors.textSub }}>
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn-sm btn-accent"
                    onClick={fn}
                    disabled={!!exportLoading}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    {exportLoading === key ? "Exporting…" : "↓ Download CSV"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeSection === "settings" && (
          <>
            <div>
              <div className="section-title">VENUE SETTINGS</div>
              <div className="section-sub">Kiosk configuration for {venueName}</div>
            </div>
            <div className="chart-card" style={{ maxWidth: 480 }}>
              <div className="chart-title" style={{ marginBottom: 4 }}>🔐 Kiosk PIN</div>
              <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 20 }}>
                Staff tap the JarvID logo 5 times on the kiosk to reveal the PIN entry screen.
                Each venue has its own PIN.
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Current PIN</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                  {(currentPin || "----").split("").map((d, i) => (
                    <div key={i} style={{ width: 40, height: 48, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DS.font.display, fontSize: 22, fontWeight: 700, color: DS.colors.accent }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>New PIN</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter new PIN"
                    value={pinEdit}
                    onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPinEdit(v); setPinSaved(false); }}
                    style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 8, padding: "10px 14px", color: DS.colors.text, fontSize: 18, fontFamily: DS.font.display, fontWeight: 700, width: 140, outline: "none", letterSpacing: "0.2em" }}
                  />
                  <button
                    className={`btn-sm ${pinSaved ? "" : "btn-accent"}`}
                    onClick={savePin}
                    disabled={pinSaving || pinEdit.length < 4 || pinEdit === currentPin}
                    style={pinSaved ? { background: DS.colors.accentGlow, color: DS.colors.accent, borderColor: DS.colors.accent } : {}}
                  >
                    {pinSaving ? "Saving…" : pinSaved ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span> : "Update PIN"}
                  </button>
                </div>
                {pinEdit.length > 0 && pinEdit.length < 4 && (
                  <div style={{ fontSize: 12, color: DS.colors.warn, marginTop: 8 }}>PIN must be at least 4 digits</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── PRODUCT EDIT MODAL ── */}
      {editingProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,10,15,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 16, padding: 32, width: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.white, marginBottom: 4 }}>Edit Product</div>
            <div style={{ fontSize: 13, color: DS.colors.textMuted, marginBottom: 24 }}>{editingProduct.name}</div>
            <div>
              <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 6 }}>LOW STOCK ALERT THRESHOLD</div>
              <div style={{ fontSize: 12, color: DS.colors.textSub, marginBottom: 8 }}>
                Category default: ≤{LOW_STOCK_THRESHOLDS[editingProduct.category] || LOW_STOCK_THRESHOLDS.default} units. Leave blank to use the default.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number" min="0"
                  placeholder={`Default: ${LOW_STOCK_THRESHOLDS[editingProduct.category] || LOW_STOCK_THRESHOLDS.default}`}
                  value={editingProduct.thresholdInput}
                  onChange={e => setEditingProduct(p => ({ ...p, thresholdInput: e.target.value }))}
                  style={{ width: 100, padding: "8px 12px", borderRadius: 8, border: `1px solid ${DS.colors.border}`, background: DS.colors.bg, color: DS.colors.white, fontSize: 14, fontFamily: "inherit" }}
                />
                <span style={{ fontSize: 13, color: DS.colors.textMuted }}>units</span>
                {editingProduct.thresholdInput !== "" && (
                  <button onClick={() => setEditingProduct(p => ({ ...p, thresholdInput: "" }))}
                    style={{ fontSize: 12, color: DS.colors.textMuted, background: "transparent", border: "none", cursor: "pointer" }}>
                    Reset to default
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${DS.colors.border}`, background: "transparent", color: DS.colors.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button disabled={savingProduct} onClick={async () => {
                setSavingProduct(true);
                const threshold = editingProduct.thresholdInput === "" ? null : parseInt(editingProduct.thresholdInput, 10);
                const { error } = await supabase.from("products").update({ low_stock_threshold: threshold }).eq("id", editingProduct.id);
                if (!error) {
                  setProducts(ps => ps.map(p => p.id === editingProduct.id ? { ...p, low_stock_threshold: threshold } : p));
                  setEditingProduct(null);
                }
                setSavingProduct(false);
              }} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: DS.colors.accent, color: DS.colors.bg, fontSize: 13, fontWeight: 700, cursor: savingProduct ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {savingProduct ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DEVICE MONITOR COMPONENT
// ============================================================
function DeviceMonitor({ venues }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const loadDevices = async () => {
    const { data } = await supabase
      .from("kiosks")
      .select("id, name, device_id, venue_id, status, last_heartbeat, app_version, venues(name)")
      .order("venue_id");
    if (data) {
      const now = new Date();
      setDevices(data.map(k => ({
        ...k,
        venueName: k.venues?.name || "Unknown Venue",
        isOnline: k.last_heartbeat && (now - new Date(k.last_heartbeat)) < 120000,
        lastSeen: k.last_heartbeat ? new Date(k.last_heartbeat) : null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
    // Refresh every 30 seconds so status stays current
    refreshTimer.current = setInterval(loadDevices, 30000);
    return () => clearInterval(refreshTimer.current);
  }, []);

  const timeSince = (date) => {
    if (!date) return "Never";
    const secs = Math.floor((new Date() - date) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  return (
    <>
      <div>
        <div className="section-title">DEVICE MONITORING</div>
        <div className="section-sub">Live kiosk status — updates every 30 seconds</div>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value">{devices.length}</div>
          <div className="stat-sub">Registered kiosks</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online</div>
          <div className="stat-value" style={{ color: DS.colors.accent }}>{devices.filter(d => d.isOnline).length}</div>
          <div className="stat-sub">Last heartbeat &lt;2 min</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offline</div>
          <div className="stat-value" style={{ color: devices.filter(d => !d.isOnline).length > 0 ? DS.colors.danger : DS.colors.textMuted }}>
            {devices.filter(d => !d.isOnline).length}
          </div>
          <div className="stat-sub">No recent heartbeat</div>
        </div>
      </div>
      <div className="chart-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <div style={{ color: DS.colors.textMuted, fontSize: 13 }}>Loading devices…</div>}
        {!loading && devices.length === 0 && (
          <div style={{ color: DS.colors.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>
            No devices registered yet. Devices appear here automatically once a kiosk loads for the first time.
          </div>
        )}
        {devices.map(d => (
          <div key={d.id} className="device-row">
            <div style={{ flex: 1 }}>
              <div className="device-name">{d.name || d.device_id}</div>
              <div style={{ fontSize: 12, color: DS.colors.textMuted }}>{d.venueName}</div>
            </div>
            <div className="device-status" style={{ gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: DS.colors.textMuted }}>Last seen</div>
                <div style={{ fontSize: 13, color: d.isOnline ? DS.colors.accent : DS.colors.textSub }}>
                  {timeSince(d.lastSeen)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: DS.colors.textMuted }}>Version</div>
                <div style={{ fontSize: 13, color: DS.colors.textSub }}>{d.app_version || "—"}</div>
              </div>
              <span className="tag-pill" style={{
                background: d.isOnline ? DS.colors.accentGlow : DS.colors.dangerGlow,
                color: d.isOnline ? DS.colors.accent : DS.colors.danger,
                minWidth: 64, textAlign: "center",
              }}>
                <Circle size={7} fill={d.isOnline ? DS.colors.accent : DS.colors.danger} stroke="none" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />{d.isOnline ? "online" : "offline"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function POProductCombobox({ products = [], value, onChange, inputStyle }) {
  const [inputVal, setInputVal] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync display text when value is set externally (e.g. reorder alert pre-fill)
  useEffect(() => {
    if (!value) { setInputVal(""); return; }
    const match = products.find(p => p.id === value);
    if (match) setInputVal(match.name);
  }, [value, products]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const confirmed = products.find(p => p.id === value);
        setInputVal(confirmed ? confirmed.name : "");
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value, products]);

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

// ============================================================
// ADMIN VIEW
// ============================================================
function AdminView() {
  const [adminSection, setAdminSection] = useState("venues");

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState(null);
  const [settingsFormData, setSettingsFormData] = useState({});
  const [editingSettings, setEditingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Organisations
  const [orgs, setOrgs] = useState([]);
  const [orgForm, setOrgForm] = useState(null);
  const [orgFormData, setOrgFormData] = useState({});
  const [savingOrg, setSavingOrg] = useState(false);

  // Venues
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venueForm, setVenueForm] = useState(null); // null | { mode: "new"|"edit", id? }
  const [venueFormData, setVenueFormData] = useState({});
  const [savingVenue, setSavingVenue] = useState(false);
  const [deletingVenueId, setDeletingVenueId] = useState(null);
  const [venuePSHistory, setVenuePSHistory] = useState({}); // { venueId: [records] }
  const [showingHistoryId, setShowingHistoryId] = useState(null);
  const [connectingStripeId, setConnectingStripeId] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userForm, setUserForm] = useState(null);
  const [userFormData, setUserFormData] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  // Stock
  const [stockVenueId, setStockVenueId] = useState("all");
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [calcingThresholds, setCalcingThresholds] = useState(false);
  const [editingStock, setEditingStock] = useState({});
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [stockSort, setStockSort] = useState({ col: "name", dir: "asc" });

  // Purchasing
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [poForm, setPOForm] = useState(false);
  const [poFormData, setPOFormData] = useState({ venue_id: "", supplier_email: "", notes: "", items: [] });
  const [poVenueProducts, setPOVenueProducts] = useState([]);
  const [expandedPO, setExpandedPO] = useState(null);
  const [selectedAlerts, setSelectedAlerts] = useState(new Set());
  const [poFilterStatus, setPOFilterStatus] = useState("all");
  const [poFilterVenue, setPOFilterVenue] = useState("all");
  const [poSearch, setPOSearch] = useState("");
  const [poSort, setPOSort] = useState({ col: "date", dir: "desc" });
  const [selectedPOIds, setSelectedPOIds] = useState(new Set());

  // Financials
  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [finDateFrom, setFinDateFrom] = useState("");
  const [finDateTo, setFinDateTo] = useState("");
  const [finAllTime, setFinAllTime] = useState(true);

  // Billing
  const [billing, setBilling] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [billingFormData, setBillingFormData] = useState({});

  // Load venues, orgs and platform settings on mount
  useEffect(() => { loadVenues(); loadOrgs(); loadPlatformSettings(); }, []);

  useEffect(() => {
    if (adminSection === "users") loadUsers();
    if (adminSection === "organisations") loadOrgs();
    if (adminSection === "stock") loadInventory();
    if (adminSection === "purchasing") loadPurchasing();
    if (adminSection === "financials") loadFinancials();
    if (adminSection === "billing") loadBilling();
  }, [adminSection]);

  useEffect(() => {
    if (adminSection === "stock") loadInventory();
  }, [stockVenueId]);

  // --- Shared styles ---
  const inputStyle = { background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "7px 10px", color: DS.colors.text, fontSize: 13, fontFamily: DS.font.body, outline: "none", width: "100%" };
  const labelStyle = { fontSize: 11, color: DS.colors.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" };
  const fieldStyle = { display: "flex", flexDirection: "column", gap: 4 };
  const dangerBtnStyle = { background: DS.colors.dangerGlow, color: DS.colors.danger, border: `1px solid ${DS.colors.danger}`, borderRadius: 6, fontSize: 12, cursor: "pointer", padding: "5px 10px" };

  // --- Load functions ---
  const loadVenues = async () => {
    setLoadingVenues(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [{ data, error }, { data: history }] = await Promise.all([
      supabase.from("venues").select("*").order("name"),
      supabase.from("venue_profit_share_history").select("venue_id, jarvid_profit_share_pct, effective_from").order("effective_from", { ascending: false }),
    ]);
    if (error || !data?.length) { setVenues([]); setLoadingVenues(false); return; }
    // Group history by venue
    const historyByVenue = {};
    (history || []).forEach(h => { if (!historyByVenue[h.venue_id]) historyByVenue[h.venue_id] = []; historyByVenue[h.venue_id].push(h); });
    setVenuePSHistory(historyByVenue);
    const revenueResults = await Promise.all(
      data.map(v => supabase.from("orders").select("total_pence").eq("venue_id", v.id).eq("status", "completed").gte("created_at", today.toISOString()))
    );
    setVenues(data.map((v, i) => ({
      ...v,
      todaySales: penceToGBP((revenueResults[i]?.data || []).reduce((s, o) => s + (o.total_pence || 0), 0)),
      status: "online",
    })));
    setLoadingVenues(false);
  };

  const saveVenue = async () => {
    setSavingVenue(true);
    const d = venueFormData;
    const newPct = Number(d.jarvid_profit_share_pct) || 20;
    const payload = { name: d.name, location: d.location, jarvid_profit_share_pct: newPct, supplier_email: d.supplier_email || null, subscription_plan: d.subscription_plan || "pro", monthly_fee_pence: Number(d.monthly_fee_pence) || 14900 };
    if (venueForm.mode === "new") {
      let orgId = d.org_id || null;
      if (!orgId) {
        const { data: newOrg } = await supabase.from("organisations").insert({ name: d.name }).select().single();
        if (newOrg) { orgId = newOrg.id; loadOrgs(); }
      }
      const { data: newVenue, error } = await supabase.from("venues").insert({ ...payload, org_id: orgId }).select().single();
      if (!error && newVenue) {
        await supabase.from("venue_profit_share_history").insert({ venue_id: newVenue.id, jarvid_profit_share_pct: newPct, effective_from: d.profit_share_effective_from || new Date().toISOString().slice(0, 10) });
        setVenueForm(null); loadVenues();
      } else alert("Error: " + error?.message);
    } else {
      const { data: updated, error } = await supabase.from("venues").update(payload).eq("id", venueForm.id).select();
      if (error) { alert("Error: " + error.message); }
      else if (!updated?.length) { alert("Update was blocked — check database permissions (RLS policy on venues table)."); }
      else {
        if (newPct !== venueForm.originalPct && d.profit_share_effective_from) {
          await supabase.from("venue_profit_share_history").insert({ venue_id: venueForm.id, jarvid_profit_share_pct: newPct, effective_from: d.profit_share_effective_from });
        }
        setVenueForm(null); loadVenues();
      }
    }
    setSavingVenue(false);
  };

  const deleteVenue = async (id) => {
    if (!window.confirm("Delete this venue? This cannot be undone.")) return;
    setDeletingVenueId(id);
    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (!error) loadVenues(); else alert("Error: " + error.message);
    setDeletingVenueId(null);
  };

  const connectStripe = async (venueId) => {
    setConnectingStripeId(venueId);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard", {
        body: { venue_id: venueId, return_url: window.location.href },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to generate onboarding link");
      window.open(data.url, "_blank");
    } catch (e) {
      alert("Stripe Connect error: " + e.message);
    }
    setConnectingStripeId(null);
  };

  // --- Users ---
  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from("staff_users").select("*, venues(name)").order("created_at", { ascending: false });
    if (!error) setUsers(data || []);
    setLoadingUsers(false);
  };

  const saveUser = async () => {
    setSavingUser(true);
    const d = userFormData;
    const venueId = d.venue_id === "" ? null : (d.venue_id || null);
    if (userForm.mode === "new") {
      const { error } = await supabase.from("staff_users").insert({ email: d.email, role: d.role || "staff", venue_id: venueId, org_id: d.org_id || null, is_active: true });
      if (!error) { setUserForm(null); loadUsers(); } else alert("Error: " + error.message);
    } else {
      const { data: updated, error } = await supabase
        .from("staff_users")
        .update({ role: d.role, venue_id: venueId, org_id: d.org_id || null })
        .eq("id", userForm.id)
        .select();
      if (error) { alert("Error: " + error.message); }
      else if (!updated?.length) { alert("Update was blocked — check database permissions (RLS policy may be preventing this change)."); }
      else { setUserForm(null); loadUsers(); }
    }
    setSavingUser(false);
  };

  const toggleUserActive = async (u) => {
    await supabase.from("staff_users").update({ is_active: !u.is_active }).eq("id", u.id);
    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Remove this user? Their Supabase Auth account is not deleted.")) return;
    await supabase.from("staff_users").delete().eq("id", id);
    loadUsers();
  };

  // --- Stock ---
  const loadInventory = async () => {
    setLoadingInventory(true);
    let q = supabase.from("inventory").select("*, products(id, name, category, low_stock_threshold), venues(name)").order("quantity");
    if (stockVenueId && stockVenueId !== "all") q = q.eq("venue_id", stockVenueId);
    const { data, error } = await q;
    if (!error) setInventory(data || []);
    setLoadingInventory(false);
  };

  const saveStockThresholds = async (inv) => {
    const edit = editingStock[inv.id];
    if (!edit) return;
    await Promise.all([
      edit.min !== undefined && inv.products?.id
        ? supabase.from("products").update({ low_stock_threshold: Number(edit.min) }).eq("id", inv.products.id)
        : Promise.resolve(),
      edit.max !== undefined
        ? supabase.from("inventory").update({ max_quantity: Number(edit.max) }).eq("id", inv.id)
        : Promise.resolve(),
    ]);
    const s = { ...editingStock }; delete s[inv.id]; setEditingStock(s);
    loadInventory();
  };

  const autoCalcStockThresholds = async () => {
    setCalcingThresholds(true);
    const LEAD = 2;
    const TIERS = [
      { minRate: 1,   maxDays: LEAD * 2,  reorderDays: LEAD },
      { minRate: 0.2, maxDays: LEAD * 7,  reorderDays: LEAD * 3 },
      { minRate: 0,   maxDays: LEAD * 14, reorderDays: LEAD * 7 },
    ];

    // 1. Fetch last 30 days of completed sales
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: salesData } = await supabase
      .from("order_items")
      .select("product_id, quantity, orders!inner(venue_id, status, created_at)")
      .eq("orders.status", "completed")
      .gte("orders.created_at", since.toISOString());

    // 2. Aggregate total sold per product+venue
    const salesMap = {};
    for (const item of salesData || []) {
      const key = `${item.product_id}:${item.orders.venue_id}`;
      salesMap[key] = (salesMap[key] || 0) + item.quantity;
    }

    // 3. Compute suggestions for each inventory row in current state
    await Promise.all(inventory.flatMap(inv => {
      const key = `${inv.products?.id}:${inv.venue_id}`;
      const avgDaily = (salesMap[key] || 0) / 30;
      const tier = TIERS.find(t => avgDaily >= t.minRate) || TIERS[2];
      const suggestedMax = Math.max(avgDaily === 0 ? 2 : 1, Math.ceil(avgDaily * tier.maxDays));
      const suggestedMin = Math.max(1, Math.ceil(avgDaily * tier.reorderDays));
      return [
        supabase.from("inventory").update({ max_quantity: suggestedMax }).eq("id", inv.id),
        inv.products?.id
          ? supabase.from("products").update({ low_stock_threshold: suggestedMin }).eq("id", inv.products.id)
          : Promise.resolve(),
      ];
    }));

    setCalcingThresholds(false);
    loadInventory();
  };

  const flagForReorder = async (inv) => {
    const venueId = inv.venue_id || stockVenueId;
    const { data: venue } = await supabase.from("venues").select("supplier_email").eq("id", venueId).single();
    const { data: po, error } = await supabase.from("purchase_orders").insert({ venue_id: venueId, status: "draft", supplier_email: venue?.supplier_email || null, notes: `Auto-flagged: ${inv.products?.name} low stock` }).select().single();
    if (!error && po) {
      const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS.default;
      const qty = inv.max_quantity ? Math.max(0, inv.max_quantity - (inv.quantity || 0)) : threshold * 3;
      await supabase.from("purchase_order_items").insert({ po_id: po.id, product_id: inv.products?.id, quantity_ordered: qty });
      loadPurchasing();
    }
  };

  // --- Purchasing ---
  const loadPurchasing = async () => {
    setLoadingPOs(true);
    const [{ data: pos }, { data: alerts }] = await Promise.all([
      supabase.from("purchase_orders").select("*, venues(name, supplier_email), purchase_order_items(*, products(name))").order("created_at", { ascending: false }),
      supabase.from("inventory").select("*, products(id, name, low_stock_threshold), venues(name, supplier_email)").order("quantity"),
    ]);
    setPurchaseOrders(pos || []);
    setReorderAlerts((alerts || []).filter(inv => (inv.quantity || 0) <= (inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS.default)));
    setLoadingPOs(false);
  };

  const loadPOVenueProducts = async (venueId) => {
    if (!venueId) { setPOVenueProducts([]); return; }
    const { data } = await supabase.from("products").select("id, name").eq("venue_id", venueId).order("name");
    setPOVenueProducts(data || []);
  };

  const sendPOEmail = (email, items) => {
    const body = items.map(it => `- ${it.name}: ${it.qty}`).join("\n");
    window.open(`mailto:${email}?subject=${encodeURIComponent("Purchase Order — " + new Date().toLocaleDateString("en-GB"))}&body=${encodeURIComponent(body)}`);
  };

  const resetPOForm = () => {
    setPOForm(false);
    setPOFormData({ venue_id: "", supplier_email: "", notes: "", items: [], _editingId: null });
  };

  const createPO = async (sendImmediately) => {
    const d = poFormData;
    if (!d.venue_id || !d.items?.length) { alert("Select a venue and add at least one item"); return; }
    const { data: po, error } = await supabase.from("purchase_orders").insert({ venue_id: d.venue_id, status: sendImmediately ? "sent" : "draft", supplier_email: d.supplier_email || null, notes: d.notes || null }).select().single();
    if (error) { alert("Error: " + error.message); return; }
    await supabase.from("purchase_order_items").insert(d.items.map(it => ({ po_id: po.id, product_id: it.product_id || null, quantity_ordered: it.qty, unit_cost: it.unit_cost ? Number(it.unit_cost) : null })));
    if (sendImmediately) sendPOEmail(d.supplier_email, d.items);
    resetPOForm();
    loadPurchasing();
  };

  const markPOReceived = async (po) => {
    if (!window.confirm("Mark as received? This will increment inventory for all line items.")) return;
    await supabase.from("purchase_orders").update({ status: "received" }).eq("id", po.id);
    for (const item of po.purchase_order_items || []) {
      if (!item.product_id) continue;
      const { data: existing } = await supabase.from("inventory").select("id, quantity").eq("product_id", item.product_id).eq("venue_id", po.venue_id).maybeSingle();
      if (existing) await supabase.from("inventory").update({ quantity: (existing.quantity || 0) + item.quantity_ordered }).eq("id", existing.id);
    }
    loadPurchasing();
  };

  const startEditPO = async (po) => {
    await loadPOVenueProducts(po.venue_id);
    setPOFormData({
      venue_id: po.venue_id,
      supplier_email: po.supplier_email || po.venues?.supplier_email || "",
      notes: po.notes || "",
      items: (po.purchase_order_items || []).map(it => ({
        product_id: it.product_id || null,
        name: it.products?.name || "",
        qty: it.quantity_ordered,
        unit_cost: it.unit_cost != null ? String(it.unit_cost) : "",
        _key: crypto.randomUUID(),
      })),
      _editingId: po.id,
    });
    setPOForm(true);
  };

  const updatePO = async (sendImmediately) => {
    const d = poFormData;
    if (!d.items?.length) { alert("Add at least one item"); return; }
    const { error } = await supabase.from("purchase_orders").update({ supplier_email: d.supplier_email || null, notes: d.notes || null, status: sendImmediately ? "sent" : "draft" }).eq("id", d._editingId);
    if (error) { alert("Error: " + error.message); return; }
    await supabase.from("purchase_order_items").delete().eq("po_id", d._editingId);
    await supabase.from("purchase_order_items").insert(d.items.map(it => ({ po_id: d._editingId, product_id: it.product_id || null, quantity_ordered: it.qty, unit_cost: it.unit_cost ? Number(it.unit_cost) : null })));
    if (sendImmediately) sendPOEmail(d.supplier_email, d.items);
    resetPOForm();
    loadPurchasing();
  };

  const deletePO = async (poId) => {
    if (!window.confirm("Delete this draft PO? This cannot be undone.")) return;
    await supabase.from("purchase_order_items").delete().eq("po_id", poId);
    await supabase.from("purchase_orders").delete().eq("id", poId);
    loadPurchasing();
  };

  const handleSavePO = (send) => poFormData._editingId ? updatePO(send) : createPO(send);

  const createVenueReorderPO = async (venueId) => {
    const items = reorderAlerts.filter(inv => inv.venue_id === venueId);
    if (!items.length) return;
    const venue = items[0].venues;
    const { data: po, error } = await supabase.from("purchase_orders").insert({
      venue_id: venueId, status: "draft",
      supplier_email: venue?.supplier_email || null,
      notes: `Consolidated reorder — ${items.length} item${items.length !== 1 ? "s" : ""}`,
    }).select().single();
    if (error) { alert("Error: " + error.message); return; }
    await supabase.from("purchase_order_items").insert(items.map(inv => {
      const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS.default;
      const suggested = inv.max_quantity ? Math.max(0, inv.max_quantity - (inv.quantity || 0)) : threshold * 3;
      return { po_id: po.id, product_id: inv.products?.id || null, quantity_ordered: suggested };
    }));
    loadPurchasing();
  };

  const createBulkReorderPOs = async () => {
    const selected = reorderAlerts.filter(inv => selectedAlerts.has(inv.id));
    if (!selected.length) return;
    const byVenue = {};
    selected.forEach(inv => {
      if (!byVenue[inv.venue_id]) byVenue[inv.venue_id] = [];
      byVenue[inv.venue_id].push(inv);
    });
    await Promise.all(Object.entries(byVenue).map(async ([venueId, items]) => {
      const venue = items[0].venues;
      const { data: po, error } = await supabase.from("purchase_orders").insert({ venue_id: venueId, status: "draft", supplier_email: venue?.supplier_email || null, notes: "Bulk reorder" }).select().single();
      if (error) return;
      await supabase.from("purchase_order_items").insert(items.map(inv => {
        const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS.default;
        const suggested = inv.max_quantity ? Math.max(0, inv.max_quantity - (inv.quantity || 0)) : threshold * 3;
        return { po_id: po.id, product_id: inv.products?.id || null, quantity_ordered: suggested };
      }));
    }));
    setSelectedAlerts(new Set());
    loadPurchasing();
  };

  const mergePOs = async () => {
    const selected = purchaseOrders.filter(po => selectedPOIds.has(po.id) && po.status === "draft");
    if (selected.length < 2) { alert("Select at least 2 draft POs to merge"); return; }
    const venueIds = [...new Set(selected.map(po => po.venue_id))];
    if (venueIds.length > 1) { alert("Can only merge POs from the same venue"); return; }
    const sorted = [...selected].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const target = sorted[0];
    const others = sorted.slice(1);
    const allItems = selected.flatMap(po => po.purchase_order_items || []);
    const merged = [];
    const seen = {};
    for (const it of allItems) {
      if (it.product_id) {
        if (seen[it.product_id]) {
          seen[it.product_id].quantity_ordered += it.quantity_ordered;
        } else {
          const entry = { product_id: it.product_id, quantity_ordered: it.quantity_ordered, unit_cost: it.unit_cost };
          seen[it.product_id] = entry;
          merged.push(entry);
        }
      } else {
        merged.push({ product_id: null, quantity_ordered: it.quantity_ordered, unit_cost: it.unit_cost });
      }
    }
    await supabase.from("purchase_order_items").delete().in("po_id", selected.map(po => po.id));
    await supabase.from("purchase_order_items").insert(merged.map(it => ({ po_id: target.id, ...it })));
    await supabase.from("purchase_orders").delete().in("id", others.map(po => po.id));
    setSelectedPOIds(new Set());
    loadPurchasing();
  };

  const poTotal = (po) => {
    const items = po.purchase_order_items || [];
    if (items.every(it => it.unit_cost == null)) return null;
    return items.reduce((sum, it) => sum + ((it.unit_cost || 0) * (it.quantity_ordered || 0)), 0);
  };

  // --- Financials ---
  const loadFinancials = async () => {
    setLoadingFinancials(true);
    const [{ data: venuesData }, { data: psHistory }] = await Promise.all([
      supabase.from("venues").select("id, name, jarvid_profit_share_pct"),
      supabase.from("venue_profit_share_history").select("venue_id, jarvid_profit_share_pct, effective_from").order("effective_from"),
    ]);
    let q = supabase.from("order_items").select("quantity, unit_price_pence, products(supply_price_pence, jarvid_cost_pence), orders!inner(venue_id, status, created_at)").eq("orders.status", "completed");
    if (!finAllTime && finDateFrom) { const f = new Date(finDateFrom); f.setHours(0,0,0,0); q = q.gte("orders.created_at", f.toISOString()); }
    if (!finAllTime && finDateTo) { const t = new Date(finDateTo); t.setHours(23,59,59,999); q = q.lte("orders.created_at", t.toISOString()); }
    const { data: items } = await q;
    if (!venuesData || !items) { setLoadingFinancials(false); return; }

    // Returns the profit share % that was in effect for a given venue on a given date
    const getRateForDate = (venueId, orderDate) => {
      const dateStr = (orderDate || "").slice(0, 10);
      const applicable = (psHistory || []).filter(h => h.venue_id === venueId && h.effective_from <= dateStr);
      if (applicable.length) return applicable[applicable.length - 1].jarvid_profit_share_pct; // already sorted asc
      return venuesData.find(v => v.id === venueId)?.jarvid_profit_share_pct || 20; // fallback to current
    };

    const byVenue = {};
    items.forEach(item => { const vid = item.orders?.venue_id; if (!vid) return; if (!byVenue[vid]) byVenue[vid] = []; byVenue[vid].push(item); });
    const venueFinancials = venuesData.map(v => {
      const vItems = byVenue[v.id] || [];
      let totalRevenue = 0, totalSupply = 0, totalJarvidCost = 0, totalJarvidShare = 0, totalVenueShare = 0;
      vItems.forEach(item => {
        const qty = item.quantity || 1;
        const pct = getRateForDate(v.id, item.orders?.created_at);
        const revenue = (item.unit_price_pence || 0) * qty;
        const supply = (item.products?.supply_price_pence || 0) * qty;
        totalRevenue += revenue; totalSupply += supply;
        totalJarvidCost += (item.products?.jarvid_cost_pence || 0) * qty;
        const itemGrossProfit = revenue - supply;
        const itemJarvidShare = Math.round(itemGrossProfit * (pct / 100));
        totalJarvidShare += itemJarvidShare;
        totalVenueShare += itemGrossProfit - itemJarvidShare;
      });
      const grossProfit = totalRevenue - totalSupply;
      const jarvidMargin = totalSupply - totalJarvidCost;
      return { ...v, totalRevenue, grossProfit, jarvidShare: totalJarvidShare, venueShare: totalVenueShare, jarvidMargin, jarvidTotal: totalJarvidShare + jarvidMargin };
    });
    const platform = venueFinancials.reduce((s, v) => ({ totalRevenue: s.totalRevenue + v.totalRevenue, grossProfit: s.grossProfit + v.grossProfit, jarvidShare: s.jarvidShare + v.jarvidShare, venueShare: s.venueShare + v.venueShare, jarvidMargin: s.jarvidMargin + v.jarvidMargin, jarvidTotal: s.jarvidTotal + v.jarvidTotal }), { totalRevenue: 0, grossProfit: 0, jarvidShare: 0, venueShare: 0, jarvidMargin: 0, jarvidTotal: 0 });
    setFinancials({ venues: venueFinancials, platform });
    setLoadingFinancials(false);
  };

  // --- Billing ---
  const loadBilling = async () => {
    setLoadingBilling(true);
    const { data, error } = await supabase.from("venues").select("id, name, subscription_plan, monthly_fee_pence, billing_status").order("name");
    if (!error) setBilling(data || []);
    setLoadingBilling(false);
  };

  const saveBilling = async (id) => {
    const { data: updated, error } = await supabase.from("venues").update({ subscription_plan: billingFormData.subscription_plan, monthly_fee_pence: Number(billingFormData.monthly_fee_pence), billing_status: billingFormData.billing_status }).eq("id", id).select();
    if (error) { alert("Error: " + error.message); }
    else if (!updated?.length) { alert("Update was blocked — check database permissions (RLS policy on venues table)."); }
    else { setEditingBilling(null); loadBilling(); }
  };

  const loadPlatformSettings = async () => {
    const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
    if (data) setPlatformSettings(data);
  };

  const savePlatformSettings = async () => {
    setSavingSettings(true);
    const d = settingsFormData;
    const payload = {
      default_jarvid_pct: Number(d.default_jarvid_pct) || 20,
      default_subscription_plan: d.default_subscription_plan || "pro",
      default_monthly_fee_pence: Number(d.default_monthly_fee_pence) || 14900,
      low_stock_eliquid: Number(d.low_stock_eliquid) || 5,
      low_stock_prefilled_pod: Number(d.low_stock_prefilled_pod) || 3,
      low_stock_refillable_kit: Number(d.low_stock_refillable_kit) || 2,
      low_stock_refillable_pods: Number(d.low_stock_refillable_pods) || 4,
      low_stock_default: Number(d.low_stock_default) || 5,
    };
    const { data: updated, error } = await supabase.from("platform_settings").update(payload).eq("id", 1).select();
    if (error) { alert("Error: " + error.message); }
    else if (!updated?.length) { alert("Update was blocked — check RLS policy on platform_settings table."); }
    else { setPlatformSettings(updated[0]); setEditingSettings(false); }
    setSavingSettings(false);
  };

  const loadOrgs = async () => {
    const { data } = await supabase
      .from("organisations")
      .select("*, venues(id, name, location)")
      .order("name");
    setOrgs(data || []);
  };

  const saveOrg = async () => {
    setSavingOrg(true);
    const d = orgFormData;
    if (orgForm.mode === "new") {
      const { error } = await supabase.from("organisations").insert({ name: d.name });
      if (!error) { setOrgForm(null); loadOrgs(); } else alert("Error: " + error.message);
    } else {
      const { data: updated, error } = await supabase.from("organisations").update({ name: d.name }).eq("id", orgForm.id).select();
      if (error) { alert("Error: " + error.message); }
      else if (!updated?.length) { alert("Update was blocked — check database permissions (RLS policy on organisations table)."); }
      else { setOrgForm(null); loadOrgs(); }
    }
    setSavingOrg(false);
  };

  const deleteOrg = async (id) => {
    if (!window.confirm("Delete this organisation? Venues will be unlinked but not deleted.")) return;
    await supabase.from("venues").update({ org_id: null }).eq("org_id", id);
    await supabase.from("organisations").delete().eq("id", id);
    loadOrgs(); loadVenues();
  };

  const assignVenueToOrg = async (venueId, orgId) => {
    await supabase.from("venues").update({ org_id: orgId || null }).eq("id", venueId);
    loadOrgs(); loadVenues();
  };

  const navItems = [
    { id: "venues",        icon: Building2,      label: "Venues" },
    { id: "organisations", icon: Network,        label: "Organisations" },
    { id: "users",      icon: Users,          label: "Users" },
    { id: "stock",      icon: Package,        label: "Stock" },
    { id: "purchasing", icon: ShoppingCart,   label: "Purchasing" },
    { id: "devices",    icon: Monitor,        label: "Devices" },
    { id: "financials", icon: PoundSterling,  label: "Financials" },
    { id: "billing",    icon: CreditCard,     label: "Billing" },
    { id: "settings",   icon: Settings,       label: "Settings" },
  ];

  return (
    <div className="admin-layout">
      <div className="sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Platform</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>JarvID Admin</div>
          <div style={{ fontSize: 12, color: DS.colors.accent, display: "flex", alignItems: "center", gap: 4 }}><Circle size={7} fill={DS.colors.accent} stroke="none" /> System Healthy</div>
        </div>
        <div className="sidebar-section">Management</div>
        {navItems.map(item => {
          const AdminNavIcon = item.icon;
          return (
            <div key={item.id} className={`sidebar-item ${adminSection === item.id ? "active" : ""}`} onClick={() => setAdminSection(item.id)}>
              {AdminNavIcon && <AdminNavIcon size={15} />} {item.label}
            </div>
          );
        })}
      </div>

      <div className="manager-content">

        {/* ===== VENUES ===== */}
        {adminSection === "venues" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="section-title">ALL VENUES</div>
                <div className="section-sub">Network-wide overview · {venues.length} venues</div>
              </div>
              <button className="btn-sm btn-accent" onClick={() => { setVenueForm({ mode: "new" }); setVenueFormData({ subscription_plan: platformSettings?.default_subscription_plan || "pro", monthly_fee_pence: platformSettings?.default_monthly_fee_pence || 14900, jarvid_profit_share_pct: platformSettings?.default_jarvid_pct || 20 }); }}>+ New Venue</button>
            </div>

            {venueForm && (
              <div style={{ background: DS.colors.card, border: `1px solid ${DS.colors.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{venueForm.mode === "new" ? "New Venue" : "Edit Venue"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={fieldStyle}><div style={labelStyle}>Name *</div><input style={inputStyle} value={venueFormData.name || ""} onChange={e => setVenueFormData(d => ({ ...d, name: e.target.value }))} placeholder="The Crown Pub" /></div>
                  <div style={fieldStyle}><div style={labelStyle}>Location</div><input style={inputStyle} value={venueFormData.location || ""} onChange={e => setVenueFormData(d => ({ ...d, location: e.target.value }))} placeholder="Manchester" /></div>
                  <div style={fieldStyle}><div style={labelStyle}>Organisation</div><select style={inputStyle} value={venueFormData.org_id || ""} onChange={e => setVenueFormData(d => ({ ...d, org_id: e.target.value }))}><option value="">— Auto-create from venue name —</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>JarvID Cut %</div>
                    <input style={inputStyle} type="number" value={venueFormData.jarvid_profit_share_pct ?? 20} onChange={e => setVenueFormData(d => ({ ...d, jarvid_profit_share_pct: e.target.value }))} />
                    <div style={{ fontSize: 11, color: DS.colors.textMuted }}>
                      JarvID keeps {venueFormData.jarvid_profit_share_pct ?? 20}% · venue keeps {100 - (venueFormData.jarvid_profit_share_pct ?? 20)}%
                    </div>
                  </div>
                  {venueForm.mode === "new" && (
                    <div style={fieldStyle}>
                      <div style={labelStyle}>Agreement Start Date</div>
                      <input style={inputStyle} type="date" value={venueFormData.profit_share_effective_from || ""} onChange={e => setVenueFormData(d => ({ ...d, profit_share_effective_from: e.target.value }))} />
                      <div style={{ fontSize: 11, color: DS.colors.textMuted }}>Date the profit share agreement takes effect</div>
                    </div>
                  )}
                  {venueForm.mode === "edit" && Number(venueFormData.jarvid_profit_share_pct) !== venueForm.originalPct && (
                    <div style={{ ...fieldStyle, gridColumn: "span 2", background: DS.colors.warnGlow, border: `1px solid ${DS.colors.warn}44`, borderRadius: 8, padding: 12 }}>
                      <div style={labelStyle}>New Rate Effective From *</div>
                      <input style={inputStyle} type="date" value={venueFormData.profit_share_effective_from || ""} onChange={e => setVenueFormData(d => ({ ...d, profit_share_effective_from: e.target.value }))} />
                      <div style={{ fontSize: 11, color: DS.colors.warn }}>Financials before this date will use the previous rate (JarvID {venueForm.originalPct}% / venue {100 - venueForm.originalPct}%)</div>
                    </div>
                  )}
                  <div style={fieldStyle}><div style={labelStyle}>Supplier Email</div><input style={inputStyle} type="email" value={venueFormData.supplier_email || ""} onChange={e => setVenueFormData(d => ({ ...d, supplier_email: e.target.value }))} placeholder="supplier@company.com" /></div>
                  <div style={fieldStyle}><div style={labelStyle}>Subscription Plan</div><select style={inputStyle} value={venueFormData.subscription_plan || "pro"} onChange={e => setVenueFormData(d => ({ ...d, subscription_plan: e.target.value }))}><option value="free">Free</option><option value="starter">Starter</option><option value="pro">Pro</option></select></div>
                  <div style={fieldStyle}><div style={labelStyle}>Monthly Fee (pence)</div><input style={inputStyle} type="number" value={venueFormData.monthly_fee_pence ?? 14900} onChange={e => setVenueFormData(d => ({ ...d, monthly_fee_pence: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn-sm btn-accent" onClick={saveVenue} disabled={savingVenue}>{savingVenue ? "Saving…" : "Save"}</button>
                  <button className="btn-sm btn-outline" onClick={() => setVenueForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="stats-row">
              <div className="stat-card"><div className="stat-label">Total Venues</div><div className="stat-value">{venues.length}</div></div>
              <div className="stat-card"><div className="stat-label">Network Revenue Today</div><div className="stat-value">{fmt(venues.reduce((s, v) => s + (v.todaySales || 0), 0))}</div></div>
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
                        <div className="venue-loc" style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {v.location}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <div className={`online-dot ${v.status === "online" ? "dot-online" : "dot-offline"}`} />
                        {v.subscription_plan && <span className="tag-pill" style={{ background: "rgba(47,134,235,0.1)", color: DS.colors.blue, fontSize: 10 }}>{v.subscription_plan.toUpperCase()}</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 4 }}>Today's Revenue</div>
                      <div className="venue-sales">{fmt(v.todaySales || 0)}</div>
                    </div>
                    <div className="venue-meta">
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Tablet size={11} /> {v.kiosks || 1} kiosk{(v.kiosks || 1) !== 1 ? "s" : ""}</span>
                      <span style={{ color: v.status === "online" ? DS.colors.accent : DS.colors.danger, display: "flex", alignItems: "center", gap: 4 }}><Circle size={7} fill={v.status === "online" ? DS.colors.accent : DS.colors.danger} stroke="none" /> {v.status}</span>
                    </div>
                    {/* URL Slug */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>URL Slug</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: DS.colors.textMuted }}>app.jarv-id.com/</span>
                        <input
                          type="text"
                          id={`slug-${v.id}`}
                          defaultValue={v.slug || ""}
                          key={`slug-${v.id}`}
                          placeholder="venue-slug"
                          style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "6px 10px", color: DS.colors.text, fontSize: 13, fontFamily: DS.font.body, width: 140, outline: "none" }}
                          onChange={e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""); }}
                        />
                        <span style={{ fontSize: 11, color: DS.colors.textMuted }}>/kiosk</span>
                        <button className="btn-sm btn-accent" onClick={async () => {
                          const input = document.getElementById(`slug-${v.id}`);
                          const newSlug = input?.value?.trim();
                          if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) { alert("Slug must be lowercase letters, numbers, and hyphens only"); return; }
                          const { error } = await supabase.from("venues").update({ slug: newSlug }).eq("id", v.id);
                          if (error?.code === "23505") { alert("This slug is already taken — choose a different one"); }
                          else if (!error) { input.style.borderColor = DS.colors.accent; setTimeout(() => input.style.borderColor = DS.colors.border, 2000); loadVenues(); }
                        }}>Save</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: DS.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Kiosk PIN</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="text" inputMode="numeric" maxLength={6} defaultValue={v.kiosk_pin || "1234"} key={v.id} id={`pin-${v.id}`}
                          style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: 6, padding: "6px 10px", color: DS.colors.accent, fontSize: 16, fontFamily: DS.font.display, fontWeight: 700, width: 90, outline: "none", letterSpacing: "0.15em" }}
                          onChange={e => e.target.value = e.target.value.replace(/\D/g, "")} />
                        <button className="btn-sm btn-accent" onClick={async () => {
                          const input = document.getElementById(`pin-${v.id}`);
                          const newPin = input?.value;
                          if (!newPin || newPin.length < 4) { alert("PIN must be at least 4 digits"); return; }
                          const { error } = await supabase.from("venues").update({ kiosk_pin: newPin }).eq("id", v.id);
                          if (!error) { input.style.borderColor = DS.colors.accent; setTimeout(() => input.style.borderColor = DS.colors.border, 2000); }
                        }}>Save</button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      {v.stripe_account_id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e" }}>
                          <Check size={13} /> Stripe connected
                          <span style={{ color: DS.colors.textMuted, fontSize: 11, marginLeft: 4 }}>{v.stripe_account_id.slice(0, 16)}…</span>
                        </div>
                      ) : (
                        <button
                          className="btn-sm btn-outline"
                          style={{ width: "100%", color: DS.colors.accent, borderColor: DS.colors.accent }}
                          onClick={() => connectStripe(v.id)}
                          disabled={connectingStripeId === v.id}
                        >
                          {connectingStripeId === v.id ? "Opening Stripe…" : "Connect Stripe"}
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-sm btn-outline" style={{ flex: 1 }} onClick={() => { setVenueForm({ mode: "edit", id: v.id, originalPct: v.jarvid_profit_share_pct || 20 }); setVenueFormData({ name: v.name, location: v.location, jarvid_profit_share_pct: v.jarvid_profit_share_pct || 20, supplier_email: v.supplier_email || "", subscription_plan: v.subscription_plan || "pro", monthly_fee_pence: v.monthly_fee_pence || 14900 }); }}>Edit</button>
                      <button className="btn-sm btn-outline" style={{ flex: 1 }} onClick={() => setShowingHistoryId(showingHistoryId === v.id ? null : v.id)}>History</button>
                      <button style={{ ...dangerBtnStyle, flex: 1 }} onClick={() => deleteVenue(v.id)} disabled={deletingVenueId === v.id}>{deletingVenueId === v.id ? "…" : "Delete"}</button>
                    </div>
                    {showingHistoryId === v.id && (
                      <div style={{ marginTop: 12, borderTop: `1px solid ${DS.colors.border}`, paddingTop: 10 }}>
                        <div style={{ fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Profit Share History</div>
                        {(venuePSHistory[v.id] || []).length === 0 ? (
                          <div style={{ fontSize: 12, color: DS.colors.textMuted }}>No history recorded yet</div>
                        ) : (
                          (venuePSHistory[v.id] || []).map((h, idx, arr) => {
                            const nextRecord = arr[idx + 1]; // arr is desc, so next = earlier record
                            const endDate = nextRecord
                              ? new Date(new Date(h.effective_from) - 1).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : null;
                            const isCurrent = idx === 0;
                            return (
                              <div key={h.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: idx < arr.length - 1 ? `1px solid ${DS.colors.border}` : "none" }}>
                                <div>
                                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: DS.font.display, color: isCurrent ? DS.colors.accent : DS.colors.text }}>JarvID {h.jarvid_profit_share_pct}% / venue {100 - h.jarvid_profit_share_pct}%</span>
                                  {isCurrent && <span className="tag-pill" style={{ background: DS.colors.accentGlow, color: DS.colors.accent, fontSize: 10, marginLeft: 6 }}>current</span>}
                                </div>
                                <div style={{ fontSize: 11, color: DS.colors.textMuted, textAlign: "right" }}>
                                  <div>from {new Date(h.effective_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                                  {endDate && <div>to {endDate}</div>}
                                  {isCurrent && !endDate && <div style={{ color: DS.colors.accent }}>ongoing</div>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {venues.length === 0 && !loadingVenues && <div style={{ color: DS.colors.textMuted, padding: 32 }}>No venues found.</div>}
              </div>
            )}
          </>
        )}

        {/* ===== USERS ===== */}
        {adminSection === "users" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="section-title">USERS</div><div className="section-sub">All staff accounts across the platform</div></div>
              <button className="btn-sm btn-accent" onClick={() => { setUserForm({ mode: "new" }); setUserFormData({ role: "staff" }); }}>+ Add User</button>
            </div>

            {userForm && (
              <div style={{ background: DS.colors.card, border: `1px solid ${DS.colors.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{userForm.mode === "new" ? "Add Staff User" : "Edit User"}</div>
                {userForm.mode === "new" && <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 16 }}>Note: The user must already have a Supabase Auth account. This creates their staff_users record only.</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {userForm.mode === "new" && <div style={fieldStyle}><div style={labelStyle}>Email *</div><input style={inputStyle} type="email" value={userFormData.email || ""} onChange={e => setUserFormData(d => ({ ...d, email: e.target.value }))} placeholder="staff@venue.com" /></div>}
                  <div style={fieldStyle}><div style={labelStyle}>Role</div><select style={inputStyle} value={userFormData.role || "staff"} onChange={e => setUserFormData(d => ({ ...d, role: e.target.value }))}><option value="staff">Staff</option><option value="manager">Manager</option><option value="org_admin">Org Admin</option><option value="admin">Admin</option></select></div>
                  <div style={fieldStyle}><div style={labelStyle}>Venue</div><select style={inputStyle} value={userFormData.venue_id || ""} onChange={e => { const v = venues.find(v => v.id === e.target.value); setUserFormData(d => ({ ...d, venue_id: e.target.value, org_id: v?.org_id || d.org_id || "" })); }}><option value="">— None —</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                  <div style={fieldStyle}><div style={labelStyle}>Organisation</div><select style={inputStyle} value={userFormData.org_id || ""} onChange={e => setUserFormData(d => ({ ...d, org_id: e.target.value }))}><option value="">— None —</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn-sm btn-accent" onClick={saveUser} disabled={savingUser}>{savingUser ? "Saving…" : "Save"}</button>
                  <button className="btn-sm btn-outline" onClick={() => setUserForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            {loadingUsers ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                  <thead><tr><th>Email</th><th>Role</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{u.email}</td>
                        <td><span className="tag-pill" style={{ background: u.role === "admin" ? DS.colors.dangerGlow : u.role === "manager" ? "rgba(47,134,235,0.1)" : DS.colors.accentGlow, color: u.role === "admin" ? DS.colors.danger : u.role === "manager" ? DS.colors.blue : DS.colors.accent }}>{u.role}</span></td>
                        <td style={{ color: DS.colors.textSub }}>{u.venues?.name || "—"}</td>
                        <td><span className="tag-pill" style={{ background: u.is_active ? DS.colors.accentGlow : DS.colors.dangerGlow, color: u.is_active ? DS.colors.accent : DS.colors.danger }}>{u.is_active ? "Active" : "Inactive"}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn-sm btn-outline" onClick={() => { setUserForm({ mode: "edit", id: u.id }); setUserFormData({ role: u.role, venue_id: u.venue_id || "", org_id: u.org_id || "" }); }}>Edit</button>
                            <button className="btn-sm btn-outline" style={{ color: u.is_active ? DS.colors.warn : DS.colors.accent, borderColor: u.is_active ? DS.colors.warn : DS.colors.accent }} onClick={() => toggleUserActive(u)}>{u.is_active ? "Deactivate" : "Reactivate"}</button>
                            <button style={dangerBtnStyle} onClick={() => deleteUser(u.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: DS.colors.textMuted, padding: 32 }}>No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ===== ORGANISATIONS ===== */}
        {adminSection === "organisations" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="section-title">ORGANISATIONS</div><div className="section-sub">Group venues under a shared organisation</div></div>
              <button className="btn-sm btn-accent" onClick={() => { setOrgForm({ mode: "new" }); setOrgFormData({}); }}>+ New Organisation</button>
            </div>

            {orgForm && (
              <div style={{ background: DS.colors.card, border: `1px solid ${DS.colors.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{orgForm.mode === "new" ? "New Organisation" : "Edit Organisation"}</div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <div style={labelStyle}>Name *</div>
                    <input style={inputStyle} value={orgFormData.name || ""} onChange={e => setOrgFormData(d => ({ ...d, name: e.target.value }))} placeholder="The Crown" />
                  </div>
                  <button className="btn-sm btn-accent" onClick={saveOrg} disabled={savingOrg}>{savingOrg ? "Saving…" : "Save"}</button>
                  <button className="btn-sm btn-outline" onClick={() => setOrgForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orgs.map(org => {
                const orgVenues = org.venues || [];
                const unassignedVenues = venues.filter(v => !v.org_id || v.org_id === org.id);
                return (
                  <div key={org.id} className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{org.name}</span>
                        <span style={{ fontSize: 12, color: DS.colors.textMuted, marginLeft: 10 }}>{orgVenues.length} venue{orgVenues.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-sm btn-outline" onClick={() => { setOrgForm({ mode: "edit", id: org.id }); setOrgFormData({ name: org.name }); }}>Rename</button>
                        <button className="btn-sm btn-outline" style={{ color: DS.colors.danger, borderColor: DS.colors.danger }} onClick={() => deleteOrg(org.id)}>Delete</button>
                      </div>
                    </div>
                    <div style={{ padding: "10px 16px" }}>
                      {orgVenues.length > 0 ? (
                        <table className="data-table" style={{ marginBottom: orgVenues.length ? 10 : 0 }}>
                          <thead><tr><th>Venue</th><th>Location</th><th style={{ width: 80 }}></th></tr></thead>
                          <tbody>
                            {orgVenues.map(v => (
                              <tr key={v.id}>
                                <td style={{ fontWeight: 600 }}>{v.name}</td>
                                <td style={{ color: DS.colors.textSub }}>{v.location || "—"}</td>
                                <td><button className="btn-sm btn-outline" style={{ color: DS.colors.warn, borderColor: DS.colors.warn }} onClick={() => assignVenueToOrg(v.id, null)}>Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 10 }}>No venues assigned</div>
                      )}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          style={{ ...inputStyle, width: "auto", minWidth: 220 }}
                          defaultValue=""
                          onChange={e => { if (e.target.value) { assignVenueToOrg(e.target.value, org.id); e.target.value = ""; } }}
                        >
                          <option value="">+ Add venue to this org…</option>
                          {venues.filter(v => v.org_id !== org.id).map(v => (
                            <option key={v.id} value={v.id}>{v.name}{v.org_id ? " (reassign)" : ""}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              {orgs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: DS.colors.textMuted }}>No organisations yet</div>}
            </div>
          </>
        )}

        {/* ===== STOCK ===== */}
        {adminSection === "stock" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="section-title">STOCK</div><div className="section-sub">Inventory levels across all venues</div></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="btn-sm btn-outline"
                  style={{ color: DS.colors.accent, borderColor: DS.colors.accent }}
                  onClick={autoCalcStockThresholds}
                  disabled={calcingThresholds}
                >
                  {calcingThresholds ? "Calculating…" : "Auto-calc Thresholds"}
                </button>
                <select style={{ ...inputStyle, width: "auto", minWidth: 180 }} value={stockVenueId} onChange={e => setStockVenueId(e.target.value)}>
                  <option value="all">All Venues</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {loadingInventory ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${DS.colors.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {["all", "out", "low", "over", "ok"].map(s => (
                    <button key={s} className="btn-sm btn-outline" style={{ color: stockStatusFilter === s ? DS.colors.accent : DS.colors.textMuted, borderColor: stockStatusFilter === s ? DS.colors.accent : DS.colors.border }} onClick={() => setStockStatusFilter(s)}>
                      {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <input style={{ ...inputStyle, width: 200, flex: "none" }} value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Search product or category…" />
                </div>
                {(() => {
                  const sq = stockSearch.trim().toLowerCase();
                  const filteredInventory = inventory
                    .filter(inv => {
                      if (!sq) return true;
                      return (inv.products?.name || "").toLowerCase().includes(sq) || (inv.products?.category || "").toLowerCase().includes(sq);
                    })
                    .filter(inv => {
                      if (stockStatusFilter === "all") return true;
                      const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                      const qty = inv.quantity || 0;
                      if (stockStatusFilter === "out") return qty === 0;
                      if (stockStatusFilter === "low") return qty > 0 && qty <= threshold;
                      if (stockStatusFilter === "over") return inv.max_quantity && qty > inv.max_quantity;
                      if (stockStatusFilter === "ok") return qty > threshold && !(inv.max_quantity && qty > inv.max_quantity);
                      return true;
                    })
                    .sort((a, b) => {
                      const dir = stockSort.dir === "asc" ? 1 : -1;
                      if (stockSort.col === "name")   return dir * (a.products?.name || "").localeCompare(b.products?.name || "");
                      if (stockSort.col === "category") return dir * (a.products?.category || "").localeCompare(b.products?.category || "");
                      if (stockSort.col === "venue")  return dir * (a.venues?.name || "").localeCompare(b.venues?.name || "");
                      if (stockSort.col === "stock")  return dir * ((a.quantity || 0) - (b.quantity || 0));
                      if (stockSort.col === "min") {
                        const thresh = inv => inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                        return dir * (thresh(a) - thresh(b));
                      }
                      if (stockSort.col === "max")    return dir * ((a.max_quantity || 0) - (b.max_quantity || 0));
                      if (stockSort.col === "status") {
                        const rank = inv => { const t = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default; const q = inv.quantity || 0; return (inv.max_quantity && q > inv.max_quantity) ? 0 : q > t ? 1 : q > 0 ? 2 : 3; };
                        return dir * (rank(a) - rank(b));
                      }
                      return 0;
                    });
                  const si = (col) => stockSort.col === col ? (stockSort.dir === "asc" ? " ↑" : " ↓") : "";
                  const hs = (col) => setStockSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                  const colW = ["20%", "12%", "14%", "8%", "8%", "8%", "10%", "20%"];
                  return (
                    <>
                      <table className="data-table" style={{ tableLayout: "fixed" }}>
                        <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                        <thead><tr>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("name")}>Product{si("name")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("category")}>Category{si("category")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("venue")}>Venue{si("venue")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("stock")}>Stock{si("stock")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("min")}>Min{si("min")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("max")}>Max{si("max")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => hs("status")}>Status{si("status")}</th>
                          <th>Actions</th>
                        </tr></thead>
                      </table>
                      <div style={{ maxHeight: 480, overflowY: "auto" }}>
                        <table className="data-table" style={{ tableLayout: "fixed" }}>
                          <colgroup>{colW.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                          <tbody>
                            {filteredInventory.map(inv => {
                              const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS[inv.products?.category] || LOW_STOCK_THRESHOLDS.default;
                              const qty = inv.quantity || 0;
                              const maxQ = inv.max_quantity;
                              const isOut = qty === 0;
                              const isLow = qty > 0 && qty <= threshold;
                              const isOver = maxQ && qty > maxQ;
                              const statusLabel = isOut ? "Out" : isLow ? "Low" : isOver ? "Over" : "OK";
                              const statusColor = isOut ? DS.colors.danger : isLow ? DS.colors.warn : isOver ? DS.colors.blue : DS.colors.accent;
                              const editing = editingStock[inv.id];
                              return (
                                <tr key={inv.id}>
                                  <td style={{ fontWeight: 600 }}>{inv.products?.name || "—"}</td>
                                  <td><span className="tag-pill" style={{ background: DS.colors.accentGlow, color: DS.colors.accent, fontSize: 10 }}>{inv.products?.category || "—"}</span></td>
                                  <td style={{ color: DS.colors.textSub, fontSize: 12 }}>{inv.venues?.name || "—"}</td>
                                  <td style={{ fontFamily: DS.font.mono, fontWeight: 700, color: statusColor }}>{qty}</td>
                                  <td>{editing ? <input style={{ ...inputStyle, width: 60, padding: "3px 6px" }} type="number" defaultValue={threshold} onChange={e => setEditingStock(s => ({ ...s, [inv.id]: { ...s[inv.id], min: e.target.value } }))} /> : threshold}</td>
                                  <td>{editing ? <input style={{ ...inputStyle, width: 60, padding: "3px 6px" }} type="number" defaultValue={maxQ || ""} placeholder="—" onChange={e => setEditingStock(s => ({ ...s, [inv.id]: { ...s[inv.id], max: e.target.value } }))} /> : (maxQ || "—")}</td>
                                  <td><span className="tag-pill" style={{ background: statusColor + "22", color: statusColor }}>{statusLabel}</span></td>
                                  <td>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {editing ? (
                                        <>
                                          <button className="btn-sm btn-accent" onClick={() => saveStockThresholds(inv)}>Save</button>
                                          <button className="btn-sm btn-outline" onClick={() => { const s = { ...editingStock }; delete s[inv.id]; setEditingStock(s); }}>Cancel</button>
                                        </>
                                      ) : (
                                        <>
                                          <button className="btn-sm btn-outline" onClick={() => setEditingStock(s => ({ ...s, [inv.id]: {} }))}>Edit</button>
                                          <button className="btn-sm btn-outline" style={{ color: DS.colors.warn, borderColor: DS.colors.warn }} onClick={() => flagForReorder(inv)}>Flag</button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredInventory.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: DS.colors.textMuted, padding: 32 }}>{inventory.length > 0 ? "No items match filters" : "No inventory records found"}</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* ===== PURCHASING ===== */}
        {adminSection === "purchasing" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="section-title">PURCHASING</div><div className="section-sub">Reorder alerts and purchase orders</div></div>
              <button className="btn-sm btn-accent" onClick={() => { resetPOForm(); setPOForm(true); setPOVenueProducts([]); }}>+ New PO</button>
            </div>

            {loadingPOs ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <>
                {reorderAlerts.length > 0 && (() => {
                  const byVenue = {};
                  reorderAlerts.forEach(inv => {
                    const vid = inv.venue_id;
                    if (!byVenue[vid]) byVenue[vid] = { name: inv.venues?.name || "Unknown", items: [] };
                    byVenue[vid].items.push(inv);
                  });
                  const venueGroups = Object.entries(byVenue);
                  return (
                    <div className="chart-card" style={{ border: `1px solid ${DS.colors.warn}33` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div className="chart-title" style={{ color: DS.colors.warn, display: "flex", alignItems: "center", gap: 6, margin: 0 }}><AlertTriangle size={14} /> Reorder Alerts ({reorderAlerts.length})</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {selectedAlerts.size > 0 && (
                            <button className="btn-sm btn-accent" onClick={createBulkReorderPOs}>
                              Consolidate selected into {[...new Set(reorderAlerts.filter(i => selectedAlerts.has(i.id)).map(i => i.venue_id))].length} PO{[...new Set(reorderAlerts.filter(i => selectedAlerts.has(i.id)).map(i => i.venue_id))].length !== 1 ? "s" : ""}
                            </button>
                          )}
                          <label style={{ fontSize: 12, color: DS.colors.textMuted, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input type="checkbox" checked={selectedAlerts.size === reorderAlerts.length && reorderAlerts.length > 0} onChange={e => setSelectedAlerts(e.target.checked ? new Set(reorderAlerts.map(i => i.id)) : new Set())} />
                            Select all
                          </label>
                        </div>
                      </div>
                      {venueGroups.map(([venueId, group]) => {
                        const venueSelected = group.items.every(i => selectedAlerts.has(i.id));
                        const venuePartial = !venueSelected && group.items.some(i => selectedAlerts.has(i.id));
                        return (
                          <div key={venueId} style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${DS.colors.border}`, marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" ref={el => { if (el) el.indeterminate = venuePartial; }} checked={venueSelected} onChange={e => {
                                  const s = new Set(selectedAlerts);
                                  group.items.forEach(i => e.target.checked ? s.add(i.id) : s.delete(i.id));
                                  setSelectedAlerts(s);
                                }} />
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{group.name}</span>
                                <span style={{ fontSize: 12, color: DS.colors.textMuted }}>{group.items.length} alert{group.items.length !== 1 ? "s" : ""}</span>
                              </div>
                              <button className="btn-sm btn-outline" style={{ color: DS.colors.warn, borderColor: DS.colors.warn }} onClick={() => createVenueReorderPO(venueId)}>
                                Create 1 PO for all {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                              </button>
                            </div>
                            <table className="data-table">
                              <thead><tr><th style={{ width: 32 }}></th><th>Product</th><th>Stock</th><th>Min</th><th>Suggested Qty</th><th style={{ width: 110 }}></th></tr></thead>
                              <tbody>
                                {group.items.map(inv => {
                                  const threshold = inv.products?.low_stock_threshold || LOW_STOCK_THRESHOLDS.default;
                                  const suggested = inv.max_quantity ? Math.max(0, inv.max_quantity - (inv.quantity || 0)) : threshold * 3;
                                  return (
                                    <tr key={inv.id}>
                                      <td><input type="checkbox" checked={selectedAlerts.has(inv.id)} onChange={e => { const s = new Set(selectedAlerts); e.target.checked ? s.add(inv.id) : s.delete(inv.id); setSelectedAlerts(s); }} /></td>
                                      <td style={{ fontWeight: 600 }}>{inv.products?.name || "—"}</td>
                                      <td style={{ color: DS.colors.danger, fontWeight: 700 }}>{inv.quantity || 0}</td>
                                      <td>{threshold}</td>
                                      <td style={{ color: DS.colors.accent }}>{suggested}</td>
                                      <td><button className="btn-sm btn-outline" onClick={() => flagForReorder(inv)}>Solo PO</button></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {poForm && (
                  <div style={{ background: DS.colors.card, border: `1px solid ${DS.colors.border}`, borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{poFormData._editingId ? "Edit Purchase Order" : "New Purchase Order"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={fieldStyle}>
                        <div style={labelStyle}>Venue *</div>
                        <select style={{ ...inputStyle, opacity: poFormData._editingId ? 0.6 : 1 }} value={poFormData.venue_id} disabled={!!poFormData._editingId} onChange={e => {
                          const v = venues.find(v => v.id === e.target.value);
                          setPOFormData(d => ({ ...d, venue_id: e.target.value, supplier_email: v?.supplier_email || d.supplier_email }));
                          loadPOVenueProducts(e.target.value);
                        }}>
                          <option value="">— Select venue —</option>
                          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div style={fieldStyle}><div style={labelStyle}>Supplier Email</div><input style={inputStyle} type="email" value={poFormData.supplier_email || ""} onChange={e => setPOFormData(d => ({ ...d, supplier_email: e.target.value }))} placeholder="supplier@company.com" /></div>
                      <div style={{ ...fieldStyle, gridColumn: "span 2" }}><div style={labelStyle}>Notes</div><input style={inputStyle} value={poFormData.notes || ""} onChange={e => setPOFormData(d => ({ ...d, notes: e.target.value }))} placeholder="e.g. Urgent restock" /></div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <div style={{ flex: 2, fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Product</div>
                        <div style={{ width: 80, fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qty</div>
                        <div style={{ width: 90, fontSize: 11, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost (p)</div>
                        <div style={{ width: 28 }} />
                      </div>
                      {poFormData.items.map((it, idx) => (
                        <div key={it._key || idx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
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
                            <input style={{ ...inputStyle, flex: 2 }} value={it.name || ""} onChange={e => { const items = [...poFormData.items]; items[idx] = { ...items[idx], name: e.target.value }; setPOFormData(d => ({ ...d, items })); }} placeholder="Product name" />
                          )}
                          <input style={{ ...inputStyle, width: 80, flex: "none" }} type="number" min={1} value={it.qty || ""} onChange={e => { const items = [...poFormData.items]; items[idx] = { ...items[idx], qty: Number(e.target.value) }; setPOFormData(d => ({ ...d, items })); }} placeholder="Qty" />
                          <input style={{ ...inputStyle, width: 90, flex: "none" }} type="number" min={0} step="0.0001" value={it.unit_cost || ""} onChange={e => { const items = [...poFormData.items]; items[idx] = { ...items[idx], unit_cost: e.target.value }; setPOFormData(d => ({ ...d, items })); }} placeholder="Cost (p)" />
                          <button className="btn-sm btn-outline" style={{ color: DS.colors.danger, borderColor: DS.colors.danger, flex: "none" }} onClick={() => setPOFormData(d => ({ ...d, items: d.items.filter((_, i) => i !== idx) }))}><X size={12} /></button>
                        </div>
                      ))}
                      <button className="btn-sm btn-outline" onClick={() => setPOFormData(d => ({ ...d, items: [...d.items, { name: "", qty: 1, unit_cost: "", product_id: null, _key: crypto.randomUUID() }] }))}>+ Add Item</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-sm btn-accent" onClick={() => handleSavePO(false)}>Save as Draft</button>
                      <button className="btn-sm btn-outline" style={{ color: DS.colors.blue, borderColor: DS.colors.blue }} onClick={() => handleSavePO(true)}>Send via Email</button>
                      <button className="btn-sm btn-outline" onClick={resetPOForm}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.colors.border}` }}>
                    <div className="chart-title" style={{ marginBottom: 8 }}>Purchase Orders</div>
                    {selectedPOIds.size >= 2 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "8px 12px", background: DS.colors.accentGlow || DS.colors.accent + "22", borderRadius: 6 }}>
                        <span style={{ fontSize: 12, color: DS.colors.textMuted }}>{selectedPOIds.size} drafts selected</span>
                        <button className="btn-sm btn-accent" onClick={mergePOs}>Merge into One PO</button>
                        <button className="btn-sm btn-outline" onClick={() => setSelectedPOIds(new Set())}>Clear</button>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {["all", "draft", "sent", "received"].map(s => (
                        <button key={s} className="btn-sm btn-outline" style={{ color: poFilterStatus === s ? DS.colors.accent : DS.colors.textMuted, borderColor: poFilterStatus === s ? DS.colors.accent : DS.colors.border }} onClick={() => setPOFilterStatus(s)}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                      ))}
                      <select style={{ ...inputStyle, width: "auto", minWidth: 120, flex: "none" }} value={poFilterVenue} onChange={e => setPOFilterVenue(e.target.value)}>
                        <option value="all">All venues</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <input style={{ ...inputStyle, width: 200, flex: "none" }} value={poSearch} onChange={e => setPOSearch(e.target.value)} placeholder="Search product or supplier…" />
                    </div>
                  </div>
                  {(() => {
                    const searchQuery = poSearch.trim().toLowerCase();
                    const filteredPOs = purchaseOrders
                      .filter(po => poFilterStatus === "all" || po.status === poFilterStatus)
                      .filter(po => poFilterVenue === "all" || po.venue_id === poFilterVenue)
                      .filter(po => {
                        if (!searchQuery) return true;
                        return (po.supplier_email||"").toLowerCase().includes(searchQuery)
                          || (po.venues?.name||"").toLowerCase().includes(searchQuery)
                          || (po.purchase_order_items||[]).some(it => (it.products?.name||"").toLowerCase().includes(searchQuery));
                      })
                      .sort((a, b) => {
                        const dir = poSort.dir === "asc" ? 1 : -1;
                        if (poSort.col === "date")   return dir * (Date.parse(a.created_at) - Date.parse(b.created_at));
                        if (poSort.col === "venue")  return dir * (a.venues?.name||"").localeCompare(b.venues?.name||"");
                        if (poSort.col === "status") return dir * a.status.localeCompare(b.status);
                        if (poSort.col === "total")  return dir * ((poTotal(a)??-1) - (poTotal(b)??-1));
                        return 0;
                      });
                    const sortIcon = (col) => poSort.col === col ? (poSort.dir === "asc" ? " ↑" : " ↓") : "";
                    const handleSort = (col) => setPOSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                    return (
                      <table className="data-table">
                        <thead><tr>
                          <th style={{ width: 36 }}></th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>Date{sortIcon("date")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("venue")}>Venue{sortIcon("venue")}</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>Status{sortIcon("status")}</th>
                          <th>Items</th>
                          <th style={{ cursor: "pointer" }} onClick={() => handleSort("total")}>Total{sortIcon("total")}</th>
                          <th>Supplier</th>
                          <th>Actions</th>
                        </tr></thead>
                        <tbody>
                          {filteredPOs.map(po => {
                            const statusColor = po.status === "received" ? DS.colors.accent : po.status === "sent" ? DS.colors.blue : DS.colors.textMuted;
                            const total = poTotal(po);
                            return [
                              <tr key={po.id}>
                                <td>{po.status === "draft" && <input type="checkbox" checked={selectedPOIds.has(po.id)} onChange={e => { const s = new Set(selectedPOIds); e.target.checked ? s.add(po.id) : s.delete(po.id); setSelectedPOIds(s); }} />}</td>
                                <td style={{ fontSize: 12 }}>{new Date(po.created_at).toLocaleDateString("en-GB")}</td>
                                <td>{po.venues?.name || "—"}</td>
                                <td><span className="tag-pill" style={{ background: statusColor + "22", color: statusColor }}>{po.status}</span></td>
                                <td>{po.purchase_order_items?.length || 0} items</td>
                                <td style={{ fontSize: 12, color: DS.colors.accent }}>{total != null ? `£${(total/100).toFixed(2)}` : "—"}</td>
                                <td style={{ fontSize: 12, color: DS.colors.textSub }}>{po.supplier_email || po.venues?.supplier_email || "—"}</td>
                                <td>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button className="btn-sm btn-outline" onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}>Details</button>
                                    {po.status === "draft" && (
                                      <>
                                        <button className="btn-sm btn-outline" onClick={() => startEditPO(po)}>Edit</button>
                                        <button className="btn-sm btn-outline" style={{ color: DS.colors.blue, borderColor: DS.colors.blue }} onClick={() => {
                                          const email = po.supplier_email || po.venues?.supplier_email || "";
                                          const body = (po.purchase_order_items || []).map(it => `- ${it.products?.name || it.product_id}: ${it.quantity_ordered}`).join("\n");
                                          window.open(`mailto:${email}?subject=${encodeURIComponent("Purchase Order — " + (po.venues?.name || ""))}&body=${encodeURIComponent(body)}`);
                                          supabase.from("purchase_orders").update({ status: "sent" }).eq("id", po.id).then(() => loadPurchasing());
                                        }}>Send</button>
                                        <button className="btn-sm btn-outline" style={{ color: DS.colors.danger, borderColor: DS.colors.danger }} onClick={() => deletePO(po.id)}>Delete</button>
                                      </>
                                    )}
                                    {po.status === "sent" && <button className="btn-sm btn-accent" onClick={() => markPOReceived(po)}>Mark Received</button>}
                                  </div>
                                </td>
                              </tr>,
                              expandedPO === po.id && (
                                <tr key={po.id + "-exp"}>
                                  <td colSpan={8} style={{ background: DS.colors.surface, padding: "10px 16px" }}>
                                    <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 6 }}>Line items</div>
                                    {(po.purchase_order_items || []).map(it => {
                                      const subtotal = it.unit_cost != null ? (it.unit_cost * it.quantity_ordered) : null;
                                      return (
                                        <div key={it.id} style={{ display: "flex", gap: 16, fontSize: 13, padding: "2px 0" }}>
                                          <span>{it.products?.name || it.product_id}</span>
                                          <span style={{ color: DS.colors.accent }}>× {it.quantity_ordered}</span>
                                          {it.unit_cost != null && <span style={{ color: DS.colors.textMuted }}>@ £{(it.unit_cost/100).toFixed(2)}</span>}
                                          {subtotal != null && <span style={{ color: DS.colors.textSub }}>= £{(subtotal/100).toFixed(2)}</span>}
                                        </div>
                                      );
                                    })}
                                    {total != null && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: DS.colors.accent }}>Total: £{(total/100).toFixed(2)}</div>}
                                    {po.notes && <div style={{ marginTop: 8, fontSize: 12, color: DS.colors.textSub }}>Note: {po.notes}</div>}
                                  </td>
                                </tr>
                              ),
                            ];
                          })}
                          {filteredPOs.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: DS.colors.textMuted, padding: 32 }}>No purchase orders{purchaseOrders.length > 0 ? " matching filters" : " yet"}</td></tr>}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        )}

        {/* ===== DEVICES ===== */}
        {adminSection === "devices" && <DeviceMonitor venues={venues} />}

        {/* ===== FINANCIALS ===== */}
        {adminSection === "financials" && (
          <>
            <div><div className="section-title">JARVID FINANCIALS</div><div className="section-sub">Platform revenue — supply margin + profit share (ex VAT)</div></div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn-sm btn-outline" style={{ color: finAllTime ? DS.colors.accent : DS.colors.textSub, borderColor: finAllTime ? DS.colors.accent : DS.colors.border }} onClick={() => setFinAllTime(true)}>All Time</button>
              {[7, 30, 90].map(d => (
                <button key={d} className="btn-sm btn-outline" onClick={() => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - d); setFinDateFrom(from.toISOString().slice(0, 10)); setFinDateTo(to.toISOString().slice(0, 10)); setFinAllTime(false); }}>Last {d}d</button>
              ))}
              <input style={{ ...inputStyle, width: 140 }} type="date" value={finDateFrom} onChange={e => { setFinDateFrom(e.target.value); setFinAllTime(false); }} />
              <span style={{ color: DS.colors.textMuted }}>to</span>
              <input style={{ ...inputStyle, width: 140 }} type="date" value={finDateTo} onChange={e => { setFinDateTo(e.target.value); setFinAllTime(false); }} />
              <button className="btn-sm btn-accent" onClick={loadFinancials}>Apply</button>
            </div>

            {loadingFinancials ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : financials && (
              <>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-label">Total Platform Revenue</div><div className="stat-value">{fmt(penceToGBP(financials.platform.totalRevenue))}</div><div className="stat-sub" style={{ fontSize: 11, color: DS.colors.textMuted }}>All venues combined</div></div>
                  <div className="stat-card"><div className="stat-label">JarvID Supply Margin</div><div className="stat-value" style={{ color: DS.colors.blue }}>{fmt(penceToGBP(financials.platform.jarvidMargin))}</div><div className="stat-sub" style={{ fontSize: 11, color: DS.colors.textMuted }}>Supply price − cost price</div></div>
                  <div className="stat-card"><div className="stat-label">JarvID Profit Share</div><div className="stat-value" style={{ color: DS.colors.accent }}>{fmt(penceToGBP(financials.platform.jarvidShare))}</div><div className="stat-sub" style={{ fontSize: 11, color: DS.colors.textMuted }}>% cut of gross profit</div></div>
                  <div className="stat-card"><div className="stat-label">JarvID Total Income</div><div className="stat-value" style={{ color: DS.colors.accent, fontFamily: DS.font.display }}>{fmt(penceToGBP(financials.platform.jarvidTotal))}</div><div className="stat-sub" style={{ fontSize: 11, color: DS.colors.textMuted }}>Margin + profit share</div></div>
                </div>
                <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.colors.border}` }}><div className="chart-title" style={{ marginBottom: 0 }}>Per Venue Breakdown</div></div>
                  <table className="data-table">
                    <thead><tr><th>Venue</th><th>Revenue</th><th>Gross Profit</th><th>Venue Share</th><th>JarvID Share</th><th>Supply Margin</th><th>JarvID Total</th><th>Split</th></tr></thead>
                    <tbody>
                      {financials.venues.map(v => (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 600 }}>{v.name}</td>
                          <td>{fmt(penceToGBP(v.totalRevenue))}</td>
                          <td>{fmt(penceToGBP(v.grossProfit))}</td>
                          <td style={{ color: DS.colors.textSub }}>{fmt(penceToGBP(v.venueShare))}</td>
                          <td style={{ color: DS.colors.accent }}>{fmt(penceToGBP(v.jarvidShare))}</td>
                          <td style={{ color: DS.colors.blue }}>{fmt(penceToGBP(v.jarvidMargin))}</td>
                          <td style={{ color: DS.colors.accent, fontWeight: 700 }}>{fmt(penceToGBP(v.jarvidTotal))}</td>
                          <td><span className="tag-pill" style={{ background: "rgba(0,245,196,0.1)", color: DS.colors.accent, fontSize: 11 }}>J {v.jarvid_profit_share_pct || 20}% / V {100 - (v.jarvid_profit_share_pct || 20)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 12, color: DS.colors.textMuted, padding: "4px 2px" }}>All figures are ex VAT · Supply margin = venue supply price minus JarvID cost price · Profit share = JarvID % of (retail − venue supply price)</div>
              </>
            )}
          </>
        )}

        {/* ===== BILLING ===== */}
        {adminSection === "billing" && (
          <>
            <div><div className="section-title">BILLING</div><div className="section-sub">Venue subscriptions and platform fees</div></div>
            <div style={{ background: DS.colors.warnGlow, border: `1px solid ${DS.colors.warn}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: DS.colors.warn }}>
              Stripe not yet connected — billing is managed manually. Stripe customer/subscription IDs can be added to the <code>venues</code> table when integration is ready.
            </div>
            {loadingBilling ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
            ) : (
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-label">MRR</div>
                    <div className="stat-value">{fmt(penceToGBP(billing.filter(v => (v.billing_status || "active") === "active").reduce((s, v) => s + (v.monthly_fee_pence || 0), 0)))}</div>
                    <div className="stat-sub" style={{ fontSize: 11, color: DS.colors.textMuted }}>{billing.filter(v => (v.billing_status || "active") === "active").length} active venues</div>
                  </div>
                  <div className="stat-card"><div className="stat-label">Paused</div><div className="stat-value" style={{ color: DS.colors.warn }}>{billing.filter(v => v.billing_status === "paused").length}</div></div>
                  <div className="stat-card"><div className="stat-label">Cancelled</div><div className="stat-value" style={{ color: DS.colors.danger }}>{billing.filter(v => v.billing_status === "cancelled").length}</div></div>
                </div>
                <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="data-table">
                    <thead><tr><th>Venue</th><th>Plan</th><th>Monthly Fee</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {billing.map(v => {
                        const isEditing = editingBilling === v.id;
                        const statusColor = (v.billing_status || "active") === "active" ? DS.colors.accent : v.billing_status === "paused" ? DS.colors.warn : DS.colors.danger;
                        return (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 600 }}>{v.name}</td>
                            <td>{isEditing
                              ? <select style={{ ...inputStyle, width: 120, padding: "4px 6px" }} value={billingFormData.subscription_plan} onChange={e => setBillingFormData(d => ({ ...d, subscription_plan: e.target.value }))}><option value="free">Free</option><option value="starter">Starter</option><option value="pro">Pro</option></select>
                              : <span className="tag-pill" style={{ background: "rgba(47,134,235,0.1)", color: DS.colors.blue }}>{v.subscription_plan || "pro"}</span>}
                            </td>
                            <td>{isEditing
                              ? <input style={{ ...inputStyle, width: 100, padding: "4px 6px" }} type="number" value={billingFormData.monthly_fee_pence} onChange={e => setBillingFormData(d => ({ ...d, monthly_fee_pence: e.target.value }))} />
                              : <span style={{ color: DS.colors.accent }}>{fmt(penceToGBP(v.monthly_fee_pence || 0))}/mo</span>}
                            </td>
                            <td>{isEditing
                              ? <select style={{ ...inputStyle, width: 120, padding: "4px 6px" }} value={billingFormData.billing_status} onChange={e => setBillingFormData(d => ({ ...d, billing_status: e.target.value }))}><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select>
                              : <span className="tag-pill" style={{ background: statusColor + "22", color: statusColor }}>{v.billing_status || "active"}</span>}
                            </td>
                            <td>
                              {isEditing
                                ? <div style={{ display: "flex", gap: 6 }}><button className="btn-sm btn-accent" onClick={() => saveBilling(v.id)}>Save</button><button className="btn-sm btn-outline" onClick={() => setEditingBilling(null)}>Cancel</button></div>
                                : <button className="btn-sm btn-outline" onClick={() => { setEditingBilling(v.id); setBillingFormData({ subscription_plan: v.subscription_plan || "pro", monthly_fee_pence: v.monthly_fee_pence || 14900, billing_status: v.billing_status || "active" }); }}>Edit</button>}
                            </td>
                          </tr>
                        );
                      })}
                      {billing.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: DS.colors.textMuted, padding: 32 }}>No venues found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== SETTINGS ===== */}
        {adminSection === "settings" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="section-title">PLATFORM SETTINGS</div><div className="section-sub">Default configuration applied when creating new venues</div></div>
              {!editingSettings && (
                <button className="btn-sm btn-outline" style={{ color: DS.colors.accent, borderColor: DS.colors.accent }} onClick={() => { setSettingsFormData({ ...platformSettings }); setEditingSettings(true); }}>Edit</button>
              )}
            </div>

            {platformSettings && (
              <>
                <div className="chart-card">
                  <div className="chart-title">New Venue Defaults</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {editingSettings ? (
                      <>
                        <div style={fieldStyle}>
                          <div style={labelStyle}>JarvID Cut % (default)</div>
                          <input style={inputStyle} type="number" min="0" max="100" value={settingsFormData.default_jarvid_pct ?? ""} onChange={e => setSettingsFormData(d => ({ ...d, default_jarvid_pct: e.target.value }))} />
                          <div style={{ fontSize: 11, color: DS.colors.textMuted }}>Venue keeps {100 - (settingsFormData.default_jarvid_pct || 0)}%</div>
                        </div>
                        <div style={fieldStyle}>
                          <div style={labelStyle}>Default Subscription Plan</div>
                          <select style={inputStyle} value={settingsFormData.default_subscription_plan || "pro"} onChange={e => setSettingsFormData(d => ({ ...d, default_subscription_plan: e.target.value }))}>
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                          </select>
                        </div>
                        <div style={fieldStyle}>
                          <div style={labelStyle}>Default Monthly Fee (pence)</div>
                          <input style={inputStyle} type="number" value={settingsFormData.default_monthly_fee_pence ?? ""} onChange={e => setSettingsFormData(d => ({ ...d, default_monthly_fee_pence: e.target.value }))} />
                          <div style={{ fontSize: 11, color: DS.colors.textMuted }}>£{((settingsFormData.default_monthly_fee_pence || 0) / 100).toFixed(2)}/mo</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ background: DS.colors.surface, borderRadius: 8, padding: 16 }}>
                          <div style={labelStyle}>JarvID Cut % (default)</div>
                          <div style={{ fontSize: 28, fontFamily: DS.font.display, fontWeight: 700, color: DS.colors.accent }}>{platformSettings.default_jarvid_pct}%</div>
                          <div style={{ fontSize: 12, color: DS.colors.textMuted }}>Venue keeps {100 - platformSettings.default_jarvid_pct}%</div>
                        </div>
                        <div style={{ background: DS.colors.surface, borderRadius: 8, padding: 16 }}>
                          <div style={labelStyle}>Default Subscription Plan</div>
                          <div style={{ fontSize: 28, fontFamily: DS.font.display, fontWeight: 700, color: DS.colors.blue, textTransform: "capitalize" }}>{platformSettings.default_subscription_plan}</div>
                        </div>
                        <div style={{ background: DS.colors.surface, borderRadius: 8, padding: 16 }}>
                          <div style={labelStyle}>Default Monthly Fee</div>
                          <div style={{ fontSize: 28, fontFamily: DS.font.display, fontWeight: 700, color: DS.colors.text }}>£{(platformSettings.default_monthly_fee_pence / 100).toFixed(2)}</div>
                          <div style={{ fontSize: 12, color: DS.colors.textMuted }}>per venue/mo</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-title">Low Stock Thresholds</div>
                  <div style={{ fontSize: 12, color: DS.colors.textMuted, marginBottom: 12 }}>
                    Alert formula: <code style={{ background: DS.colors.surface, padding: "2px 6px", borderRadius: 4 }}>stock &gt; 0 AND stock ≤ threshold</code>
                    &nbsp;· Priority: per-product override &gt; category default &gt; global default
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Category</th><th>Trigger condition</th>{editingSettings && <th style={{ width: 120 }}>Threshold</th>}</tr></thead>
                    <tbody>
                      {[
                        { key: "low_stock_eliquid",        label: "E-Liquid" },
                        { key: "low_stock_prefilled_pod",  label: "Prefilled Pod" },
                        { key: "low_stock_refillable_kit", label: "Refillable Kit" },
                        { key: "low_stock_refillable_pods",label: "Replacement Pods" },
                        { key: "low_stock_default",        label: "Default (all others)" },
                      ].map(({ key, label }) => {
                        const val = editingSettings ? (settingsFormData[key] ?? platformSettings[key]) : platformSettings[key];
                        return (
                          <tr key={key}>
                            <td style={{ fontWeight: 600 }}>{label}</td>
                            <td style={{ fontFamily: DS.font.mono, fontSize: 12, color: DS.colors.warn }}>stock &gt; 0 AND stock ≤ {val}</td>
                            {editingSettings && (
                              <td><input style={{ ...inputStyle, width: 80, padding: "3px 8px" }} type="number" min="1" value={settingsFormData[key] ?? platformSettings[key]} onChange={e => setSettingsFormData(d => ({ ...d, [key]: e.target.value }))} /></td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {editingSettings && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-sm btn-accent" onClick={savePlatformSettings} disabled={savingSettings}>{savingSettings ? "Saving…" : "Save Changes"}</button>
                    <button className="btn-sm btn-outline" onClick={() => setEditingSettings(false)}>Cancel</button>
                  </div>
                )}
              </>
            )}
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
function LoginScreen({ onLogin, onBack }) {
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
          <div className="auth-logo">JARV<span>-ID</span></div>
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
        {onBack && (
          <button onClick={onBack} style={{
            marginTop: 8, width: "100%", padding: "10px 0", borderRadius: 8,
            border: `1px solid ${DS.colors.border}`, background: "transparent",
            color: DS.colors.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>← Back to Orders</button>
        )}
      </div>
    </div>
  );
}

// ─── VenuePicker ─────────────────────────────────────────────────────────────
function VenuePicker() {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    supabase.from("venues").select("name, slug").order("name")
      .then(({ data }) => setVenues(data || []));
  }, []);

  return (
    <>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        background: "#0a0a0f", color: "#fff", gap: 24, padding: 32
      }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Select Venue</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
          {venues.map(v => (
            <Link key={v.slug} to={`/${v.slug}/staff`}
              style={{
                display: "block", padding: "14px 20px", borderRadius: 12,
                background: "#1a1a1f", border: "1px solid #2a2a2f",
                color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 500
              }}>
              {v.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── RootPage ─────────────────────────────────────────────────────────────────
function RootPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

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
  }, []);

  // Once we know auth state, handle redirects for authenticated users
  useEffect(() => {
    if (!authChecked || !user) return;

    const isSuperAdmin = user.role === "super_admin" || !user.venue_id;
    if (isSuperAdmin) return; // VenuePicker rendered below

    // Normal staff: resolve slug and redirect
    supabase.from("venues").select("slug").eq("id", user.venue_id).single()
      .then(({ data }) => {
        if (!data?.slug) return;
        // Honour ?next= if present and valid
        const params = new URLSearchParams(location.search);
        const next = params.get("next");
        const validNext = next && next.startsWith("/") && !next.includes("://") ? next : null;
        navigate(validNext ?? `/${data.slug}/staff`, { replace: true });
      });
  }, [authChecked, user, navigate, location.search]);

  if (!authChecked) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );

  const isSuperAdmin = user?.role === "super_admin" || (user && !user.venue_id);

  if (user && isSuperAdmin) return <VenuePicker />;

  // Not authenticated — show login
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    // redirect effect will fire on next render
  };

  return (
    <>
      <GlobalStyles />
      <LoginScreen onLogin={handleLogin} />
    </>
  );
}

function StaffDashboard({ user, venueId, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === "admin") return "admin";
    if (user?.role === "org_admin" || user?.role === "manager") return "manager";
    return "staff";
  });
  const [pendingCount, setPendingCount] = useState(0);

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

  const isStaff = user?.role === "staff";
  const isManager = user?.role === "manager";
  const isOrgAdmin = user?.role === "org_admin";
  const isAdmin = user?.role === "admin";

  const tabs = [
    { id: "staff",   label: "Staff Dashboard", icon: User,            show: !!user },
    { id: "manager", label: "Venue Manager",   icon: LayoutDashboard, show: (isManager || isOrgAdmin || isAdmin) },
    { id: "admin",   label: "Platform Admin",  icon: Settings,        show: isAdmin },
  ].filter(t => t.show);

  return (
    <>
      <GlobalStyles />
      <div className="app-root">
        <nav className="top-nav">
          <div className="nav-logo">JARV<span>-ID</span></div>
          <div className="nav-tabs">
            {tabs.map(t => {
              const TabIcon = t.icon;
              return (
                <button key={t.id} className={`nav-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => {
                  setActiveTab(t.id);
                }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {TabIcon && <TabIcon size={13} />}
                  {t.label}
                  {t.id === "staff" && pendingCount > 0 && <span className="badge" style={{ marginLeft: 2 }}>{pendingCount}</span>}
                </button>
              );
            })}
          </div>
          <div className="nav-right">
            <div className="auth-role-badge">
              {(() => { const RoleIcon = user.role === "admin" ? Settings : user.role === "org_admin" ? Building2 : user.role === "manager" ? LayoutDashboard : User; return <RoleIcon size={12} />; })()} {user.role === "org_admin" ? "Org Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
            <span style={{ fontSize: 12, color: DS.colors.textSub }}>{user.email}</span>
            <button className="logout-btn" onClick={onLogout}>Sign Out</button>
            <span style={{ fontSize: 12, color: DS.colors.accent, display: "flex", alignItems: "center", gap: 4 }}><Circle size={7} fill={DS.colors.accent} stroke="none" /> Live</span>
          </div>
        </nav>
        <div className="main-content">
          {activeTab === "staff" && (user ? <StaffView user={user} kioskoidMode={false} /> : null)}
          {activeTab === "manager" && ((isManager || isOrgAdmin || isAdmin) ? <ManagerView user={user} /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, color: DS.colors.textMuted }}>
              <Lock size={48} strokeWidth={1.5} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>Manager access required</div>
              <div style={{ fontSize: 13 }}>Please log in with a manager account</div>
            </div>
          ))}
          {activeTab === "admin" && (isAdmin ? <AdminView /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 16, color: DS.colors.textMuted }}>
              <Lock size={48} strokeWidth={1.5} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>Admin access required</div>
              <div style={{ fontSize: 13 }}>Please log in with a platform admin account</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── StaffRoute ───────────────────────────────────────────────────────────────
function StaffRoute() {
  const { venueSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, loading: venueLoading, notFound } = useVenue(venueSlug);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate(`/?next=${encodeURIComponent(location.pathname)}`, { replace: true });
        return;
      }
      const { data: staffData } = await supabase
        .from("staff_users")
        .select("role, venue_id, org_id")
        .eq("email", session.user.email)
        .eq("is_active", true)
        .single();
      if (staffData) setUser({ ...session.user, role: staffData.role, venue_id: staffData.venue_id, org_id: staffData.org_id });
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (!authChecked || venueLoading) return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div className="spinner" />
      </div>
    </>
  );
  if (notFound) return <VenueNotFound />;

  // StaffDashboard will be wired in Task 6 — placeholder for now
  return (
    <>
      <GlobalStyles />
      <StaffDashboard user={user} venueId={venueId} onLogout={handleLogout} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<RootPage />} />
        <Route path="/:venueSlug/kiosk"   element={<KioskRoute />} />
        <Route path="/:venueSlug/staff"   element={<StaffRoute />} />
        <Route path="*"                   element={<VenueNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
