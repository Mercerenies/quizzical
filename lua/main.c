
#include <stdio.h>
#include "lua.h"
#include "lauxlib.h"
#include "lualib.h"
#include "emscripten.h"

int EMSCRIPTEN_KEEPALIVE test() {
  return 42;
}

int EMSCRIPTEN_KEEPALIVE lua_test() {
  lua_State* L = luaL_newstate();
  luaopen_base(L);
  luaopen_table(L);
  luaopen_string(L);
  luaopen_math(L);

  luaL_dostring(L, "my_global_var = 42");
  lua_getglobal(L, "my_global_var");
  int result = lua_tointeger(L, -1);
  lua_pop(L, 1);
  return result;
}
