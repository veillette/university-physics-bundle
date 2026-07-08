import fs from 'node:fs';
import * as cheerio from 'cheerio';
import { childElements, childNamed, textOf } from './xml-utils.js';

/**
 * Parse one CollXML collection file into a volume tree:
 *   { title, slug, frontMatter: [moduleId], units: [{ title, chapters: [{ title, moduleIds }] }],
 *     backMatter: [moduleId] }
 *
 * Structure contract (asserted): <col:content> children are bare <col:module> (front matter),
 * then <col:subcollection> units whose content is <col:subcollection> chapters whose content
 * is only <col:module>, then bare <col:module> back matter.
 */
export function parseCollection(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(xml, { xml: true });

  const root = $('col\\:collection').get(0);
  if (!root) throw new Error(`${filePath}: no <col:collection> root element`);

  const metadata = childNamed(root, 'metadata');
  const title = textOf(childNamed(metadata, 'md:title')).trim();
  const slug = textOf(childNamed(metadata, 'md:slug')).trim();
  if (!title || !slug) throw new Error(`${filePath}: missing md:title or md:slug`);

  const content = childNamed(root, 'col:content');
  const frontMatter = [];
  const units = [];
  const backMatter = [];

  for (const node of childElements(content)) {
    if (node.name === 'col:module') {
      (units.length === 0 ? frontMatter : backMatter).push(node.attribs.document);
    } else if (node.name === 'col:subcollection') {
      if (backMatter.length > 0) {
        throw new Error(`${filePath}: subcollection found after back-matter modules`);
      }
      units.push(parseUnit(node, filePath));
    } else {
      throw new Error(`${filePath}: unexpected <${node.name}> in col:content`);
    }
  }

  return { title, slug, frontMatter, units, backMatter };
}

function parseUnit(node, filePath) {
  const title = textOf(childNamed(node, 'md:title')).trim();
  const content = childNamed(node, 'col:content');
  const chapters = [];

  for (const child of childElements(content)) {
    if (child.name !== 'col:subcollection') {
      throw new Error(`${filePath}: unit "${title}" contains <${child.name}>, expected chapters`);
    }
    const chapterTitle = textOf(childNamed(child, 'md:title')).trim();
    const chapterContent = childNamed(child, 'col:content');
    const moduleIds = [];
    for (const m of childElements(chapterContent)) {
      if (m.name !== 'col:module') {
        throw new Error(`${filePath}: chapter "${chapterTitle}" contains <${m.name}>, expected modules`);
      }
      moduleIds.push(m.attribs.document);
    }
    chapters.push({ title: chapterTitle, moduleIds });
  }

  return { title, chapters };
}
