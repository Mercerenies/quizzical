
print("A")

local function init()
  return {}
end

local function generate(state)
  return {FreeformQuestion, "Text", "number", "answer"}
  -- return {MultichoiceQuestion, "Text", "option1", "option2", "option3", "option4", "answer"}
end

-- return {
--   quizzical=true,
--   init=init,
--   state=state,
-- }

print(100)
