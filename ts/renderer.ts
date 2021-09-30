
// Functionality for rendering Markdown and Latex as HTML/MathML

let _initialized: boolean = false;

const MARKED_OPTIONS = {
  smartLists: true,
  xhtml: true,
};

// This function should be called once before calling any of the other
// rendering functions in this module.
export function initialize() {
  if (_initialized) {
    return;
  }

  // TODO Integration with highlight.js?

  marked.setOptions(MARKED_OPTIONS);
  marked.use({ extensions: [InlineLatex as any] }); // TODO Why does Typescript not like this type?

  _initialized = true;
}

export function render(text: string): string {
  const rendered = marked(text);
  return DOMPurify.sanitize(rendered); // TODO SAFE_FOR_JQUERY? (Typescript doesn't like it)
}

export const InlineLatex = {
  name: "inlineLatex",
  level: "inline" as const,

  start(src: string): number | undefined {
    const match = src.match(/\$/);
    if (match) {
      return match.index;
    } else {
      return undefined;
    }
  },

  tokenizer(src: string): InlineLatexToken | undefined {
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

  renderer(token: InlineLatexToken): string {
    // TODO The DefinitelyTyped bindings for MathJax don't recognize
    // this function. What can we do about it?
    const mml = (MathJax as any).tex2mml(token.inlineLatex, { display: false });
    return mml;
  },

};

export interface InlineLatexToken {
  type: "inlineLatex";
  raw: string;
  inlineLatex: string;
}
