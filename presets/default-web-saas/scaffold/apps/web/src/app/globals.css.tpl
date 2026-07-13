:root {
  color-scheme: light;
  background: #eef4f1;
  color: #1f2933;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(circle at 12% 18%, rgba(20, 184, 166, 0.16), transparent 30%),
    linear-gradient(135deg, #f8fbfa 0%, #eef4f1 100%);
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  min-height: 100vh;
}

.app-sidebar {
  background: #123c36 !important;
  padding: 24px 16px;
}

.brand-block {
  margin: 0 0 28px;
}

.brand-kicker.ant-typography {
  color: #99f6e4;
  display: block;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand.ant-typography {
  color: #ffffff;
  margin: 4px 0 0;
  text-wrap: balance;
}

.nav-list {
  display: grid;
  gap: 6px;
}

.nav-list a {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #d7f7ef;
  border-radius: 8px;
  padding: 10px 12px;
  transition-property: background, color, transform;
  transition-duration: 160ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

.nav-list a[aria-current="page"],
.nav-list a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
}

.nav-list a:active {
  transform: scale(0.96);
}

.app-header {
  min-height: 68px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.08), 0 14px 30px rgba(15, 23, 42, 0.06);
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.back-button {
  min-width: 96px;
}

.app-content {
  width: min(1180px, 100%);
  padding: 32px 24px;
}

.page-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}

.eyebrow.ant-typography {
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-heading h1.ant-typography {
  margin: 6px 0 10px;
  max-width: 720px;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.04;
  text-wrap: balance;
}

.page-heading .ant-typography {
  text-wrap: pretty;
}

.status-alert {
  box-shadow: 0 18px 45px rgba(15, 118, 110, 0.12);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.metric-card,
.table-card {
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08);
}

.metric-card .ant-card-body {
  min-height: 118px;
}

.metric-card h2.ant-typography {
  margin: 4px 0 0;
  font-variant-numeric: tabular-nums;
}

.metric-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 20px;
}

.metric-icon.success {
  color: #047857;
  background: #d1fae5;
}

.metric-icon.warning {
  color: #b45309;
  background: #fef3c7;
}

.metric-icon.neutral {
  color: #0f766e;
  background: #ccfbf1;
}

.ant-btn {
  min-height: 40px;
}

.ant-btn:active {
  transform: scale(0.96);
}

@media (max-width: 900px) {
  .page-heading,
  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .app-header {
    align-items: stretch;
    flex-direction: column;
    padding: 12px 16px;
  }

  .app-header .ant-space {
    width: 100%;
    justify-content: space-between;
  }

  .app-content {
    padding: 20px 16px;
  }
}
