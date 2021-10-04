
/**
 * Sets up the events so that, if the user presses ENTER in textbox,
 * the page will simulate a click on button.
 *
 * @param textbox a JQuery selector for an input box
 * @param button a JQuery selector for a button
 */
export function enterToButton(textbox: JQuery<HTMLElement>, button: JQuery<HTMLElement>): void {
  textbox.keypress(function(e) {
    if (e.which == 13) {
      button.trigger('click');
    }
  });
}

/**
 * Enables or disables a button.
 *
 * @param button a JQuery selector for a button
 * @param state whether the button should be enabled (true) or disabled (false)
 */
export function setButtonEnabled(button: JQuery<HTMLElement>, state: boolean): void {
  const disabled = (state ? null : "");
  button.attr('disabled', disabled);
  button.attr('aria-disabled', disabled);
}

/**
 * A random sublist of the iterable given. Every element has a 50%
 * chance of being included. The resulting sublist will contain
 * elements in the same order as the original.
 * @param collection the input collection
 * @return a random sublist of the original input collection
 */
export function randomSublist<T>(collection: Iterable<T>): T[] {
  const results = [];
  for (const elem of collection) {
    if (Math.random() < 0.5) {
      results.push(elem);
    }
  }
  return results;
}
