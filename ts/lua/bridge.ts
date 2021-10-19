
/**
 * Thin wrapper to provide access to the C API calling Lua code.
 *
 * @module lua/bridge
 */

import LModule from '../lua_bridge.js';
import { pointer, ErrorCode } from './constants.js';
import { Methods, initMethods } from './methods.js';

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

    this.doFile(LUA_QUIZLIB_FILENAME);

  }

  private getAndThrowError(): never {
    const errorObject = this.toString(-1);
    this.pop(1);
    throw errorObject;
  }

  /**
   * Gets a unique numerical value, useful for indexing into tables in
   * a unique position. Before using this as a table key, it is
   * recommended to convert it to light userdata.
   */
  getUserdataPtr(): pointer {
    return this.methods.lua_bridge_userdata_ptr();
  }

  /**
   * Free the LuaBridge and all associated resources. No other methods
   * should be called on this object after this one.
   */
  free(): void {
    this.methods.lua_bridge_free(this.state);
  }

  toString(index: number): string { // [-0, +0]
    return this.methods.lua_bridge_tostring(this.state, index);
  }

  doString(str: string, nresults?: number): void { // [-0, +nresults]
    const result = this.methods.lua_bridge_dostring(this.state, str, nresults ?? 0);
    if (result != ErrorCode.LUA_OK) {
      this.getAndThrowError();
    }
  }

  doFile(filename: string, nresults?: number): void { // [-0, +nresults]
    const result = this.methods.lua_bridge_dofile(this.state, filename, nresults ?? 0);
    if (result != ErrorCode.LUA_OK) {
      this.getAndThrowError();
    }
  }

  getField(index: number, key: string): number { // [-0, +1, e]
    // TODO This returns a type. That should be an enum
    return this.methods.lua_bridge_getfield(this.state, index, key);
  }

  pop(n?: number): void { // [-n, +0]
    this.methods.lua_bridge_pop(this.state, n ?? 1);
  }

  static async create(): Promise<LuaBridge> {
    const emModule = await LModule();
    return new LuaBridge(emModule);
  }

}

export const LUA_QUIZLIB_FILENAME = "/scripting/quizlib.lua";
