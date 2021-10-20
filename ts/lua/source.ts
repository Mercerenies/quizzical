
import { LuaBridge } from './bridge.js';

/**
 * A LuaSource provides a way to run arbitrary Lua code from some
 * location, such as a file or a string.
 *
 * Code run by a LuaSource should be run in protected mode (i.e. using
 * Lua's pcall). After a call to run(), one of two things should be
 * true.
 *
 * 1. The code completed successfully. nresults results were pushed.
 *
 * 2. The code failed. In this case, a Javascript exception should be
 * raised and the stack should be left as it was found.
 */
export interface LuaSource {
  run(bridge: LuaBridge, nresults: number): void;
}

export class StringSource implements LuaSource {
  readonly code: string;

  constructor(code: string) {
    this.code = code;
  }

  run(bridge: LuaBridge, nresults: number): void {
    bridge.doString(this.code, nresults);
  }

}

export class FileSource implements LuaSource {
  readonly filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  run(bridge: LuaBridge, nresults: number): void {
    bridge.doFile(this.filename, nresults);
  }

}
