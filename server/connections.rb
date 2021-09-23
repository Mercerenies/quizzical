
require_relative 'codes'

class Connections

  def initialize
    @data = {}
  end

  def include?(code)
    @data.include?(code)
  end

  def [](code)
    @data[code]
  end

  def listen(conn)
    purge!
    Codes::generate(self).tap do |code|
      @data[code] = conn
    end
  end

  def purge!
    @data.reject! { |k, v| v.closed? }
  end

end
