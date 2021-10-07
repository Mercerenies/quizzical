
declare namespace Module {
  export interface LuaBridgeModule extends EmscriptenModule {
    ccall: typeof ccall;
    cwrap: typeof cwrap;
  }
}

declare function Module(): Promise<Module.LuaBridgeModule>;

export default Module;
