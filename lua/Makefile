
CC=emcc
CCFLAGS=-Wall -s WASM=1 -s EXPORT_ALL=1 -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -s EXPORT_ES6=1 -s MODULARIZE=1

all:	lua lua_bridge.wasm

clean:
	rm lua_bridge.mjs *.wasm

lua:
	$(MAKE) -C lua-5.4.0/

lua_bridge.wasm:	lua_bridge.c
	$(CC) $(CCFLAGS) -I./lua-5.4.0/ -L./lua-5.4.0/ -o lua_bridge.mjs lua_bridge.c -llua
