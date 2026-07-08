import { parseBooks } from './parse/books.js';
import { parseCollection } from './parse/collection.js';
import { buildModel } from './model/numbering.js';
import { renderModule } from './render/transform.js';

/**
 * Build the whole book model: parse the manifest + collections, run the
 * numbering/anchor pass, then render every module once (shared preface/appendix
 * modules are rendered once but emitted at one URL per volume).
 */
export function buildBook({ root }) {
  const t0 = Date.now();
  const books = parseBooks(root);
  const collections = books.map(b => parseCollection(b.file));
  const model = buildModel(root, collections);
  const warnings = model.warnings;

  const htmlByModule = new Map();
  for (const { moduleId, volumeSlug } of model.renderList) {
    htmlByModule.set(
      moduleId,
      renderModule(root, moduleId, {
        volumeSlug,
        anchors: model.anchors,
        moduleRefText: model.moduleRefText,
        numberByNode: model.numberByNode,
        pagesByModule: model.pagesByModule,
        warnings,
      })
    );
  }

  const pages = model.pages.map(p => ({ ...p, html: htmlByModule.get(p.moduleId) }));

  const summaryJson = JSON.stringify(
    model.tocVolumes.map(v => ({
      volume: v.title,
      slug: v.slug,
      url: v.url,
      front: v.front.map(p => ({ title: p.displayTitle, url: p.url })),
      units: v.units.map(u => ({
        title: u.title,
        chapters: u.chapters.map(c => ({
          chapterNumber: c.number,
          chapterTitle: c.title,
          url: c.url,
          sections: c.sections.map((s, i) => ({
            sectionNumber: i + 1,
            sectionTitle: s.sidebarTitle,
            url: s.url,
          })),
        })),
      })),
      back: v.back.map(p => ({ title: p.displayTitle, url: p.url })),
    }))
  );

  console.log(
    `[book] ${pages.length} pages from ${model.renderList.length} modules in ${Date.now() - t0}ms` +
      (warnings.length ? `; ${warnings.length} warnings` : '')
  );
  for (const w of warnings.slice(0, 30)) console.warn(`[book]   warn: ${w}`);
  if (warnings.length > 30) console.warn(`[book]   ... and ${warnings.length - 30} more warnings`);

  return { volumes: model.tocVolumes, pages, summaryJson, warningCount: warnings.length };
}
