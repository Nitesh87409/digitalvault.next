export function extractYoutubeVideoId(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const embeddedId = parsed.searchParams.get('v');
      if (embeddedId) return embeddedId;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(pathParts[0])) {
        return pathParts[1] || '';
      }
    }
  } catch {}

  return '';
}

export function getYoutubeWatchUrl(value) {
  const videoId = extractYoutubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
}

export function getYoutubeEmbedUrls(value) {
  const videoId = extractYoutubeVideoId(value);
  if (!videoId) return [];

  return [
    `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
  ];
}

export function normalizeYoutubeVideoUrl(value) {
  return getYoutubeWatchUrl(value);
}
