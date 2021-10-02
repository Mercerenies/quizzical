
/**
 * A Displayable promises to take a DOM element and replace it (via
 * replaceWith) with some contents to be determined by the
 * Displayable.
 */
export interface Displayable {

  display(target: JQuery<HTMLElement>): Promise<void>;

}

export class ConstantDisplayable implements Displayable {
  readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  display(target: JQuery<HTMLElement>): Promise<void> {
    target.replaceWith($(this.text));
    return Promise.resolve(undefined);
  }

}

export class HTTPGetDisplayable implements Displayable {
  readonly httpTarget: string;
  readonly callback: (elt: JQuery<HTMLElement>) => void;

  constructor(target: string, callback?: (elt: JQuery<HTMLElement>) => void) {
    this.httpTarget = target;
    if (callback === undefined) {
      this.callback = function() {
        // No action.
      };
    } else {
      this.callback = callback;
    }
  }

  async display(target: JQuery<HTMLElement>): Promise<void> {
    const replacement = await $.get(this.httpTarget);
    this.callback(replacement);
    target.replaceWith(replacement);
  }

}
