/// <reference path="combinators.ts" />

enum TokenType {
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  LANGLE,
  RANGLE,
  SYMBOL,
  NUMBER,
  IGNORE
}

class Token {
    constructor(public characters : string, public type : TokenType) { }
}

class L {

  // Whitespace.
  static _ : Parser = Parser.m(x => /\s/.test(x)).zero_or_more().transformer(
    x => new Token('', TokenType.IGNORE));

  // Left paren.
  static lparen : Parser = Parser.m(x => /\(/.test(x)).transformer(
    x => new Token(x, TokenType.LPAREN));

  // Right paren.
  static rparen : Parser = Parser.m(x => /\)/.test(x)).transformer(
    x => new Token(x, TokenType.RPAREN));

  // Left square bracket.
  static lbracket : Parser = Parser.m(x => /\[/.test(x)).transformer(
    x => new Token(x, TokenType.LBRACKET));

  // Right swuare bracket.
  static rbracket : Parser = Parser.m(x => /\]/.test(x)).transformer(
    x => new Token(x, TokenType.RBRACKET));

  // Left angle bracket.
  static langle : Parser = Parser.m(x => /</.test(x)).transformer(
    x => new Token(x, TokenType.LANGLE));

  // Right angle bracket.
  static rangle : Parser = Parser.m(x => />/.test(x)).transformer(
    x => new Token(x, TokenType.RANGLE));

  // Comma.
  static comma : Parser = Parser.m(x => /,/.test(x)).transformer(
    x => new Token(x, TokenType.IGNORE));

  // Comment.
  static comment : Parser = Parser.m(x => ';' === x).then(
    Parser.m(x => /[^\n]/.test(x)).zero_or_more()).transformer(
      x => new Token(x[1], TokenType.IGNORE));

  // Integer.
  static num : Parser = Parser.m(x => /\d/.test(x)).many().transformer(
    x => new Token(x.join(''), TokenType.NUMBER));

  // Symbol.
  static symb : Parser = Parser.m(x => /[^\s\(\)\[\]<>,]/.test(x)).many().transformer(
    x => new Token(x.join(''), TokenType.SYMBOL));

  // All the tokens.
  static token : Parser = L._.then(L.comment.or(L.lparen).or(L.rparen).or(L.lbracket).or(L.rbracket).or(
    L.langle).or(L.rangle).or(L.comma).or(L.num).or(L.symb)).then(L._).transformer(x => x[1]);

  // Return the array of tokens.
  static lex(input : string) : Array<Token> {
    return L.token.many().parse_input(input);
  }

}
