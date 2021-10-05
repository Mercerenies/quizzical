
// @ts-nocheck

import { default as LModule } from './luatest.mjs';

export async function runTest() {
  const LM = await LModule();
  console.log(LM);

  const test = LM.cwrap('test', 'number', []);
  const lua_test = LM.cwrap('lua_test', 'number', []);
  console.log(test());
  console.log(lua_test());

}

///// Get typescript to play nice (also make clean task)
