
/**
 * QuestionGenerator which supplies questions from a given Lua script.
 *
 * @module question/generator/lua
 */

import { LuaBridge } from '../../lua/bridge.js';
import { LuaSource } from '../../lua/source.js';
import { pointer } from '../../lua/constants.js';
import { Question } from '../../question.js';
import { FreeformQuestion } from '../freeform_question.js';
import { ExactAnswer } from '../answer.js';
import { QuestionGenerator } from '../generator.js';

const generator_object = "generator_object";
const init_state = "init_state";

// NOTE: All public methods on LuaGenerator are guaranteed to respect
// the LuaBridge stack in the following way. After the termination of
// any method in this class, the stack will be left exactly as it was
// found at the start of the method, even in the case of a Javascript
// exception. This guarantee is NOT true for private methods.
export class LuaGenerator extends QuestionGenerator {
  private bridge: LuaBridge;
  private registryIndex: pointer;

  constructor(bridge: LuaBridge, source: LuaSource) {
    super();
    this.bridge = bridge;

    // Allocate some memory for use as light userdata.
    this.registryIndex = bridge.malloc(1);

    bridge.preserveStackSize(() => {
      const ebp = bridge.getTop();

      this.createLocalData();
      this.getLocalData();

      // Run the source code itself
      source.run(bridge, 1);
      bridge.setField(ebp + 2, generator_object);

      // Run the initializer
      bridge.getField(ebp + 2, generator_object);
      bridge.getField(-1, "init");
      bridge.pcall(0, 1);
      bridge.setField(ebp + 1, init_state);

      bridge.pop(3);

    });

  }

  private createLocalData(): void { // [-0, +0]
    this.bridge.getLocalRegistry();
    this.bridge.pushLightUserdata(this.registryIndex);
    this.bridge.newTable();
    this.bridge.setTable(-3);
    this.bridge.pop(1);
  }

  private getLocalData(): void { // [-0, +2]
    // Pushes LuaBridge local registry AND our local data table.
    this.bridge.getLocalRegistry();
    this.bridge.pushLightUserdata(this.registryIndex);
    this.bridge.getTable(-2);
  }

  generate(): Question {
    this.bridge.preserveStackSize(() => {
      const ebp = this.bridge.getTop();

      this.getLocalData();
      this.bridge.getField(ebp + 2, generator_object);

      this.bridge.getField(ebp + 3, "generate");
      this.bridge.getField(ebp + 2, init_state);
      this.bridge.pcall(1, 1);

      this.bridge.pop(4); // Should be 3
    });

    // Not done yet :(
    return new FreeformQuestion("Test", "text", new ExactAnswer("Answer"));
  }

  close(): void {
    super.close();
    this.bridge.preserveStackSize(() => {
      const ebp = this.bridge.getTop();

      this.bridge.getLocalRegistry();
      this.bridge.pushLightUserdata(this.registryIndex);
      this.bridge.pushNil();
      this.bridge.setTable(ebp + 1);
      this.bridge.pop(1);
    });
  }

}
