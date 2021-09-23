
require 'sinatra'
require 'sqlite3'
require 'pathname'
require 'json'
require 'securerandom'

require_relative 'connections'
require_relative 'sse_connection'

def root_dir
  $root_dir
end

def db_dir
  root_dir / "db"
end

$root_dir = Pathname.new(__FILE__).dirname.dirname
$connections = Connections.new
$active_request_data = {}

enable :sessions
set :session_store, Rack::Session::Pool
set :cookie_options do
  { same_site: :strict }
end

configure do

  # Set project root to parent of directory containing this file.
  set :root, root_dir.to_s

  set :server, :thin

  # Initialize the database
  db_dir.mkpath
  #@db = SQLite3::Database.open((db_dir / "clients.db").to_s)

end

get '/' do
  erb :index
end

get '/game' do
  erb :game
end

get '/connect' do
  erb :connect
end

get '/listen' do
  content_type 'text/event-stream'
  SSEConnection.establish(self) do |conn|
    code = $connections.listen(conn)

    initial_msg = { type: 'code', code: code }
    conn << initial_msg

  end
end

get '/ping' do
  content_type 'application/json'
  if params['code']
    code = params['code']
    conn = $connections[code]
    if conn
      request_uuid = SecureRandom.uuid
      session['request_uuid'] = request_uuid
      session['request_code'] = code
      $active_request_data[request_uuid] = :waiting

      msg = { type: 'message', message: "Ping from #{request.ip} at #{request_uuid}" }
      conn << msg

      { 'result': 'ok' }.to_json
    else
      status 400
      { 'result': 'invalid-code' }.to_json
    end
  else
    status 400
    { 'result': 'invalid-request' }.to_json
  end
end

get '/await' do
  request_uuid = session['request_uuid']
  req = $active_request_data[request_uuid]
  if req == :waiting
    content_type 'text/event-stream'
    SSEConnection.establish(self) do |conn|
      $active_request_data[request_uuid] = conn
    end
  else
    # No such UUID, so bad request
    status 400
  end
end

post '/offer' do
  request_uuid = session['request_uuid']
  req = $active_request_data[request_uuid]
  code = session['request_code']
  if req.is_a?(SSEConnection)
    request.body.rewind
    sdp = request.body.read
    server = $connections[code]
    server << { type: 'sdp', sdp: sdp, request_uuid: request_uuid }
    'OK'
  else
    status 400
  end
end

post '/response' do
  request.body.rewind
  body = JSON.parse(request.body.read)
  request_uuid = body['uuid']
  answer = body['answer']
  req = $active_request_data[request_uuid]
  if req.is_a?(SSEConnection)
    req << { type: 'sdp', answer: answer };
  else
    status 400
  end
end
