
CC=emcc
CCFLAGS=-Wall -s WASM=1 -s EXPORT_ALL=1 -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'

all:	lua luatest.wasm

clean:
	rm luatest.html luatest.mjs *.wasm

lua:
	$(MAKE) -C lua-5.4.0/

luatest.wasm:	luatest.c
	$(CC) $(CCFLAGS) -I./lua-5.4.0/ -L./lua-5.4.0/ -o luatest.mjs luatest.c -llua
