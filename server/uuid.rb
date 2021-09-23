
require 'securerandom'

module UUID
  # Takes a Sinatra session object.
  def self.get(session)
    session['uuid'] ||= SecureRandom.uuid
  end
end
