
export function enterToButton(textbox: JQuery<HTMLElement>, button: JQuery<HTMLElement>): void {
  textbox.keypress(function(e) {
    if (e.which == 13) {
      button.trigger('click');
    }
  });
}
