
require 'rake/clean'

task default: %w[tsc run]

task :tsc do
  sh 'tsc'
end

task :run do
  ruby './server/server.rb'
end

task :tsdoc do
  sh 'typedoc', *Dir.glob("./ts/**/*.ts")
end
