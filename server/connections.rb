
require_relative 'codes'

# TODO This needs to have expiry date on things
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
    Codes::generate(self).tap do |code|
      @data[code] = conn
    end
  end

end
