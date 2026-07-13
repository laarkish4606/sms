import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS = { allowedTags: [], allowedAttributes: {} };

function stripKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.forEach(stripKeys);
  }
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
        return;
      }
      const value = obj[key];
      if (typeof value === 'string') {
        obj[key] = sanitizeHtml(value, SANITIZE_OPTIONS);
      } else if (value && typeof value === 'object') {
        stripKeys(value);
      }
    });
  }
  return obj;
}

/**
 * Strips MongoDB operator injection ($gt, $where, dotted keys) and HTML/script
 * content from request body, query, and params. Runs after body parsing.
 */
export function sanitizeRequest(req, res, next) {
  if (req.body) stripKeys(req.body);
  if (req.params) stripKeys(req.params);
  if (req.query) stripKeys(req.query);
  next();
}

export default sanitizeRequest;
