
interface LuatestModule extends EmscriptenModule {
  ccall: typeof ccall;
  cwrap: typeof cwrap;
}

export default function Module(): Promise<LuatestModule>;

