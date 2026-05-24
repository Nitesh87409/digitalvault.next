import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function isPrivateIpv4(ip) {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('127.') ||
    ip.startsWith('169.254.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.')
  );
}

function isPrivateIpv6(ip) {
  const normalized = ip.toLowerCase();
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

function isPrivateIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) return isPrivateIpv4(ip);
  if (type === 6) return isPrivateIpv6(ip);
  return false;
}

async function assertSafeHostname(hostname) {
  const normalized = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith('.local')) {
    throw new Error('Blocked download host');
  }

  if (net.isIP(normalized)) {
    if (isPrivateIp(normalized)) {
      throw new Error('Blocked download host');
    }
    return;
  }

  const addresses = await dns.lookup(normalized, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error('Blocked download host');
  }
}

export async function assertSafeRemoteDownloadUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid remote download URL');
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Unsupported remote download protocol');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Remote download credentials are not allowed');
  }

  await assertSafeHostname(parsed.hostname);
  return parsed;
}

export async function normalizeStoredDownloadSource(rawValue) {
  if (typeof rawValue !== 'string') {
    throw new Error('Download source is required');
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error('Download source is required');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    await assertSafeRemoteDownloadUrl(trimmed);
    return trimmed;
  }

  if (trimmed.includes('\0')) {
    throw new Error('Invalid download file path');
  }

  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.includes('..')) {
    throw new Error('Invalid download file path');
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export async function fetchSafeRemoteFile(rawUrl, maxRedirects = 3) {
  const visited = new Set();
  let currentUrl = rawUrl;

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const parsed = await assertSafeRemoteDownloadUrl(currentUrl);
    const normalizedUrl = parsed.toString();
    if (visited.has(normalizedUrl)) {
      throw new Error('Remote download redirect loop detected');
    }
    visited.add(normalizedUrl);

    const response = await fetch(normalizedUrl, {
      cache: 'no-store',
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Remote download redirect is missing location');
      }
      currentUrl = new URL(location, normalizedUrl).toString();
      continue;
    }

    return { response, url: normalizedUrl };
  }

  throw new Error('Too many remote download redirects');
}
