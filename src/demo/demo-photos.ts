import { demoId } from '~/demo/demo-world';

export const DEMO_PHOTO_WIDTH = 640;
export const DEMO_PHOTO_HEIGHT = 360;

const PALETTES: readonly (readonly [string, string])[] = [
  ['slateblue', 'lavender'],
  ['teal', 'paleturquoise'],
  ['peru', 'bisque'],
];

export function demoPhotoId(goalId: string, index: number): string {
  return demoId('photo', Number(goalId.slice(-12)) * 10 + index + 1);
}

export function demoProfilePhotoBlob(version: number): Blob {
  const [from, to] = PALETTES[Math.abs(version) % PALETTES.length]!;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="320" height="320" fill="url(#g)"/>` +
    `<circle cx="160" cy="124" r="56" fill="white" fill-opacity="0.85"/>` +
    `<path d="M48 320c0-66 49-112 112-112s112 46 112 112z" fill="white" fill-opacity="0.85"/>` +
    `</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

export function demoPhotoBlob(photoId: string, name: string): Blob {
  const index = Number(photoId.slice(-1)) - 1;
  const [from, to] = PALETTES[Math.max(index, 0) % PALETTES.length]!;
  const label = `${name} · ${index + 1}`.replace(/[<>&"]/g, '');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DEMO_PHOTO_WIDTH} ${DEMO_PHOTO_HEIGHT}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<text x="50%" y="52%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="white">${label}</text>` +
    `</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}
