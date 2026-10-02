// Ilustrasi produk (SVG) + data harga untuk mockup TWP Printing.
// area = bidang cetak dalam koordinat viewBox 400x400.
const LINE = 'stroke="rgba(0,0,0,.16)" stroke-width="2" stroke-linejoin="round"';
const DARK = 'fill="rgba(0,0,0,.09)"';

const PRODUCTS = {
  tee: {
    name: 'Kaos', tag: 'Cotton combed 24s', price: 65000, sides: ['Depan', 'Belakang'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], area: { x: 148, y: 112, w: 104, h: 135 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="370" rx="120" ry="10" fill="rgba(0,0,0,.07)"/>
      <path d="M120 62 L162 44 Q200 72 238 44 L280 62 L346 112 L310 165 L282 146 L282 352 L118 352 L118 146 L90 165 L54 112 Z" fill="${c}" ${LINE}/>
      <path d="M162 44 Q200 72 238 44 L230 40 Q200 60 170 40 Z" ${DARK}/>
      <path d="M118 146 L90 165 L54 112 L66 103 L100 150 Z M282 146 L310 165 L346 112 L334 103 L300 150 Z" ${DARK}/>
    </svg>`
  },
  hoodie: {
    name: 'Hoodie', tag: 'Fleece 280 gsm', price: 165000, sides: ['Depan', 'Belakang'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], area: { x: 155, y: 118, w: 90, h: 105 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="372" rx="125" ry="10" fill="rgba(0,0,0,.07)"/>
      <path d="M115 82 L155 62 L245 62 L285 82 L344 142 L322 304 L292 300 L286 178 L286 356 L114 356 L114 178 L108 300 L78 304 L56 142 Z" fill="${c}" ${LINE}/>
      <path d="M150 64 Q200 8 250 64 Q200 104 150 64 Z" fill="${c}" ${LINE}/>
      <path d="M150 64 Q200 8 250 64 Q200 104 150 64 Z" ${DARK}/>
      <path d="M150 262 L250 262 L264 326 L136 326 Z" ${DARK}/>
      <path d="M186 92 L182 140 M214 92 L218 140" stroke="rgba(0,0,0,.25)" stroke-width="3" stroke-linecap="round"/>
      <path d="M114 340 L286 340 L286 356 L114 356 Z M78 296 L108 292 L108 300 L78 304 Z M292 292 L322 296 L322 304 L292 300 Z" ${DARK}/>
    </svg>`
  },
  tote: {
    name: 'Totebag', tag: 'Kanvas 12 oz', price: 45000, sides: ['Depan', 'Belakang'],
    sizes: ['Standar'], area: { x: 128, y: 182, w: 144, h: 145 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="372" rx="115" ry="9" fill="rgba(0,0,0,.07)"/>
      <path d="M145 150 Q145 52 200 52 Q255 52 255 150" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <path d="M145 150 Q145 52 200 52 Q255 52 255 150" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="16" stroke-linecap="round"/>
      <rect x="96" y="140" width="208" height="222" rx="6" fill="${c}" ${LINE}/>
      <rect x="96" y="140" width="208" height="16" ${DARK}/>
    </svg>`
  },
  cap: {
    name: 'Topi', tag: 'Baseball cap / bordir', price: 55000, sides: ['Depan'],
    sizes: ['All size'], area: { x: 150, y: 160, w: 100, h: 62 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="320" rx="130" ry="10" fill="rgba(0,0,0,.07)"/>
      <path d="M88 252 Q92 118 200 112 Q308 118 312 252 Z" fill="${c}" ${LINE}/>
      <path d="M200 112 Q170 170 168 250 M200 112 Q230 170 232 250" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2"/>
      <path d="M58 252 Q200 226 342 252 Q334 296 200 286 Q66 296 58 252 Z" fill="${c}" ${LINE}/>
      <path d="M58 252 Q200 226 342 252 Q334 296 200 286 Q66 296 58 252 Z" fill="rgba(0,0,0,.14)"/>
      <circle cx="200" cy="114" r="9" fill="${c}" ${LINE}/>
    </svg>`
  },
  keychain: {
    name: 'Gantungan Kunci', tag: 'Akrilik 3 mm', price: 15000, sides: ['Depan'],
    sizes: ['5 cm', '7 cm'], area: { x: 138, y: 162, w: 124, h: 150 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="200" cy="364" rx="80" ry="8" fill="rgba(0,0,0,.07)"/>
      <circle cx="200" cy="66" r="30" fill="none" stroke="#b9b9b9" stroke-width="7"/>
      <path d="M200 96 L200 124" stroke="#b9b9b9" stroke-width="6"/>
      <rect x="118" y="112" width="164" height="226" rx="44" fill="${c}" ${LINE}/>
      <rect x="126" y="120" width="148" height="210" rx="38" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>
      <circle cx="200" cy="138" r="10" fill="#f6f3ee" ${LINE}/>
    </svg>`
  },
  mug: {
    name: 'Mug', tag: 'Keramik 11 oz', price: 35000, sides: ['Depan'],
    sizes: ['11 oz'], area: { x: 128, y: 150, w: 124, h: 130 },
    svg: (c) => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="190" cy="334" rx="100" ry="9" fill="rgba(0,0,0,.07)"/>
      <path d="M268 150 Q338 150 338 212 Q338 274 268 274" fill="none" stroke="${c}" stroke-width="24"/>
      <path d="M268 150 Q338 150 338 212 Q338 274 268 274" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="24"/>
      <path d="M108 112 L272 112 L272 306 Q272 322 256 322 L124 322 Q108 322 108 306 Z" fill="${c}" ${LINE}/>
      <ellipse cx="190" cy="112" rx="82" ry="14" fill="${c}" ${LINE}/>
      <ellipse cx="190" cy="112" rx="70" ry="9" fill="rgba(0,0,0,.18)"/>
    </svg>`
  }
};

const COLORS = [
  { name: 'Putih', hex: '#fbfaf7' }, { name: 'Hitam', hex: '#1f1f22' },
  { name: 'Navy', hex: '#24304d' }, { name: 'Maroon', hex: '#6e2430' },
  { name: 'Sage', hex: '#a3b18f' }, { name: 'Cream', hex: '#eadfc8' },
  { name: 'Abu', hex: '#a6a6a6' }, { name: 'Oranye', hex: '#e8572a' }
];

const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
