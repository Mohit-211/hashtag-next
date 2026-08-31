// ─────────────────────────────────────────────────────────────────────────
// Styles — driven entirely by the shared design-system tokens defined in
// globals.css (@theme). No hardcoded brand colors: swap the tokens there and
// this whole view re-themes itself.
// ─────────────────────────────────────────────────────────────────────────
export const categoriesViewStyles = `
  *, *::before, *::after { box-sizing: border-box; }
  .cat-root {
    min-height: 100vh;
    font-family: var(--font-body);
    background: var(--color-background);
    color: var(--color-foreground);
  }
  /* ═══════════════════════════ HEADER NAV ═══════════════════════════ */
  .cat-nav {
    position: sticky;
    top: 0;
    z-index: 220;
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
  }
  .cat-nav-row { display: flex; align-items: stretch; height: 60px; }
  .cat-tabs-scroll {
    display: flex; align-items: stretch; overflow-x: auto; scrollbar-width: none;
    flex: 1; min-width: 0;
  }
  .cat-tabs-scroll::-webkit-scrollbar { display: none; }
  .cat-tab-wrap { position: relative; flex-shrink: 0; display: flex; align-items: stretch; }
  .cat-tab {
    display: inline-flex; align-items: center; gap: 5px; padding: 0 18px;
    font-size: 13.5px; font-weight: 500; color: var(--color-muted-foreground);
    white-space: nowrap; cursor: pointer; border-bottom: 2px solid transparent;
    transition: color .18s, border-color .18s; letter-spacing: -0.01em;
  }
  .cat-tab.active { color: var(--color-foreground); font-weight: 700; border-bottom-color: var(--color-primary); }
  .cat-tab-chevron { transition: transform .2s; color: currentColor; opacity: 0.55; }
  .cat-tab-chevron.open { transform: rotate(180deg); opacity: 1; }
  /* ── horizontal sub-category dropdown, shown under a hovered tab ── */
  .cat-subnav {
    position: fixed; left: 0; width: 100%; background: white;
    border-bottom: 1px solid var(--color-border); z-index: 219;
    opacity: 0; visibility: hidden; transform: translateY(-6px);
    transition: opacity .16s ease, transform .16s ease, visibility .16s;
    pointer-events: none;
  }
  .cat-subnav.open { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
  .cat-subnav-inner {
    display: flex; align-items: center; gap: 6px; padding: 10px 24px;
    overflow-x: auto; scrollbar-width: none;
  }
  .cat-subnav-inner::-webkit-scrollbar { display: none; }
  .cat-subnav-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--color-muted-foreground); white-space: nowrap; margin-right: 4px; flex-shrink: 0;
  }
  .cat-subnav-item {
    display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
    font-size: 13px; font-family: var(--font-body); font-weight: 500;
    color: var(--color-foreground); cursor: pointer; white-space: nowrap;
    transition: background .13s, color .13s, border-color .13s;
    border: 1.5px solid var(--color-border); background: var(--color-background);
    border-radius: 999px; letter-spacing: -0.01em; flex-shrink: 0;
  }
  .cat-subnav-item:hover { border-color: var(--color-ring); }
  .cat-subnav-item.active {
    color: var(--color-primary-foreground); font-weight: 600;
    background: var(--color-primary); border-color: var(--color-primary);
  }
  /* ── brand mega-menu tab ── */
  .brand-tab-wrap { position: relative; flex-shrink: 0; }
  .brand-tab-btn {
    display: flex; align-items: center; gap: 6px; height: 60px; padding: 0 18px;
    font-family: var(--font-body); font-size: 13.5px; font-weight: 500;
    color: var(--color-muted-foreground); background: none; border: none;
    border-bottom: 2px solid transparent; cursor: pointer; transition: color .18s;
    white-space: nowrap; letter-spacing: -0.01em;
  }
  .brand-tab-btn.active { color: var(--color-foreground); font-weight: 700; border-bottom-color: var(--color-primary); }
  .brand-tab-count {
    font-size: 10.5px; font-weight: 700; color: var(--color-primary-foreground);
    background: var(--color-primary); border-radius: 999px; padding: 1px 6px; min-width: 16px; text-align: center;
  }
  .brand-chevron { transition: transform .22s cubic-bezier(.4,0,.2,1); color: currentColor; }
  .brand-chevron.open { transform: rotate(180deg); }
  .brand-mega {
    position: fixed; left: 0; width: 100%; background: var(--color-card);
    border-bottom: 1px solid var(--color-border); box-shadow: 0 12px 40px -8px rgba(0,0,0,0.14);
    opacity: 0; visibility: hidden; transform: translateY(-4px);
    transition: opacity .2s ease, transform .2s ease, visibility .2s; z-index: 219; pointer-events: none;
  }
  .brand-mega.open { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
  .brand-mega-inner { max-width: 1400px; margin: 0 auto; padding: 18px 26px 22px; }
  .brand-mega-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .brand-mega-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-muted-foreground); }
  .brand-mega-count { font-size: 12px; color: var(--color-muted-foreground); }
  .brand-mega-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; padding: 5px; max-height: 320px; overflow-y: auto; }
  .brand-card {
    padding: 8px 6px; border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
    background: var(--color-background); cursor: pointer; text-align: center;
    transition: border-color .18s, background .18s, transform .18s, box-shadow .18s; position: relative;
  }
  .brand-card:hover { border-color: var(--color-ring); transform: translateY(-1px); }
  .brand-card.selected { border-color: var(--color-primary); box-shadow: 0 3px 10px rgba(0,0,0,0.10); }
  .brand-card-check {
    position: absolute; top: 4px; right: 4px; width: 15px; height: 15px; border-radius: 50%;
    background: var(--color-primary); color: var(--color-primary-foreground);
    display: flex; align-items: center; justify-content: center;
  }
  .brand-logo-wrap {
    width: 32px; height: 32px; border-radius: 7px; background: var(--color-background);
    border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center;
    margin: 0 auto 6px; overflow: hidden; position: relative;
  }
  .brand-initials { font-size: 10px; font-weight: 700; color: var(--color-muted-foreground); letter-spacing: -0.02em; }
  .brand-card-name {
    font-size: 10px; font-weight: 500; color: var(--color-foreground); line-height: 1.25;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }
  .brand-mega-shimmer {
    height: 68px; border-radius: var(--radius-md);
    background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-border) 50%, var(--color-secondary) 75%);
    background-size: 800px 100%; animation: shimmer 1.5s infinite;
  }
  /* ── header search ── */
  .cat-header-search-wrap {
    display: flex; align-items: center; padding: 0 16px; border-left: 1px solid var(--color-border); flex-shrink: 0;
  }
  .cat-header-search-inner { position: relative; display: flex; align-items: center; }
  .cat-header-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-muted-foreground); display: flex; pointer-events: none; }
  .cat-header-search-input {
    height: 34px; width: 180px; background: var(--color-secondary); border: 1px solid transparent;
    border-radius: var(--radius-md); padding: 0 32px 0 32px; font-family: var(--font-body);
    font-size: 13px; color: var(--color-foreground); outline: none;
    transition: border-color .18s, width .2s, background .18s;
  }
  .cat-header-search-input:focus { border-color: var(--color-ring); background: var(--color-background); width: 220px; }
  .cat-header-search-input::placeholder { color: var(--color-muted-foreground); }
  .cat-header-search-clear {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none;
    cursor: pointer; color: var(--color-muted-foreground); display: flex; align-items: center; padding: 0; line-height: 1; transition: color .15s;
  }
  .cat-header-search-clear:hover { color: var(--color-foreground); }
  /* ═══════════════════════════ SIDEBAR + MAIN ═══════════════════════════ */
  .cat-shell { display: flex; align-items: flex-start; }
  .cat-sidebar {
    width: 272px; flex-shrink: 0; position: sticky; top: 60px; height: calc(100vh - 60px);
    overflow-y: auto; background: var(--color-card); border-right: 1px solid var(--color-border);
    padding: 22px 18px 40px; z-index: 210;
  }
  .cat-main { flex: 1; min-width: 0; }
  .sidebar-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .sidebar-title { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--color-foreground); letter-spacing: -0.02em; }
  .sidebar-close-btn {
    display: none; align-items: center; justify-content: center; width: 32px; height: 32px;
    border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-background);
    color: var(--color-foreground); cursor: pointer;
  }
  .sidebar-reset-btn {
    display: flex; align-items: center; gap: 6px; padding: 7px 12px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-background);
    font-size: 12.5px; font-weight: 600; color: var(--color-foreground); cursor: pointer; transition: all .15s;
  }
  .sidebar-reset-btn:hover { border-color: var(--color-ring); background: var(--color-secondary); }
  .sidebar-reset-btn:focus-visible, .sidebar-close-btn:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .facet-section { border-bottom: 1px solid var(--color-border); }
  .facet-header {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 13px 4px; cursor: pointer; user-select: none; background: none; border: none;
    width: 100%; text-align: left; font-family: var(--font-body); color: inherit;
  }
  .facet-header:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; border-radius: var(--radius-sm); }
  .facet-header-left { display: flex; align-items: center; gap: 8px; }
  .facet-title { font-size: 14px; font-weight: 600; color: var(--color-foreground); }
  .facet-count-badge {
    font-size: 11px; font-weight: 700; color: var(--color-accent-foreground); background: var(--color-primary);
    border-radius: 999px; padding: 1px 7px; min-width: 18px; text-align: center;
  }
  .facet-chevron { color: var(--color-muted-foreground); transition: transform .18s; flex-shrink: 0; }
  .facet-chevron.open { transform: rotate(180deg); }
  .facet-body { padding: 2px 2px 14px; display: flex; flex-direction: column; gap: 1px; }
  .check-row {
    display: flex; align-items: center; justify-content: space-between; gap: 9px;
    padding: 8px 8px; border-radius: var(--radius-md); cursor: pointer; transition: background .15s;
    font-size: 13.5px; color: var(--color-foreground);
  }
  .check-row:hover { background: var(--color-secondary); }
  .check-row-left { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .check-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .check-row-count { font-size: 11.5px; color: var(--color-muted-foreground); flex-shrink: 0; }
  .checkbox-box {
    width: 17px; height: 17px; border-radius: 4px; border: 1.5px solid var(--color-input);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    background: var(--color-background); transition: background .15s, border-color .15s; color: var(--color-primary-foreground);
  }
  .checkbox-box.checked { background: var(--color-primary); border-color: var(--color-primary); }
  .facet-chip-row { display: flex; flex-wrap: wrap; gap: 7px; padding: 4px 2px 12px; }
  .facet-chip {
    padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 500;
    border: 1.5px solid var(--color-border); color: var(--color-foreground); cursor: pointer; transition: all .15s; background: var(--color-background);
  }
  .facet-chip:hover { border-color: var(--color-ring); }
  .facet-chip:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .facet-chip.checked { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-primary-foreground); }
  .color-swatch-row { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 2px 14px; }
  .color-swatch {
    width: 28px; height: 28px; border-radius: 50%; cursor: pointer; position: relative;
    border: 1.5px solid var(--color-border); display: flex; align-items: center; justify-content: center;
    transition: transform .1s, border-color .15s;
  }
  .color-swatch:hover { transform: scale(1.08); }
  .color-swatch:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .color-swatch.checked { border-color: var(--color-foreground); box-shadow: 0 0 0 2px var(--color-background), 0 0 0 3px var(--color-foreground); }
  .color-swatch-check { color: var(--color-primary-foreground); mix-blend-mode: difference; filter: invert(1) grayscale(1) contrast(9); }
  .price-range-wrap { padding: 6px 4px 14px; }
  .price-range-values { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; font-weight: 600; color: var(--color-foreground); }
  .price-slider-track { position: relative; height: 4px; background: var(--color-border); border-radius: 999px; margin: 18px 4px 6px; }
  .price-slider-range { position: absolute; height: 4px; background: var(--color-primary); border-radius: 999px; }
  .price-slider-input { position: absolute; top: -8px; left: 0; width: 100%; height: 20px; margin: 0; background: transparent; appearance: none; pointer-events: none; }
  .price-slider-input::-webkit-slider-thumb { appearance: none; pointer-events: auto; width: 18px; height: 18px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--color-card); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer; }
  .price-slider-input::-moz-range-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 50%; background: var(--color-primary); border: 2px solid var(--color-card); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer; }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .shimmer-row {
    height: 30px; border-radius: var(--radius-md); margin-bottom: 4px;
    background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-border) 50%, var(--color-secondary) 75%);
    background-size: 800px 100%; animation: shimmer 1.5s infinite;
  }
  .sidebar-toggle-btn {
    display: none; align-items: center; gap: 6px; padding: 8px 14px; background: var(--color-background);
    border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: var(--font-body);
    font-size: 13px; font-weight: 500; color: var(--color-foreground); cursor: pointer; flex-shrink: 0;
  }
  .sidebar-backdrop { display: none; }
  .cat-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 28px; flex-wrap: wrap; }
  .cat-topbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cat-heading { margin: 0; font-family: var(--font-heading); font-size: 25px; font-weight: 700; color: var(--color-foreground); letter-spacing: -0.02em; line-height: 1; }
  .cat-count { font-size: 13px; color: var(--color-muted-foreground); font-weight: 400; }
  .filter-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 6px 6px 6px 14px;
    background: var(--color-background); color: var(--color-foreground); border: 1.5px solid var(--color-primary);
    border-radius: 999px; font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
  }
  .filter-pill-remove {
    display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;
    background: var(--color-primary); border-radius: 50%; border: none; cursor: pointer;
    color: var(--color-primary-foreground); padding: 0; transition: background .15s, opacity .15s;
  }
  .filter-pill-remove:hover { opacity: 0.8; }
  .clear-all-link {
    font-size: 12.5px; font-weight: 600; color: var(--color-muted-foreground); background: none; border: none;
    cursor: pointer; text-decoration: underline; padding: 4px 2px;
  }
  .clear-all-link:hover { color: var(--color-foreground); }
  .cat-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .sort-wrap {
    position: relative; display: flex; align-items: center; gap: 8px; background: var(--color-background);
    border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 0 14px; height: 42px; cursor: pointer;
  }
  .sort-wrap:hover { border-color: var(--color-ring); }
  .sort-icon { color: var(--color-muted-foreground); display: flex; flex-shrink: 0; }
  .sort-label { font-size: 13px; color: var(--color-muted-foreground); white-space: nowrap; font-weight: 400; }
  .sort-current { font-size: 13.5px; font-weight: 700; color: var(--color-foreground); white-space: nowrap; }
  .sort-select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: none; appearance: none; padding:10px }
  .sort-caret { color: var(--color-muted-foreground); display: flex; flex-shrink: 0; }
  .products-area { padding: 0 28px 40px; }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-foreground); border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .products-load-more { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 32px 0; color: var(--color-muted-foreground); font-size: 13.5px; font-family: var(--font-body); }
  .full-page-loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--color-background); }
  .grid-loading { display: flex; align-items: center; justify-content: center; padding: 100px 0; }
  .cat-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; border-radius: var(--radius-md); transition: background .15s; }
  .cat-row:hover { background: var(--color-secondary); }
  .cat-row-main {
    flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 4px 10px 12px; cursor: pointer; background: none; border: none; text-align: left;
    font-size: 13.5px; color: var(--color-foreground); font-family: var(--font-body);
  }
  .cat-row-main:focus-visible { outline: 2px solid var(--color-ring); outline-offset: -2px; border-radius: var(--radius-sm); }
  .cat-row.active .cat-row-main { color: var(--color-foreground); font-weight: 700; }
  .cat-row-expand {
    display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex-shrink: 0;
    background: none; border: none; cursor: pointer; color: var(--color-muted-foreground); border-radius: var(--radius-sm); margin-right: 6px;
  }
  .cat-row-expand:hover { background: var(--color-border); color: var(--color-foreground); }
  .cat-row-expand:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .cat-subrow-list { display: flex; flex-direction: column; gap: 1px; padding: 2px 0 6px 14px; border-left: 2px solid var(--color-border); margin-left: 15px; }
  .cat-subrow-group-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--color-muted-foreground); padding: 10px 8px 4px;
  }
  .usecase-row .usecase-check-row { flex: 1; min-width: 0; }
  .usecase-check-row { margin-top: 4px; }
  .usecase-check-row-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--color-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .usecase-children {
    display: flex; flex-direction: column; gap: 1px;
    padding: 2px 0 8px 12px; margin-left: 8px; border-left: 2px solid var(--color-border);
  }
  .btn-ghost { padding: 9px 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-background); font-size: 13px; font-weight: 600; color: var(--color-foreground); cursor: pointer; }
  .btn-ghost:hover { background: var(--color-secondary); }
  .btn-dark { padding: 9px 20px; border-radius: var(--radius-md); border: none; background: var(--color-primary); font-size: 13px; font-weight: 700; color: var(--color-primary-foreground); cursor: pointer; }
  .btn-dark:hover { filter: brightness(0.94); }
  @media (max-width: 768px) {
    .cat-tabs-scroll { padding-right: 4px; }
    .cat-header-search-input { width: 120px; }
    .cat-header-search-input:focus { width: 150px; }
    .brand-mega-inner { padding: 14px 16px 18px; }
    .brand-mega-grid { grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }
    .cat-subnav-inner { padding: 8px 14px; }
    .cat-shell { display: block; }
    .cat-sidebar {
      position: fixed; top: 0; left: 0; height: 100vh; width: 88%; max-width: 340px; z-index: 300;
      transform: translateX(-100%); transition: transform .22s ease; box-shadow: 12px 0 30px rgba(0,0,0,0.10);
    }
    .cat-sidebar.open { transform: translateX(0); }
    .sidebar-close-btn { display: inline-flex; }
    .sidebar-toggle-btn { display: inline-flex; }
    .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 290; }
    .cat-topbar { padding: 14px 16px; flex-direction: column; align-items: flex-start; gap: 12px; }
    .cat-topbar-left { width: 100%; }
    .cat-topbar-right { width: 100%; flex-wrap: wrap; gap: 8px; }
    .sort-wrap { flex: 1; min-width: 120px; }
    .cat-heading { font-size: 20px; }
    .products-area { padding: 0 16px 32px; }
  }
  /* ═══════════════════════════ USE CASE PICKER (gate) ═══════════════════════════ */
  @keyframes ucgateRise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ucgate-root {
    position: relative;
    min-height: 100vh;
    background: var(--color-background);
    font-family: var(--font-body);
    overflow: hidden;
  }
  .ucgate-root::before {
    content: "";
    position: absolute;
    top: -220px;
    left: 50%;
    width: 900px;
    height: 560px;
    transform: translateX(-50%);
    background: radial-gradient(closest-side, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent 72%);
    pointer-events: none;
    z-index: 0;
  }
  .ucgate-header, .ucgate-body { position: relative; z-index: 1; }
  .ucgate-header {  margin: 0 auto;  text-align: center; }
  .ucgate-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--color-primary); margin-bottom: 14px;
  }
  .ucgate-eyebrow::before {
    content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
  .ucgate-title {
    font-family: var(--font-heading); font-size: clamp(28px, 4vw, 38px); font-weight: 800;
    color: var(--color-foreground); letter-spacing: -0.025em; margin: 0 0 12px; line-height: 1.1;
  }
  .ucgate-subtitle { font-size: 15.5px; line-height: 1.6; color: var(--color-muted-foreground); max-width: 560px; margin: 0 auto; }
  .ucgate-body { max-width: 1200px; margin: 0 auto; padding: 40px 24px 88px; }
  .ucgate-back-row { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .ucgate-back-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-card);
    font-size: 13px; font-weight: 600; color: var(--color-foreground); cursor: pointer;
    transition: border-color .18s ease, background .18s ease, transform .18s ease, box-shadow .18s ease;
  }
  .ucgate-back-btn:hover {
    border-color: var(--color-primary); background: var(--color-secondary);
    transform: translateY(-1px); box-shadow: 0 4px 12px -6px color-mix(in srgb, var(--color-primary) 35%, transparent);
  }
  .ucgate-back-btn:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .ucgate-skip-link {
    font-size: 13px; font-weight: 600; color: var(--color-muted-foreground); cursor: pointer;
    text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 4px;
    margin-left: auto; transition: color .16s ease, text-decoration-color .16s ease;
  }
  .ucgate-skip-link:hover { color: var(--color-foreground); text-decoration-color: currentColor; }
  .ucgate-skip-link:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 3px; border-radius: 2px; }

  /* ── shared image treatment for industry + use-case cards ── */
  .ucgate-card-image-wrap {
    position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 12px;
    overflow: hidden; margin-bottom: 16px; background: var(--color-secondary); flex-shrink: 0;
  }
  .ucgate-card-image { object-fit: inherit; transition: transform .4s ease; }
  .ucgate-industry-card:hover .ucgate-card-image,
  .ucgate-usecase-row:hover .ucgate-card-image { transform: scale(1.05); }

  .ucgate-industry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 18px; }
  .ucgate-industry-card {
    position: relative; text-align: left; padding: 16px 20px 24px; border: 1.5px solid var(--color-border);
    border-radius: 18px; background: var(--color-card); cursor: pointer; overflow: hidden;
    display: flex; flex-direction: column;
    animation: ucgateRise .45s ease both;
    animation-delay: calc(var(--stagger, 0) * 45ms);
    transition: border-color .22s ease, transform .22s ease, box-shadow .22s ease;
  }
  .ucgate-industry-card::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 45%, transparent), transparent 60%);
    opacity: 0; transition: opacity .22s ease;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  .ucgate-industry-card:hover {
    border-color: var(--color-primary); transform: translateY(-5px);
    box-shadow: 0 20px 36px -18px color-mix(in srgb, var(--color-foreground) 22%, transparent),
                0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
  .ucgate-industry-card:hover::after { opacity: 1; }
  .ucgate-industry-card:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .ucgate-industry-arrow {
    position: absolute; top: 32px; right: 34px; z-index: 2; color: var(--color-card);
    background: color-mix(in srgb, var(--color-foreground) 55%, transparent);
    border-radius: 999px; padding: 5px;
    opacity: 0; transform: translate(-4px, 4px); transition: opacity .2s ease, transform .2s ease, color .2s ease, background .2s ease;
  }
  .ucgate-industry-card:hover .ucgate-industry-arrow {
    opacity: 1; transform: translate(0, 0); color: var(--color-primary-foreground); background: var(--color-primary);
  }
  .ucgate-industry-index {
    position: absolute; top: 32px; left: 36px; z-index: 2;
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.02em; color: var(--color-primary-foreground);
    border: 1.5px solid rgba(255,255,255,0.6);
    background: color-mix(in srgb, var(--color-foreground) 55%, transparent);
    backdrop-filter: blur(2px);
    transition: background .22s ease, color .22s ease, border-color .22s ease;
  }
  .ucgate-industry-card:hover .ucgate-industry-index {
    background: var(--color-primary); border-color: var(--color-primary);
  }
  .ucgate-industry-card:hover .ucgate-industry-index {
    background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary);
  }
  .ucgate-industry-name {
    font-family: var(--font-heading); font-size: 18.5px; font-weight: 700; color: var(--color-foreground);
    margin: 0 0 12px; letter-spacing: -0.01em;
  }
  .ucgate-industry-usecases { display: flex; flex-wrap: wrap; gap: 7px; }
  .ucgate-usecase-chip {
    font-size: 11.5px; font-weight: 500; color: var(--color-muted-foreground);
    background: var(--color-secondary); border: 1px solid transparent; border-radius: 999px; padding: 5px 11px;
    transition: border-color .18s ease;
  }
  .ucgate-industry-card:hover .ucgate-usecase-chip { border-color: var(--color-border); }

  /* ── use-case selection, clubbed by industry: each industry gets its own
     labeled section so use cases from the same industry group together ── */
  .ucgate-industry-group { margin-bottom: 40px; text-align: left; }
  .ucgate-industry-group:last-child { margin-bottom: 0; }
  .ucgate-industry-group-title {
    font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-foreground);
    letter-spacing: -0.015em; margin: 0 0 16px;
  }
  .ucgate-usecase-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
  .ucgate-usecase-row {
    position: relative; text-align: left; padding: 16px 20px 24px; border: 1.5px solid var(--color-border);
    border-radius: 18px; background: var(--color-card); cursor: pointer; overflow: hidden;
    display: flex; flex-direction: column; align-items: flex-start;
    animation: ucgateRise .45s ease both;
    animation-delay: calc(var(--stagger, 0) * 45ms);
    transition: border-color .22s ease, transform .22s ease, box-shadow .22s ease;
  }
  .ucgate-usecase-row::after {
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 45%, transparent), transparent 60%);
    opacity: 0; transition: opacity .22s ease;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  .ucgate-usecase-row:hover {
    border-color: var(--color-primary); transform: translateY(-5px);
    box-shadow: 0 20px 36px -18px color-mix(in srgb, var(--color-foreground) 22%, transparent),
                0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
  .ucgate-usecase-row:hover::after { opacity: 1; }
  .ucgate-usecase-row:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .ucgate-usecase-row-arrow {
    position: absolute; top: 32px; right: 34px; z-index: 2; flex-shrink: 0; color: var(--color-card);
    background: color-mix(in srgb, var(--color-foreground) 55%, transparent);
    border-radius: 999px; padding: 5px;
    opacity: 0; transform: translate(-4px, 4px) rotate(-90deg);
    transition: opacity .2s ease, transform .2s ease, color .2s ease, background .2s ease;
  }
  .ucgate-usecase-row:hover .ucgate-usecase-row-arrow {
    opacity: 1; transform: translate(0, 0) rotate(-90deg); color: var(--color-primary-foreground); background: var(--color-primary);
  }
  .ucgate-usecase-row-title {
    font-family: var(--font-heading); font-size: 18.5px; font-weight: 700; color: var(--color-foreground);
    margin: 0 0 12px; letter-spacing: -0.01em; text-align: left; padding-right: 24px;
  }
  .ucgate-usecase-industry-tag {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--color-primary); margin-bottom: 8px;
  }
  .ucgate-usecase-row-cats { display: flex; flex-wrap: wrap; gap: 7px; }
  .ucgate-usecase-tag {
    font-size: 11.5px; font-weight: 500; color: var(--color-muted-foreground);
    background: var(--color-secondary); border: 1px solid transparent; border-radius: 999px; padding: 5px 11px;
    transition: border-color .18s ease;
  }
  .ucgate-usecase-row:hover .ucgate-usecase-tag { border-color: var(--color-border); }
  .ucgate-usecase-tag-more {
    color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 12%, transparent); font-weight: 700;
  }

  .ucgate-skeleton-card {
    height: 148px; border-radius: 18px; border: 1.5px solid var(--color-border);
    background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-border) 50%, var(--color-secondary) 75%);
    background-size: 800px 100%; animation: shimmer 1.5s infinite;
  }

  /* ── modal shown after picking a use case, to narrow down to specific items ── */
  .ucgate-modal-backdrop {
    position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
    padding: 20px; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  }
  .ucgate-modal-panel {
    width: 100%; max-width: 440px; max-height: 82vh; display: flex; flex-direction: column;
    background: var(--color-background, #fff); border-radius: 18px; overflow: hidden;
    box-shadow: 0 12px 48px rgba(0,0,0,0.22);
  }
  .ucgate-modal-header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    padding: 20px 20px 16px; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
  }
  .ucgate-modal-eyebrow {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--color-primary); margin-bottom: 4px;
  }
  .ucgate-modal-title { font-size: 19px; font-weight: 700; color: var(--color-foreground); line-height: 1.25; }
  .ucgate-modal-close {
    display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0;
    border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted-foreground);
    transition: background .15s ease, color .15s ease;
  }
  .ucgate-modal-close:hover { background: var(--color-secondary); color: var(--color-foreground); }
  .ucgate-modal-body { padding: 14px 20px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
  .ucgate-modal-empty { font-size: 13.5px; color: var(--color-muted-foreground); padding: 12px 0; }
  .ucgate-modal-selectall { padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid var(--color-border); font-weight: 600; }
  .ucgate-modal-list { display: flex; flex-direction: column; gap: 2px; }
  .ucgate-modal-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 14px 20px; border-top: 1px solid var(--color-border); flex-shrink: 0;
  }
  .ucgate-modal-cancel {
    font-size: 13.5px; font-weight: 500; color: var(--color-muted-foreground); padding: 9px 14px; border-radius: 10px;
    transition: color .15s ease, background .15s ease;
  }
  .ucgate-modal-cancel:hover { color: var(--color-foreground); background: var(--color-secondary); }
  .ucgate-modal-confirm {
    font-size: 13.5px; font-weight: 600; color: var(--color-primary-foreground, #fff); background: var(--color-primary);
    padding: 10px 18px; border-radius: 10px; transition: opacity .15s ease;
  }
  .ucgate-modal-confirm:hover { opacity: 0.9; }
  .ucgate-modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (prefers-reduced-motion: reduce) {
    .ucgate-industry-card, .ucgate-usecase-row, .ucgate-back-btn, .ucgate-skip-link,
    .ucgate-industry-arrow, .ucgate-usecase-row-arrow, .ucgate-industry-index, .ucgate-skeleton-card {
      animation: none !important; transition: none !important;
    }
    .ucgate-industry-card:hover, .ucgate-usecase-row:hover, .ucgate-back-btn:hover { transform: none !important; }
  }

  @media (max-width: 640px) {
    .ucgate-header { padding: 44px 18px 8px; }
    .ucgate-body { padding: 28px 18px 64px; }
    .ucgate-industry-grid { grid-template-columns: 1fr; }
    .ucgate-usecase-list { grid-template-columns: 1fr; }
  }
  /* ── banner shown above the product grid when a use case is active ── */
  .ucbanner {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    padding: 12px 24px; border-bottom: 1px solid var(--color-border);
  }
  .ucbanner-back-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-card);
    font-size: 12.5px; font-weight: 600; color: var(--color-foreground); cursor: pointer; transition: all .15s; flex-shrink: 0;
  }
  .ucbanner-back-btn:hover { border-color: var(--color-ring); }
  .ucbanner-label { font-size: 13px; color: var(--color-foreground); }
  .ucbanner-label strong { font-weight: 700; }
`;