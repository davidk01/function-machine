/// <reference path="combinators.ts" />
/// <reference path="lexer.ts" />
/// <reference path="ast.ts" />

class G {
  
  // Number token.
  static num : Parser = Parser.m(x => x.type === TokenType.NUMBER).transformer(
    (x : Token) : ASTNode => new Num(parseInt(x.characters)));

  // Symbol token.
  static symb : Parser = Parser.m(x => x.type === TokenType.SYMBOL).transformer(
    (x : Token) : ASTNode => new Symbol(x.characters));

  // Left paren.
  static lparen : Parser = Parser.m(x => x.type === TokenType.LPAREN);

  // Right paren.
  static rparen : Parser = Parser.m(x => x.type === TokenType.RPAREN);

  // Left angle bracket.
  static langle : Parser = Parser.m(x => x.type === TokenType.LANGLE);

  // Right angle bracket.
  static rangle : Parser = Parser.m(x => x.type === TokenType.RANGLE);

  // Left square bracket.
  static lbracket : Parser = Parser.m(x => x.type === TokenType.LBRACKET);

  // Right square bracket.
  static rbracket : Parser = Parser.m(x => x.type === TokenType.RBRACKET);

  // Tuple: <s-expr, ..., s-expr>.
  static tuple : Parser = G.langle.then(Parser.delay(x => G.s_expr)).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rangle).transformer(
      (x : Array<any>) => new Tuple([x[1]].concat(x[2])));

  // List: [s-expr, ..., s-expr].
  static list : Parser = G.lbracket.then(Parser.delay(x => G.s_expr)).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rbracket).transformer(
      (x : Array<any>) => { console.log(x); return new List([x[1]].concat(x[2])) });

  // Atomic expressions: empty list | symbol | number.
  static atomic : Parser = G.list.or(G.tuple).or(G.num).or(G.symb);

  // Non-empty list: (atomic s-expr*).
  static non_empty_list : Parser = G.lparen.then(G.atomic).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rparen).transformer(
      (x : Array<Token>) : ASTNode => new SExpr([x[1]].concat(x[2])));

  // s-expr: atomic | empty list | non-empty list.
  static s_expr : Parser = G.atomic.or(G.non_empty_list);

  static parse(input : Array<Token>) : ASTNode {
    // Filter out all the stuff that is ignorable
    var filtered_tokens : Array<Token> = input.filter(x => !(x.type === TokenType.IGNORE));
    return G.s_expr.parse_input(filtered_tokens);
  }

}
