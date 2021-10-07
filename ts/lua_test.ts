
import LModule from './lua_bridge.js';
import * as Util from './util.js';

type pointer = number;

class LuaBridge {
  private emModule: LModule.LuaBridgeModule;
  private lua_bridge_init: () => pointer;
  private lua_bridge_free: (state: pointer) => void;
  private lua_bridge_dostring: (state: pointer, input: string) => void;
  private state: pointer;

  constructor(emModule: LModule.LuaBridgeModule) {
    this.emModule = emModule;

    this.lua_bridge_init = this.emModule.cwrap('lua_bridge_init', 'number', []);
    this.lua_bridge_free = this.emModule.cwrap('lua_bridge_free', null, ['number']);
    this.lua_bridge_dostring = this.emModule.cwrap('lua_bridge_dostring', null, ['number', 'string']);

    this.state = this.lua_bridge_init();
  }

  free(): void {
    this.lua_bridge_free(this.state);
  }

  dostring(str: string): void {
    this.lua_bridge_dostring(this.state, str);
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
    bridge.dostring($("#lua-code").val() as string);
  });
}

