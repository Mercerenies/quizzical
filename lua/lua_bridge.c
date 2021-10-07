
#include <stdio.h>
#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"
#include "emscripten.h"

lua_State* EMSCRIPTEN_KEEPALIVE lua_bridge_init() {
  lua_State* L = luaL_newstate();
  luaopen_base(L);
  luaopen_table(L);
  luaopen_string(L);
  luaopen_math(L);
  return L;
}

void EMSCRIPTEN_KEEPALIVE lua_bridge_free(lua_State* L) {
  lua_close(L);
}

int EMSCRIPTEN_KEEPALIVE lua_bridge_dostring(lua_State* L, const char* string) {
  int result = luaL_loadstring(L, string);
  if (result) {
    return result;
  }
  return lua_pcall(L, 0, 0, 0);
}

// DEBUG CODE
int EMSCRIPTEN_KEEPALIVE lua_bridge_run_example_file(lua_State* L) {
  int result = luaL_loadfile(L, "/scripting/example.lua");
  if (result) {
    return result;
  }
  return lua_pcall(L, 0, 0, 0);
}
