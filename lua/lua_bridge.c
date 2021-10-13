
#include <stdio.h>
#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"
#include "emscripten.h"

// The stack effect notation in this file is borrowed from the Lua
// standard library docs. See
// https://www.lua.org/manual/5.4/manual.html#4.6 for more details.

EMSCRIPTEN_KEEPALIVE
lua_State* lua_bridge_init() { // [-0, +0, -]
  lua_State* L = luaL_newstate();
  luaopen_base(L);
  luaopen_table(L);
  luaopen_string(L);
  luaopen_math(L);

  lua_pop(L, 4);
  return L;
}

EMSCRIPTEN_KEEPALIVE
const char* lua_bridge_tostring(lua_State* L, int index) { // [-0, +0, m]
  return lua_tostring(L, index);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_pop(lua_State* L, int n) { // [-n, +0, e]
  lua_pop(L, n);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_free(lua_State* L) { // [-0, +0, -]
  lua_close(L);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_dostring(lua_State* L, const char* string, int nresults) { // [-0, +nresults|1, -]
  // Pushes error object in case of error
  int result = luaL_loadstring(L, string);
  if (result) {
    return result;
  }
  return lua_pcall(L, 0, nresults, 0);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_dofile(lua_State* L, const char* filename, int nresults) { // [-0, +nresults|1, m]
  // Pushes error object in case of error
  int result = luaL_loadfile(L, filename);
  if (result) {
    return result;
  }
  return lua_pcall(L, 0, nresults, 0);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_getfield(lua_State* L, int index, const char* k) { // [-0, +1, e]
  // Returns the type of the returned field
  return lua_getfield(L, index, k);
}
