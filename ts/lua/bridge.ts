
/**
 * Thin wrapper to provide access to the C API calling Lua code.
 *
 * @module lua/bridge
 */

import LModule from '../lua_bridge.js';
import { pointer, NULL, ErrorCode } from './constants.js';
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

  pop(n?: number): void { // [-n, +0]
    this.methods.lua_bridge_pop(this.state, n ?? 1);
  }

  static async create(): Promise<LuaBridge> {
    const emModule = await LModule();
    return new LuaBridge(emModule);
  }

}

export const LUA_QUIZLIB_FILENAME = "/scripting/quizlib.lua";
