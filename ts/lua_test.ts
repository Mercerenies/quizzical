
import LModule from './lua_bridge.js';
import * as Util from './util.js';
import { pointer, ErrorCode } from './lua/constants.js';

class LuaBridge {
  private emModule: LModule.LuaBridgeModule;
  private lua_bridge_init: () => pointer;
  private lua_bridge_free: (state: pointer) => void;
  private lua_bridge_dostring: (state: pointer, input: string) => number;
  private lua_bridge_run_example_file: (state: pointer) => number;
  private state: pointer;

  constructor(emModule: LModule.LuaBridgeModule) {
    this.emModule = emModule;

    this.lua_bridge_init = this.emModule.cwrap('lua_bridge_init', 'number', []);
    this.lua_bridge_free = this.emModule.cwrap('lua_bridge_free', null, ['number']);
    this.lua_bridge_dostring = this.emModule.cwrap('lua_bridge_dostring', 'number', ['number', 'string']);
    this.lua_bridge_run_example_file = this.emModule.cwrap('lua_bridge_run_example_file', 'number', ['number']);

    this.state = this.lua_bridge_init();
  }

  free(): void {
    this.lua_bridge_free(this.state);
  }

  dostring(str: string): ErrorCode {
    return this.lua_bridge_dostring(this.state, str);
  }

  // DEBUG CODE
  runSampleFile(): ErrorCode {
    return this.lua_bridge_run_example_file(this.state);
  }

  static async create(): Promise<LuaBridge> {
    let emModule = await LModule();
    return new LuaBridge(emModule);
  }

}

export async function runTest() {
  const bridge = await LuaBridge.create();
  Util.enterToButton($("#lua-code"), $("#submit"));
  $("#submit").click(() => {
    const result = bridge.dostring($("#lua-code").val() as string);
    if (result != ErrorCode.LUA_OK) {
      console.error(ErrorCode[result]);
    }
  });
  $("#example-file-run").click(() => {
    bridge.runSampleFile();
  });
}

