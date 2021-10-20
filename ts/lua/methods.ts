
// WARNING: This file is automatically built by LuaMethods.raku and
// should not be modified by hand!

import LModule from '../lua_bridge.js';
import { pointer } from './constants.js';

export interface Methods {
  lua_bridge_userdata_ptr: () => pointer;
  lua_bridge_init: () => pointer;
  lua_bridge_tostring: (L: pointer, index: number) => string;
  lua_bridge_pop: (L: pointer, n: number) => void;
  lua_bridge_free: (L: pointer) => void;
  lua_bridge_dostring: (L: pointer, string: string, nresults: number) => number;
  lua_bridge_dofile: (L: pointer, filename: string, nresults: number) => number;
  lua_bridge_getfield: (L: pointer, index: number, k: string) => number;
  lua_bridge_setfield: (L: pointer, index: number, k: string) => void;
  lua_bridge_pushlightuserdata: (L: pointer, p: pointer) => void;
  lua_bridge_newtable: (L: pointer) => void;
  lua_bridge_settable: (L: pointer, index: number) => void;
  lua_bridge_gettable: (L: pointer, index: number) => number;
  lua_bridge_call: (L: pointer, nargs: number, nresults: number) => void;
  lua_bridge_pcall: (L: pointer, nargs: number, nresults: number) => number;
  lua_bridge_type: (L: pointer, index: number) => number;
  lua_bridge_gettop: (L: pointer) => number;
  lua_bridge_settop: (L: pointer, index: number) => void;
  lua_bridge_pushnil: (L: pointer) => void;
}

export function initMethods(emModule: LModule.LuaBridgeModule): Methods {
  return {
    lua_bridge_userdata_ptr: emModule.cwrap("lua_bridge_userdata_ptr", "number", []),
    lua_bridge_init: emModule.cwrap("lua_bridge_init", "number", []),
    lua_bridge_tostring: emModule.cwrap("lua_bridge_tostring", "string", ["number", "number"]),
    lua_bridge_pop: emModule.cwrap("lua_bridge_pop", null, ["number", "number"]),
    lua_bridge_free: emModule.cwrap("lua_bridge_free", null, ["number"]),
    lua_bridge_dostring: emModule.cwrap("lua_bridge_dostring", "number", ["number", "string", "number"]),
    lua_bridge_dofile: emModule.cwrap("lua_bridge_dofile", "number", ["number", "string", "number"]),
    lua_bridge_getfield: emModule.cwrap("lua_bridge_getfield", "number", ["number", "number", "string"]),
    lua_bridge_setfield: emModule.cwrap("lua_bridge_setfield", null, ["number", "number", "string"]),
    lua_bridge_pushlightuserdata: emModule.cwrap("lua_bridge_pushlightuserdata", null, ["number", "number"]),
    lua_bridge_newtable: emModule.cwrap("lua_bridge_newtable", null, ["number"]),
    lua_bridge_settable: emModule.cwrap("lua_bridge_settable", null, ["number", "number"]),
    lua_bridge_gettable: emModule.cwrap("lua_bridge_gettable", "number", ["number", "number"]),
    lua_bridge_call: emModule.cwrap("lua_bridge_call", null, ["number", "number", "number"]),
    lua_bridge_pcall: emModule.cwrap("lua_bridge_pcall", "number", ["number", "number", "number"]),
    lua_bridge_type: emModule.cwrap("lua_bridge_type", "number", ["number", "number"]),
    lua_bridge_gettop: emModule.cwrap("lua_bridge_gettop", "number", ["number"]),
    lua_bridge_settop: emModule.cwrap("lua_bridge_settop", null, ["number", "number"]),
    lua_bridge_pushnil: emModule.cwrap("lua_bridge_pushnil", null, ["number"]),
  };
}

