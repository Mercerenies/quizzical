
require 'rake/clean'

desc "Build the Typescript and run the webserver"
task default: %w[tsc run]

desc "Build the Typescript client code"
task :tsc do
  sh 'tsc'
end

desc "Build the Lua runner"
task :lua do
  sh 'make', { chdir: 'lua' }
end

desc "Run the webserver"
task :run do
  ruby './server/server.rb'
end

desc "Build the Typescript documentation (JSDoc)"
task :tsdoc do
  sh 'typedoc', *Dir.glob("./ts/**/*.ts")
end

desc "Run ESLint on the Typescript code"
task :eslint do
  sh 'npx', 'eslint', 'ts/'
end
