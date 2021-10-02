
# quizzical

*(Working title)*

An educational party game.

A game host will be able to set up a lobby, to which guests will
connect. Neither the host nor the guests need to download any
software; this game runs entirely in the browser. A central backend
server manages the initial handshake, and then the host and guests
directly communicate via WebRTC beyond that point.

This game is intended for use in classroom settings or group study
sessions. The host will display the game on a central computer or
projector screen. The main game poses questions and minigames intended
to be fun but educational, which lobby guests will answer to score
points.

## Architecture

The backend is a Ruby Sinatra server. This can be deployed anywhere
and is needed for the initial communication. Generally, a lobby host
needn't deploy their own server and can use a central one instead.

The frontend (host and guest) is provided by a combination of Ruby ERB
template HTML files and Typescript code.

Eventually, the questions will be generated by an extensible Lua
script, and the host will be able to provide their own Lua scripts to
generate custom questions.