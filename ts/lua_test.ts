

import * as Util from './util.js';
import { LuaBridge } from './lua/bridge.js';

export async function runTest(): Promise<void> {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));
  $("#submit").click(() => {
    bridge.doString($("#lua-code").val() as string);
  });

  // DEBUG CODE
  $("#example-file-run").click(() => {
    bridge.doFile("/scripting/example.lua", 1);
    console.log(bridge.toString(-1));
    bridge.pop();
  });

}

