
import * as Util from './util.js';
import { LuaBridge } from './lua/bridge.js';
import { LUA_REGISTRYINDEX } from './lua/constants.js';

const GENERATOR_INDEX = "lua_test.GENERATOR_INDEX";
const GENERATOR_STATE_INDEX = "lua_test.GENERATOR_STATE_INDEX";

export async function runTest(): Promise<void> {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));

  $("#submit").click(() => {
    bridge.doString($("#lua-code").val() as string);
  });

  // DEBUG CODE
  getLocalReg(bridge);
  bridge.doFile("/scripting/example.lua", 1);
  bridge.getField(2, "init");
  bridge.pcall(0, 1);
  bridge.setField(1, GENERATOR_STATE_INDEX);
  bridge.setField(1, GENERATOR_INDEX);
  bridge.pop(1);

  $("#example-file-run").click(() => {

    getLocalReg(bridge);
    bridge.getField(1, GENERATOR_INDEX);
    bridge.getField(2, "generate");
    bridge.getField(1, GENERATOR_STATE_INDEX);
    bridge.pcall(1, 1);
    console.log(bridge.getType(-1));
    console.log(bridge.toString(-1));
    bridge.pop(2);

    ///// Analyze the result (get toString working properly on all values using luaL_tolstring)

  });

}

function getLocalReg(bridge: LuaBridge) { // [-0, +1]
  bridge.pushLightUserdata(bridge.getUserdataPtr());
  bridge.getTable(LUA_REGISTRYINDEX);
}
