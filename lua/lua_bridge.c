
#include <stdio.h>
#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"
#include "emscripten.h"

// The stack effect notation in this file is borrowed from the Lua
// standard library docs. See
// https://www.lua.org/manual/5.4/manual.html#4.6 for more details.

const char* USERDATA_PTR = "This pointer is used by lua_bridge.c as light userdata to "
                           "index into the Lua registry.";

EMSCRIPTEN_KEEPALIVE
void* lua_bridge_userdata_ptr() {
  // Returns a pointer unique to this program, useful for indexing
  // into the Lua registry.
  return (void*)USERDATA_PTR;
}

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
  return luaL_tolstring(L, index, NULL);
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

EMSCRIPTEN_KEEPALIVE
void lua_bridge_setfield(lua_State* L, int index, const char* k) { // [-1, +0, e]
  lua_setfield(L, index, k);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_pushlightuserdata(lua_State* L, void* p) { // [-0, +1, -]
  lua_pushlightuserdata(L, p);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_newtable(lua_State* L) { // [-0, +1, m]
  lua_newtable(L);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_settable(lua_State* L, int index) { // [-2, +0, e]
  lua_settable(L, index);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_gettable(lua_State* L, int index) { // [-1, +1, e]
  return lua_gettable(L, index);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_call(lua_State* L, int nargs, int nresults) { // [-(nargs+1), +nresults, e]
  lua_call(L, nargs, nresults);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_pcall(lua_State* L, int nargs, int nresults) { // [-(nargs+1), +nresults, -]
  return lua_pcall(L, nargs, nresults, 0);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_type(lua_State* L, int index) { // [-0, +0, -]
  return lua_type(L, index);
}

EMSCRIPTEN_KEEPALIVE
int lua_bridge_gettop(lua_State* L) { // [-0, +0, -]
  return lua_gettop(L);
}

EMSCRIPTEN_KEEPALIVE
void lua_bridge_settop(lua_State* L, int index) { // [-?, +?, e]
  lua_settop(L, index);
}
