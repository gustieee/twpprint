const WA = '6281200000000'; // ganti dengan nomor WhatsApp TWP Printing
const EXTRA_SIDE = 15000;   // biaya tambahan per sisi cetak berikutnya
const BIG_SIZE = 10000;     // tambahan untuk XXL
const TIERS = [{ min: 50, off: .20 }, { min: 24, off: .15 }, { min: 12, off: .10 }];
const TEXT_COLORS = ['#1f1f22', '#fbfaf7', '#e8572a', '#22b8cf', '#e64980', '#fcc419', '#24304d', '#a3b18f'];

const $ = (id) => document.getElementById(id);
const blankSide = () => ({ text: '', font: 'Bricolage Grotesque', size: 16, textColor: '#1f1f22', tx: 50, ty: 35, logo: null, logoSize: 55, lx: 50, ly: 68 });

const initial = new URLSearchParams(location.search).get('p');
const state = {
  product: PRODUCTS[initial] ? initial : 'tee',
  color: COLORS[0].hex,
  side: 'Depan',
  sides: {},
  size: null,
  qty: 1,
  selected: null
};

const product = () => PRODUCTS[state.product];
const cur = () => (state.sides[state.side] ||= blankSide());
const hasDesign = (s) => s && (s.text.trim() || s.logo);

/* ---------- Render ---------- */
function renderProduct() {
  const p = product();
  $('title-product').textContent = p.name;
  $('product-svg').innerHTML = p.svg(state.color);
  const a = p.area, area = $('area');
  Object.assign(area.style, { left: a.x / 4 + '%', top: a.y / 4 + '%', width: a.w / 4 + '%', height: a.h / 4 + '%' });
  if (!p.sides.includes(state.side)) state.side = p.sides[0];
  if (!p.sizes.includes(state.size)) state.size = p.sizes[Math.min(1, p.sizes.length - 1)];

  $('chips').innerHTML = Object.entries(PRODUCTS).map(([k, q]) =>
    `<button class="chip ${k === state.product ? 'active' : ''}" data-k="${k}">${q.svg(k === state.product ? state.color : '#e9e4da')}${q.name}</button>`).join('');

  $('colors').innerHTML = COLORS.map(c =>
    `<button class="swatch ${c.hex === state.color ? 'active' : ''}" style="background:${c.hex}" title="${c.name}" data-c="${c.hex}"></button>`).join('');
  $('color-name').textContent = COLORS.find(c => c.hex === state.color).name;

  $('sizes').innerHTML = p.sizes.map(s => `<button class="size ${s === state.size ? 'active' : ''}" data-s="${s}">${s}</button>`).join('');
  renderSides();
  renderLayers();
  renderControls();
  renderSummary();
}

function renderSides() {
  $('sides').innerHTML = product().sides.map(s =>
    `<button class="side-tab ${s === state.side ? 'active' : ''} ${hasDesign(state.sides[s]) ? 'has' : ''}" data-side="${s}">${s}</button>`).join('');
  $('side-label').textContent = 'Sisi ' + state.side.toLowerCase();
}

function renderLayers() {
  const s = cur(), area = $('area');
  const scale = $('stage').clientWidth / 400;
  area.innerHTML = '';
  if (s.text.trim()) {
    const t = document.createElement('div');
    t.className = 'layer' + (state.selected === 'text' ? ' selected' : '');
    t.dataset.layer = 'text';
    t.textContent = s.text;
    Object.assign(t.style, { left: s.tx + '%', top: s.ty + '%', fontFamily: `"${s.font}"`, fontSize: s.size * scale + 'px', color: s.textColor, fontWeight: 700 });
    area.appendChild(t);
  }
  if (s.logo) {
    const l = document.createElement('div');
    l.className = 'layer' + (state.selected === 'logo' ? ' selected' : '');
    l.dataset.layer = 'logo';
    Object.assign(l.style, { left: s.lx + '%', top: s.ly + '%', width: s.logoSize + '%' });
    l.innerHTML = `<img src="${s.logo}" alt="Logo">`;
    area.appendChild(l);
  }
  document.dispatchEvent(new CustomEvent('design:change'));
}

function renderControls() {
  const s = cur();
  $('text').value = s.text;
  $('font').value = s.font;
  $('text-size').value = s.size;
  $('logo-size').value = s.logoSize;
  $('logo-size-field').hidden = !s.logo;
  $('remove-logo').hidden = !s.logo;
  $('text-colors').innerHTML = TEXT_COLORS.map(c =>
    `<button class="swatch ${c === s.textColor ? 'active' : ''}" style="background:${c}" data-tc="${c}"></button>`).join('');
}

function price() {
  const p = product();
  const printed = p.sides.filter(s => hasDesign(state.sides[s])).length;
  const extra = Math.max(0, printed - 1) * EXTRA_SIDE + (state.size === 'XXL' ? BIG_SIZE : 0);
  const unit = p.price + extra;
  const tier = TIERS.find(t => state.qty >= t.min);
  const off = tier ? tier.off : 0;
  return { printed, unit, off, unitFinal: unit * (1 - off), total: unit * (1 - off) * state.qty };
}

