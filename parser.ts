/// <reference path="combinators.ts" />
/// <reference path="lexingstate.ts" />

class Grammar {
  
  // Number token.
  static num : Parser = Parser.m(x => x.type === LexingState.NUMBER);

  // Symbol token.
  static symb : Parser = Parser.m(x => x.type === LexingState.SYMBOL);

  // Left paren.
  static lparen : Parser = Parser.m(x => x.type === LexingState.LPAREN).transformer((x : Token) : any => "(");

  // Right paren.
  static rparen : Parser = Parser.m(x => x.type === LexingState.RPAREN).transformer((x : Token) : any => ")");

  // Empty list: ().
  static empty_list : Parser = Grammar.lparen.then(Grammar.rparen).transformer((x : Token) : any => []);

  // Atomic expressions: empty list | symbol | number.
  static atomic : Parser = Grammar.num.or(Grammar.symb).or(Grammar.empty_list);

  // Non-empty list: (atomic s-expr*).
  static non_empty_list : Parser = Grammar.lparen.then(Grammar.atomic).then(
    Parser.delay(x => Grammar.s_expr.zero_or_more())).then(Grammar.rparen);

  // s-expr: atomic | empty list | non-empty list.
  static s_expr : Parser = Grammar.atomic.or(Grammar.empty_list).or(Grammar.non_empty_list);

  static parse(input : Indexable) : any {
    return Grammar.s_expr.parse(new IndexableContext(input));
  }

}
