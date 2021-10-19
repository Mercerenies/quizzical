
export type pointer = number;

export const NULL = 0;
export const LUA_MULTRET = -1;
export const LUAI_MAXSTACK = 1000000; // This is bad if we're somehow running on a 16-bit architecture
export const LUA_REGISTRYINDEX = -LUAI_MAXSTACK - 1000;

// These constants are borrowed from lua.h.

export enum ErrorCode {
  LUA_OK = 0,
  LUA_YIELD = 1,
  LUA_ERRRUN = 2,
  LUA_ERRSYNTAX = 3,
  LUA_ERRMEM = 4,
  LUA_ERRERR = 5,
}
