
require 'rake/clean'

desc "Build the code and run the webserver"
task default: %w[build run]

desc "Build the code"
task build: %w[tsc lua]

desc "Build the Typescript client code"
task :tsc do
  sh 'tsc'
end

desc "Build the Lua runner"
task :lua do
  sh 'make', { chdir: 'lua' }
  Dir.glob("./lua/*.mjs").each do |mjs_file|
    mjs_file =~ /([^\/]*)\.mjs$/ or raise("Could not copy #{mjs_file}")
    js_file = "./public/#{$1}.js";
    sh 'cp', mjs_file, js_file
  end
  sh 'cp', *Dir.glob("./lua/*.wasm"), "./public/"
  sh 'cp', *Dir.glob("./lua/*.data"), "./public/"
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
