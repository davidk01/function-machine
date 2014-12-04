/// <reference path="lexingstate.ts" />
/// <reference path="token.ts" />

interface AST {

}

// Just a list of AST nodes.
class List implements AST {

  constructor(public elements : Array<AST>) { }

}

// Corresponds to a symbol.
class Symbol implements AST {

  symbol : string;
  
  constructor(token : Token) {
    this.symbol = token.characters;
  }

}

// Corresponds to an integer.
class Num implements AST {

  n : number;

  constructor(token : Token) {
    this.n = parseInt(token.characters);
  }

}

// Pretty simple. Just return the characters wrapped in a Symbol instance.
function parse_symbol(tokens : Array<Token>, token_index : number) : Symbol {
  return new Symbol(tokens[token_index]);
}

// Try to parse the characters into an integer with parseInt.
function parse_number(tokens : Array<Token>, token_index : number) : Num {
  return new Num(tokens[token_index]);
}

// Look at the current index and decide what to do.
function parse_list(tokens : Array<Token>, token_index : number) {
  var list_elements : Array<AST> = [];
  switch(tokens[token_index].type) {
    case LexingState.LPAREN:
      list_elements.push(parse_list(tokens, token_index + 1));
      break;
    case LexingState.SYMBOL:
      list_elements.push(parse_symbol(tokens, token_index));

      break;
    case LexingState.NUMBER:
      list_elements.push(parse_number(tokens, token_index));
    case LexingState.RPAREN:
      break;
    default:
      throw new Error("Unknown token type while parsing list.");
  }
  return new List(list_elements);
}

function parse(tokens : Array<Token>, token_index : number) : AST {
  switch(tokens[0].type) {
    case LexingState.LPAREN:
      return parse_list(tokens, token_index + 1);
    case LexingState.SYMBOL:
      return parse_symbol(tokens, token_index);
    case LexingState.NUMBER:
      return parse_number(tokens, token_index);
    default:
      throw new Error("Unknown token type.");
  }
  throw new Error("Can't get here.");
}