function renderSummary() {
  const p = product(), r = price();
  const next = [...TIERS].reverse().find(t => state.qty < t.min);
  $('tier').innerHTML = r.off
    ? `Hemat <b>${r.off * 100}%</b> untuk ${state.qty} pcs`
    : next ? `Order ${next.min} pcs, hemat <b>${next.off * 100}%</b>` : '';
  $('summary').innerHTML = `
    <div><span class="muted">Produk</span><span>${p.name} · ${COLORS.find(c => c.hex === state.color).name} · ${state.size}</span></div>
    <div><span class="muted">Sisi dicetak</span><span>${r.printed || 0} sisi</span></div>
    <div><span class="muted">Harga satuan</span><span>${r.off ? `<s class="muted">${rupiah(r.unit)}</s> ` : ''}${rupiah(r.unitFinal)}</span></div>
    <div><span class="muted">Jumlah</span><span>${state.qty} pcs</span></div>
    <div class="total"><small>Estimasi total</small><span>${rupiah(r.total)}</span></div>`;

  const lines = [
    'Halo TWP Printing, saya mau order custom:',
    `• Produk: ${p.name} (${p.tag})`,
    `• Warna: ${COLORS.find(c => c.hex === state.color).name}`,
    `• Ukuran: ${state.size}`,
    `• Jumlah: ${state.qty} pcs`,
    ...p.sides.filter(s => hasDesign(state.sides[s])).map(s => {
      const d = state.sides[s];
      return `• ${s}: ${[d.text.trim() && `tulisan "${d.text.trim()}" (${d.font})`, d.logo && 'logo (file menyusul)'].filter(Boolean).join(' + ')}`;
    }),
    `• Estimasi: ${rupiah(r.total)}`
  ];
  $('order').href = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
  $('m-order').href = $('order').href;
  $('m-total').textContent = rupiah(r.total);
}

const refresh = () => { renderSides(); renderLayers(); renderSummary(); };

/* ---------- Events ---------- */
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  state.product = b.dataset.k; state.selected = null;
  history.replaceState(null, '', '?p=' + state.product);
  renderProduct();
});
$('colors').addEventListener('click', e => {
  const b = e.target.closest('[data-c]'); if (!b) return;
  state.color = b.dataset.c;
  const s = cur();
  // Tulisan otomatis kontras saat warna bahan gelap/terang
  const dark = ['#1f1f22', '#24304d', '#6e2430'].includes(state.color);
  if (dark && s.textColor === '#1f1f22') s.textColor = '#fbfaf7';
  if (!dark && s.textColor === '#fbfaf7') s.textColor = '#1f1f22';
  renderProduct();
});
$('sides').addEventListener('click', e => {
  const b = e.target.closest('[data-side]'); if (!b) return;
  state.side = b.dataset.side; state.selected = null;
  renderSides(); renderLayers(); renderControls();
});
$('sizes').addEventListener('click', e => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  state.size = b.dataset.s;
  $('sizes').querySelectorAll('.size').forEach(x => x.classList.toggle('active', x === b));
  renderSummary();
});
$('text').addEventListener('input', e => { cur().text = e.target.value; refresh(); });
$('font').addEventListener('change', e => { cur().font = e.target.value; renderLayers(); renderSummary(); });
$('text-size').addEventListener('input', e => { cur().size = +e.target.value; renderLayers(); });
$('logo-size').addEventListener('input', e => { cur().logoSize = +e.target.value; renderLayers(); });
$('text-colors').addEventListener('click', e => {
  const b = e.target.closest('[data-tc]'); if (!b) return;
  cur().textColor = b.dataset.tc; renderLayers(); renderControls();
});
$('logo').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = () => { cur().logo = reader.result; renderControls(); refresh(); };
  reader.readAsDataURL(f);
  e.target.value = '';
});
$('remove-logo').addEventListener('click', e => { e.preventDefault(); cur().logo = null; renderControls(); refresh(); });
$('show-area').addEventListener('change', e => $('stage').classList.toggle('show-area', e.target.checked));

const setQty = (n) => { state.qty = Math.max(1, Math.min(9999, n || 1)); $('qty').value = state.qty; renderSummary(); };
$('minus').addEventListener('click', () => setQty(state.qty - 1));
$('plus').addEventListener('click', () => setQty(state.qty + 1));
$('qty').addEventListener('change', e => setQty(parseInt(e.target.value, 10)));

$('reset').addEventListener('click', () => {
  state.sides = {}; state.selected = null;
  renderControls(); refresh();
});

/* Drag tulisan/logo di dalam area cetak */
let drag = null;
$('area').addEventListener('pointerdown', e => {
  const el = e.target.closest('.layer'); if (!el) return;
  e.preventDefault();
  state.selected = el.dataset.layer;
  $('area').querySelectorAll('.layer').forEach(x => x.classList.toggle('selected', x === el));
  drag = { el, rect: $('area').getBoundingClientRect() };
  el.setPointerCapture(e.pointerId);
});
$('area').addEventListener('pointermove', e => {
  if (!drag) return;
  const x = Math.max(0, Math.min(100, (e.clientX - drag.rect.left) / drag.rect.width * 100));
  const y = Math.max(0, Math.min(100, (e.clientY - drag.rect.top) / drag.rect.height * 100));
  const s = cur();
  if (drag.el.dataset.layer === 'text') { s.tx = x; s.ty = y; } else { s.lx = x; s.ly = y; }
  drag.el.style.left = x + '%'; drag.el.style.top = y + '%';
});
['pointerup', 'pointercancel'].forEach(t => $('area').addEventListener(t, () => {
  if (drag) document.dispatchEvent(new CustomEvent('design:change'));
  drag = null;
}));
$('stage').addEventListener('pointerdown', e => {
  if (!e.target.closest('.layer')) { state.selected = null; $('area').querySelectorAll('.layer').forEach(x => x.classList.remove('selected')); }
});

new ResizeObserver(renderLayers).observe($('stage'));

/* Contoh desain awal supaya preview tidak kosong */
state.sides.Depan = { ...blankSide(), text: 'MAKE IT YOURS', size: 17, ty: 40 };
renderProduct();
