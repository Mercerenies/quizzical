
/**
 * Functionality for rendering Markdown and Latex as HTML/MathML.
 *
 * This software uses the markedjs Javascript library to render
 * Markdown. It also provides an extension to markedjs which renders
 * LaTeX using MathJax. Finally, any input to the renderer in this
 * module is sanitized via DOMPurify before being returned.
 *
 * @module renderer
 */

let _initialized: boolean = false;

const MARKED_OPTIONS = {
  smartLists: true,
  xhtml: true,
};

/**
 * Initializes the renderer. It is rarely necessary to call this
 * function explicitly, as the render function will call it
 * automatically if the renderer is uninitialized.
 */
export function initialize(): void {
  if (_initialized) {
    return;
  }

  // TODO Integration with highlight.js?

  marked.setOptions(MARKED_OPTIONS);
  // TODO Why does Typescript not like this type?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marked.use({ extensions: [InlineLatex as any, BlockLatex as any] });

  _initialized = true;
}

/**
 * Renders a string of Markdown text.
 */
export function render(text: string): Promise<string> {
  // The MathJax call can be a bit on the slow side, so we want to
  // provide the ability to await on this function.
  initialize();
  return new Promise((resolve) => {
    const rendered = marked(text);
    resolve(DOMPurify.sanitize(rendered)); // TODO SAFE_FOR_JQUERY? (Typescript doesn't like it)
  });
}

/**
 * The markedjs extension which allows `$ ... $` inline LaTeX syntax.
 */
export const InlineLatex = {
  name: "inlineLatex",
  level: "inline" as const,

  start(src: string): number | undefined {
    const match = src.match(/\$(?!\$)/);
    if (match) {
      return match.index;
    } else {
      return undefined;
    }
  },

  tokenizer(src: string): InlineLatexToken | undefined {
    const match = src.match(/^\$(?!\$)((?:[^$\n]|\\[^\n])+)\$/);
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
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mml = (MathJax as any).tex2mml(token.inlineLatex, { display: false });
    return mml;
  },

};

/**
 * The markedjs extension which allows `$$ ... $$` block LaTeX syntax.
 */
export const BlockLatex = {
  name: "blockLatex",
  level: "block" as const,

  start(src: string): number | undefined {
    const match = src.match(/\$\$/);
    if (match) {
      return match.index;
    } else {
      return undefined;
    }
  },

  tokenizer(src: string): BlockLatexToken | undefined {
    const match = src.match(/^\$\$((?:[^$\n]|\\[^\n]|$[^$])+)\$\$/);
    if (match) {
      return {
        type: "blockLatex",
        raw: match[0],
        blockLatex: match[1],
      };
    } else {
      return undefined;
    }
  },

  renderer(token: BlockLatexToken): string {
    // TODO The DefinitelyTyped bindings for MathJax don't recognize
    // this function. What can we do about it?
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mml = (MathJax as any).tex2mml(token.blockLatex, { display: true });
    return mml;
  },

};

export interface InlineLatexToken {
  type: "inlineLatex";
  raw: string;
  inlineLatex: string;
}

export interface BlockLatexToken {
  type: "blockLatex";
  raw: string;
  blockLatex: string;
}
