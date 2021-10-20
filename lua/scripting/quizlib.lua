
-- Standard library for the game.

local FreeformQuestionMeta = {
  __name = "FreeformQuestion",
}

function FreeformQuestion(opts)
  return setmetatable({
    type="FreeformQuestion",
    args={opts.text, opts.response_type, opts.answer}
  }, FreeformQuestionMeta)
end
