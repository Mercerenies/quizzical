
-- Standard library for the game.

function FreeformQuestion(opts)
  return {
    type="FreeformQuestion",
    args={opts.text, opts.response_type, opts.answer}
  }
end
