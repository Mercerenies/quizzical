
local function init()
  return {}
end

local function generate(state)
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
