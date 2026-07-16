// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
// synthetic fixture — no sample data available from Action Planner
const SAMPLE_DATA = [
  {
    name: 'HDFC Bank — Andheri West',
    address: 'Shop 4, Link Road, Andheri West, Mumbai 400058',
    phone: '+91 22 6160 6161',
    hours: 'Mon–Sat 9:30 AM–4:30 PM',
  },
  {
    name: 'HDFC Bank — Bandra Kurla Complex',
    address: 'Ground Floor, G Block, BKC, Mumbai 400051',
    phone: '+91 22 3395 8000',
    hours: 'Mon–Fri 9:30 AM–5:00 PM',
  },
];

// Brand palette from BuildWidgetRequest.
// getThemedCardBg() darkens palette[0] to luminance <= 0.12 so white text has WCAG AA contrast.
const PALETTE = ['#004c8f', '#e7131a'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

function makePin(fg) {
  const pin = document.createElement('div');
  pin.className = 'fb-pin';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', fg);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');
  const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c1.setAttribute('cx', '12');
  c1.setAttribute('cy', '10');
  c1.setAttribute('r', '3');
  svg.appendChild(p1);
  svg.appendChild(c1);
  pin.appendChild(svg);
  return pin;
}

function renderEmptyState(block, bridge) {
  const fg = theme?.fg ?? '#fff';
  const card = document.createElement('div');
  card.className = 'fb-search-card';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${fg};`;

  const pinWrap = document.createElement('div');
  pinWrap.className = 'fb-pin-lg';
  pinWrap.appendChild(makePin(fg));
  card.appendChild(pinWrap);

  const heading = document.createElement('h3');
  heading.className = 'fb-heading';
  heading.textContent = 'Find a store near you';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'fb-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'fb-input';
  input.placeholder = 'Enter ZIP code…';
  input.setAttribute('aria-label', 'ZIP code or location');
  form.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'fb-btn';
  btn.textContent = 'Find Nearby';
  form.appendChild(btn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const loc = input.value.trim();
    if (loc && bridge) {
      bridge.sendMessage(`Find HDFC Bank branches near ${loc}`);
    }
  });

  card.appendChild(form);
  block.appendChild(card);
}

function renderBranches(block, branches, bridge) {
  const fg = theme?.fg ?? '#fff';
  const row = document.createElement('div');
  row.className = 'fb-row';

  branches.slice(0, 2).forEach((branch) => {
    const card = document.createElement('div');
    card.className = 'fb-store-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${fg};`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'fb-pin-circle';
    pinCircle.appendChild(makePin(fg));
    card.appendChild(pinCircle);

    const name = document.createElement('h3');
    name.className = 'fb-name';
    name.textContent = branch.name || '';
    card.appendChild(name);

    if (branch.address) {
      const addr = document.createElement('p');
      addr.className = 'fb-address';
      addr.textContent = branch.address;
      card.appendChild(addr);
    }

    if (branch.phone) {
      const phone = document.createElement('p');
      phone.className = 'fb-phone';
      phone.textContent = branch.phone;
      card.appendChild(phone);
    }

    if (branch.hours) {
      const hours = document.createElement('p');
      hours.className = 'fb-hours';
      hours.textContent = branch.hours;
      card.appendChild(hours);
    }

    row.appendChild(card);
  });

  block.appendChild(row);
}

function render(block, branches, bridge) {
  block.textContent = '';
  if (branches && branches.length) {
    renderBranches(block, branches, bridge);
  } else {
    renderEmptyState(block, bridge);
  }
}

export default async function decorate(block, bridge) {
  let branches;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      branches = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.branches — bare array outputSchema; key derived from actionName "find_branch"
      branches = structuredContent?.branches || [];
    }
    render(block, branches, bridge);
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  } else {
    branches = SAMPLE_DATA;
    render(block, branches, bridge);
  }
}
