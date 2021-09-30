
// This is only used to test the renderer and can likely be deleted
// later.
//
// (DEBUG CODE)

import { initialize, render } from './renderer.js';
import * as Util from './util.js';

export function renderTest() {

  initialize();
  Util.enterToButton($("#text"), $("#submit"));

  $("#submit").click(doMarkdown);

  render(String.raw`<br/>This is an **equation**: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`)
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
  const rendered = await render(text);
  $("#content").html(rendered);
}
