export function optimizeCloudinary(url, width) {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  // Use q_auto:eco (aggressive compression) for smaller thumbnails, and standard q_auto for others
  const quality = (width && width <= 200) ? 'q_auto:eco' : 'q_auto';
  const params = width ? `f_auto,${quality},w_${width}` : 'f_auto,q_auto';
  return url.replace(
    '/upload/',
    `/upload/${params}/`
  );
}