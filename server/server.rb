
require 'sinatra'
require 'sqlite3'
require 'pathname'
require 'json'
require 'securerandom'

require_relative 'sse_connection'
require_relative 'uuid'
require_relative 'sse_server'
require_relative 'lobby_manager'

def root_dir
  $root_dir
end

def db_dir
  root_dir / "db"
end

$root_dir = Pathname.new(__FILE__).dirname.dirname
$sse = SSEServer.new
$lobbies = LobbyManager.new

enable :sessions
set :session_store, Rack::Session::Pool
set :cookie_options do
  { same_site: :strict }
end

configure do

  # Set project root to parent of directory containing this file.
  set :root, root_dir.to_s

  set :server, :thin
  mime_type :mjs, 'application/javascript'

  # Initialize the database
  db_dir.mkpath
  #@db = SQLite3::Database.open((db_dir / "clients.db").to_s)

end

get '/' do
  erb :index
end

get '/sse-test' do
  erb :sse_test
end

get '/render-test' do
  erb :render_test
end

get '/remote-control-test' do
  erb :remote_control_test
end

get '/lua-test' do
  erb :lua_test
end

get '/game' do
  erb :game
end

get '/game/play' do
  erb :running_game, layout: false
end

get '/connect' do
  erb :connect
end

get '/rc/joined' do
  erb :'remote_control/joined', layout: false
end

get '/rc/info' do
  erb :'remote_control/info', layout: false
end

get '/rc/freeform' do
  erb :'remote_control/freeform_question', layout: false
end

get '/display/freeform' do
  erb :'display/freeform_question', layout: false
end

get '/rc/multichoice' do
  erb :'remote_control/multichoice_question', layout: false
end

get '/display/multichoice' do
  erb :'display/multichoice_question', layout: false
end

get '/rc/selectall' do
  erb :'remote_control/selectall_question', layout: false
end

get '/display/selectall' do
  erb :'display/selectall_question', layout: false
end

get '/listen' do
  content_type 'application/json'
  code = $lobbies.start_new_lobby(UUID.get(session))
  { type: 'code', code: code }.to_json
end

get '/whoami' do
  uuid = UUID.get(session)
  content_type 'text/plain'
  uuid
end

get '/ping' do
  content_type 'application/json'
  if params['code']
    code = params['code']
    target = $lobbies[code]
    if target
      { 'result': 'ok', 'target': target }.to_json
    else
      status 400
      { 'result': 'invalid-code' }.to_json
    end
  else
    status 400
    { 'result': 'invalid-request' }.to_json
  end
end

get '/sse/listen' do
  uuid = UUID.get(session)
  content_type 'text/event-stream'
  SSEConnection.establish(self) do |conn|
    $sse[uuid] = conn
  end
end

post '/sse/send' do
  request.body.rewind
  body = JSON.parse(request.body.read)
  target_uuid = body['target']
  target_msg_type = body['messageType']
  target_msg = body['message']
  conn = $sse[target_uuid]
  if conn
    conn << { source: UUID.get(session), messageType: target_msg_type, message: target_msg }
    "OK"
  else
    status 400
    "Unknown message target"
  end
end

post '/sse/broadcast' do
  request.body.rewind
  body = JSON.parse(request.body.read)
  target_msg_type = body['messageType']
  target_msg = body['message']
  $sse.each do |conn|
    conn << { source: UUID.get(session), messageType: target_msg_type, message: target_msg }
  end
  "OK"
end
