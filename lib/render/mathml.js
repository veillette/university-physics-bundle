import { escapeText, escapeAttr } from './html.js';

/**
 * Serialize a `<m:math>` subtree to HTML MathML: strip the `m:` prefix (HTML
 * MathML is unprefixed), add the MathML namespace on the root, and preserve
 * structure, attributes, and text verbatim. `display: true` marks display math
 * (direct child of <equation>).
 */
export function renderMathML(el, { display = false } = {}) {
  const attrsOut = serializeAttrs(el, {
    xmlns: 'http://www.w3.org/1998/Math/MathML',
    ...(display ? { display: 'block' } : {}),
  });
  return `<math${attrsOut}>${serializeChildren(el)}</math>`;
}

function serialize(node) {
  if (node.type === 'text') return escapeText(node.data);
  if (node.type !== 'tag') return '';
  const name = node.name.startsWith('m:') ? node.name.slice(2) : node.name;
  return `<${name}${serializeAttrs(node)}>${serializeChildren(node)}</${name}>`;
}

function serializeChildren(node) {
  return (node.children || []).map(serialize).join('');
}

function serializeAttrs(node, extra = {}) {
  const merged = { ...extra, ...(node.attribs || {}) };
  delete merged['xmlns:m'];
  let out = '';
  for (const [k, v] of Object.entries(merged)) {
    out += ` ${k}="${escapeAttr(v)}"`;
  }
  return out;
}
