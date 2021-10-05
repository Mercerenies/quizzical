
CC=emcc
CCFLAGS=-Wall -s WASM=1 -s EXPORT_ALL=1 -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'

all:	lua # main.wasm

clean:
	rm main.html main.js *.wasm

lua:
	$(MAKE) -C lua-5.4.0/

#main.wasm:	main.c
#	$(CC) $(CCFLAGS) -I./lua-5.4.0/ -L./lua-5.4.0/ -o main.js main.c -llua
