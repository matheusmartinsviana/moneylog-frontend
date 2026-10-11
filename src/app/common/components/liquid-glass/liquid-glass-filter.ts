export interface DisplacementOptions {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly depth: number;
  readonly strength: number;
  readonly chromaticAberration: number;
}

const FALLBACK = 'blur(6px) brightness(1.12) saturate(1.7)';
const cache = new Map<string, string>();

function displacementMap({
  width,
  height,
  radius,
  depth,
}: Pick<DisplacementOptions, 'width' | 'height' | 'radius' | 'depth'>): string {
  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>.mix { mix-blend-mode: screen; }</style>
    <defs>
      <linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radius / height) * 15)}%" y2="${Math.floor(100 - (radius / height) * 15)}%">
        <stop offset="0%" stop-color="#0F0" /><stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="X" x1="${Math.ceil((radius / width) * 15)}%" x2="${Math.floor(100 - (radius / width) * 15)}%" y1="0" y2="0">
        <stop offset="0%" stop-color="#F00" /><stop offset="100%" stop-color="#000" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" />
      <rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" />
      <rect x="${depth}" y="${depth}" height="${height - 2 * depth}" width="${width - 2 * depth}" fill="#808080" rx="${radius}" ry="${radius}" filter="blur(${depth}px)" />
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function displacementFilterUri(options: DisplacementOptions): string {
  const { width, height, strength, chromaticAberration: ca } = options;
  const channel = (result: string, matrix: string, scale: number, source = 'SourceGraphic') =>
    `<feDisplacementMap in="${source}" in2="displacementMap" scale="${scale}" xChannelSelector="R" yChannelSelector="G" />` +
    `<feColorMatrix type="matrix" values="${matrix}" result="${result}" />`;
  const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="displace" color-interpolation-filters="sRGB">
      <feImage x="0" y="0" height="${height}" width="${width}" href="${displacementMap(options)}" result="displacementMap" />
      ${channel('displacedR', '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', strength + ca * 2)}
      ${channel('displacedG', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', strength + ca)}
      ${channel('displacedB', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', strength)}
      <feBlend in="displacedR" in2="displacedG" mode="screen" />
      <feBlend in2="displacedB" mode="screen" />
    </filter></defs>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '#displace';
}

export function refractionFilter(options: DisplacementOptions): string {
  const key = JSON.stringify(options);
  let value = cache.get(key);
  if (!value) {
    value = `blur(1px) url("${displacementFilterUri(options)}") blur(1px) brightness(1.12) saturate(1.7)`;
    cache.set(key, value);
  }
  return value;
}

export const REFRACTION_FALLBACK = FALLBACK;

export function refractionCacheSize(): number {
  return cache.size;
}
