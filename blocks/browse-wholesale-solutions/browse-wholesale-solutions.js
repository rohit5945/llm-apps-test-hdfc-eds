// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Corporates',
    description: 'Banking solutions designed to meet all corporate needs, including large corporate banking, CBX internet banking, agricultural lending, and commercial credit cards.',
    image_url: 'https://s7ap1.scene7.com/is/image/hdfcbankPWS/wholesale-banking-corporates-card?fmt=webp-alpha',
    category: 'Wholesale Banking',
  },
  {
    name: 'Government & Institutional Business',
    description: 'One-stop banking solution for governmental and institutional needs across the public sector.',
    image_url: 'https://s7ap1.scene7.com/is/image/hdfcbankPWS/wholesale-banking-govt-and-financial-institutions-card?fmt=webp-alpha',
    category: 'Wholesale Banking',
  },
  {
    name: 'Financial Institutions',
    description: 'A wide range of banking solutions to streamline organisational performance for financial institutions.',
    image_url: 'https://s7ap1.scene7.com/is/image/hdfcbankPWS/wholsale-banner-new?fmt=webp-alpha',
    category: 'Wholesale Banking',
  },
  {
    name: 'Investment Banking',
    description: 'A smarter way for businesses to raise capital, with expert advisory and capital-market solutions.',
    image_url: 'https://s7ap1.scene7.com/is/image/hdfcbankPWS/wholesale-banking-investment-banking-card?fmt=webp-alpha',
    category: 'Wholesale Banking',
  },
];

// Brand palette from BuildWidgetRequest. getThemedCardBg() darkens palette[0]
// to luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#004c8f', '#e7131a'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.solutions — bare array outputSchema; key derived from actionName "browse_wholesale_solutions"
      items = structuredContent?.solutions || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderItems(block, items, bridge) {
  const list = (items || []).slice(0, 4);

  const wrapper = document.createElement('div');
  wrapper.className = 'bws-wrapper';

  const track = document.createElement('div');
  track.className = 'bws-track';

  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'bws-card';

    const imageBox = document.createElement('div');
    imageBox.className = 'bws-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
      imageBox.appendChild(img);
    } else {
      imageBox.appendChild(colorDiv());
    }
    card.appendChild(imageBox);

    const info = document.createElement('div');
    info.className = 'bws-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'bws-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'bws-title';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'bws-desc';
      desc.textContent = item.description;
      info.appendChild(desc);
    }

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'bws-cta';
    cta.textContent = 'Explore Now';
    if (bridge) {
      cta.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'bws-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `bws-arrow bws-arrow-${dir}`;
    btn.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    btn.textContent = dir === 'left' ? '◀' : '▶';
    const scrollBy = () => {
      const card = track.querySelector('.bws-card');
      const step = card ? card.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
    };
    btn.addEventListener('click', scrollBy);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(); }
    });
    return btn;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  requestAnimationFrame(updateArrows);

  block.appendChild(wrapper);
}
