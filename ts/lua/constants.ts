
export type pointer = number;

// These constants are borrowed from lua.h.

export enum ErrorCode {
  LUA_OK = 0,
  LUA_YIELD = 1,
  LUA_ERRRUN = 2,
  LUA_ERRSYNTAX = 3,
  LUA_ERRMEM = 4,
  LUA_ERRERR = 5,
}
