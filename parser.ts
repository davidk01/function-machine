/// <reference path="combinators.ts" />
/// <reference path="lexer.ts" />
/// <reference path="ast.ts" />

// The grammar that takes the input from the lexer phase. Incidentally the lexer is also just another
// parser combinator grammar.
class G {
  
  // Number token.
  static num : Parser = Parser.m(x => x.type === TokenType.NUMBER).transformer(
    (x : Token) : Num => new Num(parseInt(x.characters)));

  // Symbol token.
  static symb : Parser = Parser.m(x => x.type === TokenType.SYMBOL).transformer(
    (x : Token) : Symbol => new Symbol(x.characters));

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
      (x : Array<any>) : Tuple => new Tuple([x[1]].concat(x[2])));

  // List: [s-expr, ..., s-expr].
  static non_empty_data_list : Parser = G.lbracket.then(Parser.delay(x => G.s_expr)).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rbracket).transformer(
      (x : Array<any>) : List => new List([x[1]].concat(x[2])));

  // Empty list: [].
  static empty_data_list : Parser = G.lbracket.then(G.rbracket).transformer(
    (x : Array<any>) : List => new List([]));

  // Atomic expressions: empty list | symbol | number.
  static atomic : Parser = G.non_empty_data_list.or(G.empty_data_list).or(G.tuple).or(G.num).or(G.symb);

  // Non-empty list: (atomic s-expr*).
  static list : Parser = G.lparen.then(G.atomic).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rparen).transformer(
      (x : Array<any>) : SExpr => new SExpr([x[1]].concat(x[2])));

  // s-expr: atomic | empty list | non-empty list.
  static s_expr : Parser = G.atomic.or(G.list);

  // At the end of the day we get a bunch of S-expressions and want to convert that to a more
  // fine-grained AST that has constructs we are interested in like function definition, function
  // call, anonymous function, variable binding, etc.
  static parse(input : Array<Token>) : Array<ASTNode> {
    // Filter out all the stuff that is ignorable
    var filtered_tokens : Array<Token> = input.filter(x => !(x.type === TokenType.IGNORE));
    return G.s_expr.many().parse_input(filtered_tokens);
  }

}

// Going from SExpr type nodes to more specific nodes like 'let', 'match', 'function definition', etc.
class T {

  static refine_sexprs(nodes : Array<ASTNode>) : Array<ASTNode> {
    return nodes.map((value, index, array) => value.refine());
  }

}
