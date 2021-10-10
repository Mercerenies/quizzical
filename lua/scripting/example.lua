
print("A")

local function init()
  return {}
end

local function generate(state)
  return {
    type="FreeformQuestion",
    args={"Text", "number", "answer"},
  }
end

-- return {
--   quizzical=true,
--   init=init,
--   state=state,
-- }

print(100)
