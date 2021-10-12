

import * as Util from './util.js';
import { pointer, ErrorCode } from './lua/constants.js';
import { LuaBridge } from './lua/bridge.js';

export async function runTest(): Promise<void> {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));
  $("#submit").click(() => {
    bridge.doString($("#lua-code").val() as string);
  });
  $("#example-file-run").click(() => {
    console.log(bridge.doFile("/scripting/example.lua")); // DEBUG CODE
  });
}

