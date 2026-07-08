// MathJax v4 configuration — MathML input (the CNXML source embeds presentation MathML).
// Must load before the MathJax script itself (mml-chtml.js).
window.MathJax = {
  loader: {
    load: ['ui/menu'],
  },
  options: {
    // Solutions are typeset lazily by book-viewer.js when revealed.
    ignoreHtmlClass: 'mathjax-skip',
    enableMenu: true,
    menuOptions: {
      settings: {
        enrich: true,
        speech: true,
        inTabOrder: true,
      },
    },
  },
  mml: {
    parseAs: 'html',
    forceReparse: false,
  },
  chtml: {
    displayOverflow: 'overflow',
    scale: 1.0,
    minScale: 0.5,
  },
};
