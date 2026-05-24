import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'a', 'p', 'div', 'span', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'font',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'target', 'rel'],
  font: ['color', 'size', 'face'],
  '*': ['style', 'class'],
};

const ALLOWED_STYLES = {
  '*': {
    color: [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/, /^[a-zA-Z]+$/],
    'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/, /^[a-zA-Z]+$/],
    'text-align': [/^(left|right|center|justify)$/],
    'font-size': [/^\d+(?:px|em|rem|%)$/],
    'font-weight': [/^(normal|bold|[1-9]00)$/],
    'font-style': [/^(normal|italic)$/],
    'text-decoration': [/^(none|underline|line-through)$/],
  },
};

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedStyles: ALLOWED_STYLES,
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto', 'tel'],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
  },
};

export function sanitizeRichText(value) {
  if (typeof value !== 'string') return '';
  return sanitizeHtml(value, SANITIZE_OPTIONS).trim();
}

export function sanitizePlainText(value, maxLength = 5000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
