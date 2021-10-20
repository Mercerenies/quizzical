
import * as Util from './util.js';
import { LuaBridge } from './lua/bridge.js';
import { FileSource } from './lua/source.js';
import { LuaGenerator } from './question/generator/lua.js';

export async function runTest(): Promise<void> {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));

  $("#submit").click(() => {
    bridge.doString($("#lua-code").val() as string);
  });

  // DEBUG CODE
  let generator: LuaGenerator | undefined = new LuaGenerator(bridge, new FileSource("/scripting/example.lua"));

  $("#example-file-run").click(() => {
    if (generator === undefined) {
      throw "Generator is already closed";
    }
    console.log(generator.generate());
  });

  $("#example-file-close").click(() => {
    if (generator !== undefined) {
      console.log("Closing...");
      generator.close();
      generator = undefined;
    }
  });

}
