
// This is only used to test the renderer and can likely be deleted
// later.
//
// (DEBUG CODE)

import * as Util from './util.js';

declare const marked: any; ////
declare const DOMPurify: any; ////
declare const MathJax: any; ////

export function renderTest() {

  setupMarkedOptions();
  Util.enterToButton($("#text"), $("#submit"));

  $("#submit").click(doMarkdown);

  const dirty = "<div><script src='dangerous.js'><\/script></div><p>test</p>";
  const clean = DOMPurify.sanitize(dirty);
  console.log(dirty);
  console.log(clean);

}

async function doMarkdown() {
  const text = $("#text").val() as string;
  const rendered = await renderMarkdown(text);
  $("#content").html(rendered);
}

// TODO Integration with highlight.js?
function setupMarkedOptions() {

  marked.setOptions({
    smartLists: true,
    xhtml: true,
  });

  marked.use({ extensions: [InlineLatex] });

}

const InlineLatex = {
  name: "inlineLatex",
  level: "inline",

  start(src: string): number | undefined {
    const match = src.match(/\$/);
    if (match) {
      return match.index;
    } else {
      return undefined;
    }
  },

  tokenizer(src: string) {
    const match = src.match(/^\$((?:[^$\n]|\\[^\n])+)\$/);
    if (match) {
      return {
        type: "inlineLatex",
        raw: match[0],
        inlineLatex: match[1],
      };
    } else {
      return undefined;
    }
  },

  renderer(token: any) {
    const mml = MathJax.tex2mml(token.inlineLatex, { display: false });
    return mml;
  }

};

export async function renderMarkdown(text: string): Promise<string> {
  const rendered = marked(text);
  return DOMPurify.sanitize(rendered, {SAFE_FOR_JQUERY: true});
}
