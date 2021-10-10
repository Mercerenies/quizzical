
/**
 * Thin wrapper to provide access to the C API calling Lua code.
 *
 * @module lua/bridge
 */

import LModule from '../lua_bridge.js';
import { pointer, ErrorCode } from './constants.js';
import { Methods, initMethods } from './methods.js';

/**
 * LuaBridge is the thinnest wrapper class this API makes available to
 * access the C code which interfaces with Lua, short of interfacing
 * directly with Emscripten.
 */
export class LuaBridge {
  private emModule: LModule.LuaBridgeModule;
  private methods: Methods;
  private state: pointer;

  /**
   * Constructs and initializes a LuaBridge from a LuaBridgeModule
   * instance. The static method LuaBridge.create can be used to
   * create the module instance as well.
   */
  constructor(emModule: LModule.LuaBridgeModule) {
    this.emModule = emModule;
    this.methods = initMethods(this.emModule);
    this.state = this.methods.lua_bridge_init();
  }

  /**
   * Free the LuaBridge and all associated resources. No other methods
   * should be called on this object after this one.
   */
  free(): void {
    this.methods.lua_bridge_free(this.state);
  }

  doString(str: string): ErrorCode {
    return this.methods.lua_bridge_dostring(this.state, str);
  }

  // DEBUG CODE
  runSampleFile(): ErrorCode {
    return this.methods.lua_bridge_run_example_file(this.state);
  }

  static async create(): Promise<LuaBridge> {
    const emModule = await LModule();
    return new LuaBridge(emModule);
  }

}
