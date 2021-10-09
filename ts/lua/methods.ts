
// WARNING: This file is automatically built by LuaMethods.raku and
// should not be modified by hand!

import LModule from '../lua_bridge.js';
import { pointer, ErrorCode } from './constants.js';

export interface Methods {
  lua_bridge_init: () => pointer;
  lua_bridge_free: (L: pointer) => void;
  lua_bridge_dostring: (L: pointer, string: string) => number;
  lua_bridge_run_example_file: (L: pointer) => number;
}

export function initMethods(emModule: LModule.LuaBridgeModule): Methods {
  return {
    lua_bridge_init: emModule.cwrap("lua_bridge_init", "number", []),
    lua_bridge_free: emModule.cwrap("lua_bridge_free", null, ["number"]),
    lua_bridge_dostring: emModule.cwrap("lua_bridge_dostring", "number", ["number", "string"]),
    lua_bridge_run_example_file: emModule.cwrap("lua_bridge_run_example_file", "number", ["number"]),
  }
}

