
export type pointer = number;

export const NULL = 0;

// These constants are borrowed from lua.h.

export const LUA_MULTRET = -1;
export const LUAI_MAXSTACK = 1000000; // This is bad if we're somehow running on a 16-bit architecture
export const LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1000;
export const LUA_NUMTYPES = 9;

export enum ErrorCode {
  LUA_OK = 0,
  LUA_YIELD = 1,
  LUA_ERRRUN = 2,
  LUA_ERRSYNTAX = 3,
  LUA_ERRMEM = 4,
  LUA_ERRERR = 5,
}

export enum Type {
  LUA_TNONE = -1,
  LUA_TNIL = 0,
  LUA_TBOOLEAN = 1,
  LUA_TLIGHTUSERDATA = 2,
  LUA_TNUMBER = 3,
  LUA_TSTRING = 4,
  LUA_TTABLE = 5,
  LUA_TFUNCTION = 6,
  LUA_TUSERDATA = 7,
  LUA_TTHREAD = 8,
}
