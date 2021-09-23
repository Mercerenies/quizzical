
require 'forwardable'

class SSEConnection
  extend Forwardable

  attr_reader :stream

  def_delegators :stream, :close, :closed?

  def initialize(stream)
    @stream = stream
  end

  def self.establish(app, &block)
    app.stream(:keep_open) do |conn|
      stream = SSEConnection.new(conn)
      block.call stream
    end
  end

  def <<(text)
    # If it looks like JSON, then JSONify it
    text = text.to_json if text.is_a? Array or text.is_a? Hash

    msg = "data: #{text}\n\n"
    stream << msg

  end

end
