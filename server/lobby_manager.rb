
require_relative 'codes'

# Manages lobbies for the game. A lobby consists of a single, unique
# host and zero or more players. The host and players are identified
# by the unique session identifier (see the UUID module).
class LobbyManager

  # TODO Purge old data automatically

  def initialize
    @code_hash = {}
    @uuid_hash = {}
  end

  def start_new_lobby(host_uuid)
    delete_lobby host_uuid # Delete existing lobby (each host can only have one lobby at a time)

    code = Codes::generate(self)
    @code_hash[code] = host_uuid
    @uuid_hash[host_uuid] = code

    code
  end

  def delete_lobby(host_uuid)
    code = @uuid_hash[host_uuid]
    @uuid_hash.delete(host_uuid)
    @code_hash.delete(code)
  end

  # Takes either a host UUID or a lobby code and returns the other.
  # Returns nil if not found, in either case.
  def [](x)
    case x
    when /^\w{4}$/ then @code_hash[x]
    when /^\w{8}(-\w{4}){3}-\w{12}?$/ then @uuid_hash[x]
    end
  end

  # Takes either a host UUID or a lobby code.
  def include?(x)
    self[x]
  end

end
