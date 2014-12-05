/// <reference path="combinators.ts" />
/// <reference path="lexingstate.ts" />

class Grammar {
  
  static num : Parser = Parser.m(x => x.type === LexingState.NUMBER);

  static symb : Parser = Parser.m(x => x.type === LexingState.SYMBOL);

  static lparen : Parser = Parser.m(x => x.type === LexingState.LPAREN);

  static rparen : Parser = Parser.m(x => x.type === LexingState.RPAREN);

  static empty_list : Parser = Grammar.lparen.then(Grammar.rparen);

  static non_empty_list : Parser = Grammar.lparen.then(Grammar.symb).then(
    Parser.delay(x => Grammar.non_empty_list.zero_or_more())).then(
      Grammar.rparen);

  static s_expr : Parser = Grammar.empty_list.or(Grammar.non_empty_list);

}
