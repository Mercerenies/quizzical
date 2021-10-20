
/**
 * Thin wrapper to provide access to the C API calling Lua code.
 *
 * @module lua/bridge
 */

import LModule from '../lua_bridge.js';
import { pointer, ErrorCode, Type, LUA_REGISTRYINDEX } from './constants.js';
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

    // Run quizlib.lua
    this.doFile(LUA_QUIZLIB_FILENAME);

    // Set up registry
    this.pushLightUserdata(this.getUserdataPtr());
    this.newTable();
    this.setTable(LUA_REGISTRYINDEX);

  }

  private getAndThrowError(): never {
    const errorObject = this.toString(-1);
    this.pop(2);
    throw errorObject;
  }

  ////////////////////////////////////
  // WRAPPERS AROUND LIBC FUNCTIONS //
  ////////////////////////////////////

  malloc(size: number): pointer {
    return this.emModule._malloc(size);
  }

  free(memory: pointer): void {
    this.emModule._free(memory);
  }

  ////////////////////////////////////////
  // WRAPPERS AROUND C BRIDGE FUNCTIONS //
  ////////////////////////////////////////

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
  close(): void {
    this.methods.lua_bridge_free(this.state);
  }

  toString(index: number): string { // [-0, +1]
    return this.methods.lua_bridge_tostring(this.state, index);
  }

  pop(n?: number): void { // [-n, +0]
    this.methods.lua_bridge_pop(this.state, n ?? 1);
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

  getField(index: number, key: string): Type { // [-0, +1]
    return this.methods.lua_bridge_getfield(this.state, index, key);
  }

  setField(index: number, key: string): void { // [-1, +0]
    return this.methods.lua_bridge_setfield(this.state, index, key);
  }

  pushLightUserdata(ptr: pointer): void { // [-0, +1]
    return this.methods.lua_bridge_pushlightuserdata(this.state, ptr);
  }

  newTable(): void { // [-0, +1]
    return this.methods.lua_bridge_newtable(this.state);
  }

  setTable(index: number): void { // [-2, +0]
    return this.methods.lua_bridge_settable(this.state, index);
  }

  getTable(index: number): Type { // [-1, +1]
    return this.methods.lua_bridge_gettable(this.state, index);
  }

  call(nargs: number, nresults: number): void { // [-(nargs+1), +nresults]
    return this.methods.lua_bridge_call(this.state, nargs, nresults);
  }

  pcall(nargs: number, nresults: number): void { // [-(nargs+1), +nresults]
    const result = this.methods.lua_bridge_pcall(this.state, nargs, nresults);
    if (result != ErrorCode.LUA_OK) {
      this.getAndThrowError();
    }
  }

  getType(index: number): Type { // [-0, +0]
    return this.methods.lua_bridge_type(this.state, index);
  }

  getTop(): number { // [-0, +0]
    return this.methods.lua_bridge_gettop(this.state);
  }

  setTop(index: number): void { // [-?, +?]
    return this.methods.lua_bridge_settop(this.state, index);
  }

  pushNil(): void { // [-0, +1]
    return this.methods.lua_bridge_pushnil(this.state);
  }

  /**
   * As toString() but fails on values which are not strings or
   * numbers.
   */
  toStringPrim(index: number): string { // [-0, +0]
    return this.methods.lua_bridge_tostring_prim(this.state, index);
  }

  ///////////////////
  // OTHER HELPERS //
  ///////////////////

  /**
   * preserveStackSize() runs a block of code, ensuring that the size
   * of the Lua stack remains the same before and after the block. If
   * it does not, then a warning is printed and the stack size is
   * adjusted, either popping values or padding with nil.
   *
   * preserveStackSize() can be called with one or two arguments. If
   * called with one, it must be the block to run: a 0-ary function.
   * If called with two, then the first argument is a Boolean
   * specifying whether to print a warning on failure and the second
   * is the block.
   */
  preserveStackSize<T>(
    ...args: [block: () => T] | [shouldWarn: boolean, block: () => T]
  ): T {
    let shouldWarn: boolean;
    let block: () => T;
    if (args.length === 2) {
      shouldWarn = args[0];
      block = args[1];
    } else {
      shouldWarn = true;
      block = args[0];
    }
    const stackSize = this.getTop();
    let result: T;
    try {
      result = block();
    } finally {
      if (this.getTop() != stackSize) {
        // Reset the stack size
        if (shouldWarn) {
          console.warn(`preserveStackSize() expected a stack size of ${stackSize}, got ${this.getTop()}!`);
        }
        this.setTop(stackSize);
      }
    }
    return result;
  }

  getLocalRegistry(): void { // [-0, +1]
    this.pushLightUserdata(this.getUserdataPtr());
    this.getTable(LUA_REGISTRYINDEX);
  }

  static async create(): Promise<LuaBridge> {
    const emModule = await LModule();
    return new LuaBridge(emModule);
  }

}

export const LUA_QUIZLIB_FILENAME = "/scripting/quizlib.lua";
