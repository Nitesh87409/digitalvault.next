const PRODUCT_IMAGE_SOURCE = 'linked-product';
const PRODUCT_IMAGE_INDEX_ATTR = 'data-product-image-index';
const PRODUCT_IMAGE_SOURCE_ATTR = 'data-product-image-source';
const DEFAULT_IMAGE_CLASS = 'max-w-full rounded-xl my-6';

function escapeAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

export function resolveProductImage(product, index) {
  const imageIndex = Number(index);
  if (!product || !Number.isInteger(imageIndex) || imageIndex < 0) {
    return '';
  }
  return Array.isArray(product.images) ? product.images[imageIndex] || '' : '';
}

export function resolveProductPageHref(product) {
  if (!product) return '';
  const productId = product.slug || product._id || product.id;
  return productId ? `/product/${productId}` : '';
}

export function buildProductImageMarkup(product, index, altText = '') {
  const src = resolveProductImage(product, index);
  const imageIndex = Number(index);
  if (!src || !Number.isInteger(imageIndex) || imageIndex < 0) {
    return '';
  }

  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(altText || product?.name || 'Product image')}" class="${DEFAULT_IMAGE_CLASS}" ${PRODUCT_IMAGE_SOURCE_ATTR}="${PRODUCT_IMAGE_SOURCE}" ${PRODUCT_IMAGE_INDEX_ATTR}="${imageIndex}" />`;
}

export function extractUsedProductImageIndexes(html = '') {
  const matches = [...String(html).matchAll(new RegExp(`${PRODUCT_IMAGE_INDEX_ATTR}=["'](\\d+)["']`, 'gi'))];
  return Array.from(new Set(matches.map((match) => Number(match[1])).filter(Number.isInteger)));
}

export function renderBlogContentWithProductImages(html = '', product = null) {
  const productHref = resolveProductPageHref(product);
  return String(html).replace(/<img\b[^>]*data-product-image-index=["'](\d+)["'][^>]*>/gi, (tag, index) => {
    const resolvedSrc = resolveProductImage(product, Number(index));
    const fallbackSrc = readAttr(tag, 'src');
    const finalSrc = resolvedSrc || fallbackSrc;

    if (!finalSrc) {
      return '';
    }

    const alt = readAttr(tag, 'alt') || product?.name || 'Product image';
    const className = readAttr(tag, 'class') || DEFAULT_IMAGE_CLASS;
    const imgMarkup = `<img src="${escapeAttr(finalSrc)}" alt="${escapeAttr(alt)}" class="${escapeAttr(className)}" loading="lazy" />`;
    return productHref
      ? `<a href="${escapeAttr(productHref)}" aria-label="Open ${escapeAttr(product?.name || 'product')} page">${imgMarkup}</a>`
      : imgMarkup;
  });
}

export function resolveBlogFeaturedImage(blog = {}) {
  const dynamicImage = resolveProductImage(blog.product_id, blog.featured_product_image_index);
  return dynamicImage || blog.image || '';
}
