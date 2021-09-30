
// This is only used to test the renderer and can likely be deleted
// later.
//
// (DEBUG CODE)

import * as Util from './util.js';

export function renderTest() {

  setupMarkedOptions();
  Util.enterToButton($("#text"), $("#submit"));

  $("#submit").click(doMarkdown);

  renderMarkdown(String.raw`<br/>This is an **equation**: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`)
    .then((cleanedPreload) => {
      $("#html-preload").html(cleanedPreload);
    });

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
    // TODO The DefinitelyTyped bindings for MathJax don't recognize
    // this function. What can we do about it?
    const mml = (MathJax as any).tex2mml(token.inlineLatex, { display: false });
    return mml;
  }

};

export async function renderMarkdown(text: string): Promise<string> {
  const rendered = marked(text);
  return DOMPurify.sanitize(rendered); // TODO SAFE_FOR_JQUERY? (Typescript doesn't like it)
}
