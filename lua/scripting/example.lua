
local function init()
  print("init() completed")
  return {}
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
