
/**
 * Thin wrapper to provide access to the C API calling Lua code.
 *
 * @module lua/bridge
 */

import LModule from '../lua_bridge.js';
import { pointer, ErrorCode } from './constants.js';

/**
 * LuaBridge is the thinnest wrapper class this API makes available to
 * access the C code which interfaces with Lua, short of interfacing
 * directly with Emscripten.
 */
export class LuaBridge {
  private emModule: LModule.LuaBridgeModule;
  private lua_bridge_init: () => pointer;
  private lua_bridge_free: (state: pointer) => void;
  private lua_bridge_dostring: (state: pointer, input: string) => number;
  private lua_bridge_run_example_file: (state: pointer) => number;
  private state: pointer;

  /**
   * Constructs and initializes a LuaBridge from a LuaBridgeModule
   * instance. The static method LuaBridge.create can be used to
   * create the module instance as well.
   */
  constructor(emModule: LModule.LuaBridgeModule) {
    this.emModule = emModule;

    this.lua_bridge_init = this.emModule.cwrap('lua_bridge_init', 'number', []);
    this.lua_bridge_free = this.emModule.cwrap('lua_bridge_free', null, ['number']);
    this.lua_bridge_dostring = this.emModule.cwrap('lua_bridge_dostring', 'number', ['number', 'string']);
    this.lua_bridge_run_example_file = this.emModule.cwrap('lua_bridge_run_example_file', 'number', ['number']);

    this.state = this.lua_bridge_init();
  }

  /**
   * Free the LuaBridge and all associated resources. No other methods
   * should be called on this object after this one.
   */
  free(): void {
    this.lua_bridge_free(this.state);
  }

  doString(str: string): ErrorCode {
    return this.lua_bridge_dostring(this.state, str);
  }

  // DEBUG CODE
  runSampleFile(): ErrorCode {
    return this.lua_bridge_run_example_file(this.state);
  }

  static async create(): Promise<LuaBridge> {
    const emModule = await LModule();
    return new LuaBridge(emModule);
  }

}
