
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

void EMSCRIPTEN_KEEPALIVE lua_bridge_dostring(lua_State* L, const char* string) {
  luaL_loadstring(L, string) || lua_pcall(L, 0, 0, 0);
}
