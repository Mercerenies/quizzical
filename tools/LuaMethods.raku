
# This is a helper script which reads the C source code in
# lua_bridge.c and writes the method types to methods.ts in an
# automated way.

class LuaMethod {
    has Str $.return-type;
    has Str $.name;
    has @.arguments;

    multi method gist(LuaMethod:D:) {
        "{$.return-type} {$.name}({@.arguments.map(*.gist).join(', ')})"
    }

    method interface-line {
        my $args = @.arguments.map(*.to-ts-decl).join(', ');
        my $return = type-to-ts($.return-type);
        qq[  $.name: ($args) => $return;]
    }

    method cwrap-line {
        my $args = @.arguments.map({ type-to-cwrap($^arg.type) }).join(', ');
        my $return = type-to-cwrap($.return-type);
        qq[    $.name: emModule.cwrap("$.name", $return, [$args]),]
    }

}

class Argument {
    has Str $.type;
    has Str $.name;

    multi method gist(Argument:D:) {
        "$.type $.name"
    }

    method to-ts-decl {
        qq[$.name: {type-to-ts($.type)}]
    }
}

sub type-to-ts(Str $type --> Str) {
    given $type {
        when "int" { "number" }
        when "double" { "number" }
        when "char*" { "string" }
        when "const char*" { "string" }
        when "lua_State*" { "pointer" }
        when "void" { "void" }
        default { die("Unknown type $type") }
    }
}

sub type-to-cwrap(Str $type --> Str) {
    given $type {
        when "int" { '"number"' }
        when "double" { '"number"' }
        when "char*" { '"string"' }
        when "const char*" { '"string"' }
        when "lua_State*" { '"number"' }
        when "void" { 'null' }
        default { die("Unknown type $type") }
    }
}

grammar MethodParser {

    rule TOP {
        <ws> [ <function-header> | <token> ] * <ws>
    }

    token token {
        \S +
    }

    rule function-header {
        [ <type> <modifier> | <modifier> <type> ] <name> '(' [ <argument> * % ',' ] ')' '{'
    }

    rule type {
        'const' ? <name> '*' ?
    }

    rule modifier {
        "EMSCRIPTEN_KEEPALIVE"
    }

    rule argument {
        <type> <name>
    }

    token name {
        <[A..Z a..z _]> <[A..Z a..z _ 0..9]> *
    }

}

class MethodActions {

    method TOP($/) {
        make $<function-header>».made
    }

    method function-header($/) {
        make LuaMethod.new(
            return-type => $<type>.made,
            name => $<name>.made,
            arguments => $<argument>».made,
        )
    }

    method type($/) {
        make $/.Str.trim;
    }

    method argument($/) {
        make Argument.new(type => $<type>.made, name => $<name>.made)
    }

    method name($/) {
        make $/.Str
    }

}

my $file-body = $*ARGFILES.slurp;
my @result = MethodParser.parse($file-body, actions => MethodActions).made;
say qq:to/END/;

// WARNING: This file is automatically built by LuaMethods.raku and
// should not be modified by hand!

import LModule from '../lua_bridge.js';
import \{ pointer \} from './constants.js';

export interface Methods \{
{@result.map(*.interface-line).join("\n")}
\}

export function initMethods(emModule: LModule.LuaBridgeModule): Methods \{
  return \{
{@result.map(*.cwrap-line).join("\n")}
  \};
\}
END
