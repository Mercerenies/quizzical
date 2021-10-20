
local function init()
  print("init() completed")
  return setmetatable({}, { __name="init_state" })
end

local function generate(state)
  print("Called generate() with state", state)
  return FreeformQuestion{
    text="Question text",
    response_type="text",
    answer="answer",
  }
end

return {
  init=init,
  generate=generate,
}
