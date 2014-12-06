/// <reference path="combinators.ts" />
/// <reference path="lexingstate.ts" />
/// <reference path="ast.ts" />

class G {
  
  // Number token.
  static num : Parser = Parser.m(x => x.type === LexingState.NUMBER).transformer(
    (x : Token) : ASTNode => new Num(parseInt(x.characters)));

  // Symbol token.
  static symb : Parser = Parser.m(x => x.type === LexingState.SYMBOL).transformer(
    (x : Token) : ASTNode => new Symbol(x.characters));

  // Left paren.
  static lparen : Parser = Parser.m(x => x.type === LexingState.LPAREN);

  // Right paren.
  static rparen : Parser = Parser.m(x => x.type === LexingState.RPAREN);

  // Empty list: ().
  static empty_list : Parser = G.lparen.then(G.rparen).transformer(
    (x : Token) : ASTNode => new List([]));

  // Atomic expressions: empty list | symbol | number.
  static atomic : Parser = G.num.or(G.symb).or(G.empty_list);

  // Non-empty list: (atomic s-expr*).
  static non_empty_list : Parser = G.lparen.then(G.atomic).then(
    Parser.delay(x => G.s_expr.zero_or_more())).then(G.rparen).transformer(
      (x : Array<Token>) : ASTNode => new List([x[1]].concat(x[2])));

  // s-expr: atomic | empty list | non-empty list.
  static s_expr : Parser = G.atomic.or(G.empty_list).or(G.non_empty_list);

  static parse(input : Indexable) : ASTNode {
    return G.s_expr.parse(new IndexableContext(input));
  }

}


