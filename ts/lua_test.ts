

import * as Util from './util.js';
import { pointer, ErrorCode } from './lua/constants.js';
import { LuaBridge } from './lua/bridge.js';

export async function runTest(): Promise<void> {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));
  $("#submit").click(() => {
    const result = bridge.doString($("#lua-code").val() as string);
    if (result != ErrorCode.LUA_OK) {
      console.error(ErrorCode[result]);
    }
  });
  $("#example-file-run").click(() => {
    console.log(bridge.runSampleFile());
  });
}

