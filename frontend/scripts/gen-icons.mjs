// 브랜드 아이콘 재생성 스크립트 (frontend 디렉터리에서 실행)
//   node scripts/gen-icons.mjs
// 원본: public/brand/icon-bolt.svg (둥근 모서리), icon-bolt-square.svg (정사각, iOS/스토어용)
// 출력: public/brand/icon-*.png, apple-touch-icon.png, src/app/apple-icon.png, src/app/favicon.ico
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const rounded = readFileSync('public/brand/icon-bolt.svg');
const square = readFileSync('public/brand/icon-bolt-square.svg');

// maskable: 정사각 배경 + 마크를 80% 안전 영역으로 축소
const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs><linearGradient id="g" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#312E81"/></linearGradient></defs>
  <rect width="96" height="96" fill="url(#g)"/>
  <g transform="translate(48 48) scale(0.8) translate(-48 -48)">
    <circle cx="48" cy="48" r="28" fill="none" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="7"/>
    <path d="M48 20A28 28 0 1 1 21.37 56.65" fill="none" stroke="#22D3EE" stroke-width="7" stroke-linecap="round"/>
    <path d="M54 26L36 52H46L42 70L60 44H50Z" fill="#FFFFFF"/>
  </g></svg>`);

const render = (svg, size) =>
  sharp(svg, { density: (72 * size) / 96 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const jobs = [
  ['public/brand/icon-192.png', rounded, 192],
  ['public/brand/icon-512.png', rounded, 512],
  ['public/brand/icon-1024.png', rounded, 1024],
  ['public/brand/icon-512-maskable.png', maskable, 512],
  ['public/brand/apple-touch-icon.png', square, 180],
  ['src/app/apple-icon.png', square, 180],
];
for (const [out, svg, size] of jobs) {
  writeFileSync(out, await render(svg, size));
  console.log('wrote', out, size);
}

// favicon.ico: PNG 압축 엔트리를 담은 ICO 컨테이너 (16/32/48)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => render(rounded, s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
const dir = Buffer.alloc(16 * sizes.length);
let offset = header.length + dir.length;
pngs.forEach((png, i) => {
  const s = sizes[i];
  const e = i * 16;
  dir.writeUInt8(s === 256 ? 0 : s, e); // width
  dir.writeUInt8(s === 256 ? 0 : s, e + 1); // height
  dir.writeUInt8(0, e + 2); // palette
  dir.writeUInt8(0, e + 3); // reserved
  dir.writeUInt16LE(1, e + 4); // color planes
  dir.writeUInt16LE(32, e + 6); // bpp
  dir.writeUInt32LE(png.length, e + 8);
  dir.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync('src/app/favicon.ico', Buffer.concat([header, dir, ...pngs]));
console.log('wrote src/app/favicon.ico', sizes.join('/'));
