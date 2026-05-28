'use client';

import { useState } from 'react';
import { optimizeCloudinary } from '@/lib/cloudinary-image';

export default function SmartImage({
  src,
  alt,
  width,
  className = '',
  loading = 'lazy',
  fetchPriority,
  fallback = null,
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return fallback;
  }

  return (
    <img
      src={optimizeCloudinary(src, width)}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
