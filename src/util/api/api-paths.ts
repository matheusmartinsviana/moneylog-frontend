const API_PREFIX = '/v1/';
const AUTH_PREFIX = '/v1/auth/';

function pathOf(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

export function isApiRequest(url: string): boolean {
  return pathOf(url).startsWith(API_PREFIX);
}

export function isAuthRequest(url: string): boolean {
  return pathOf(url).startsWith(AUTH_PREFIX);
}
