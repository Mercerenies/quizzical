
class SSEServer
  attr_reader :connections

  def initialize
    @connections = {}
  end

  def purge!
    @connections.reject! { |k, v| v.closed? }
  end

  def listen(uuid, conn)
    @connections[uuid] = conn
  end

  def [](uuid)
    @connections[uuid]
  end

  def []=(uuid, conn)
    @connections[uuid] = conn
  end

  def each(&block)
    @connections.each_value(&block)
  end

end
