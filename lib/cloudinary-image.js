export function optimizeCloudinary(url, width) {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const params = width ? `f_auto,q_auto:good,w_${width}` : 'f_auto,q_auto:good';
  return url.replace(
    '/upload/',
    `/upload/${params}/`
  );
}