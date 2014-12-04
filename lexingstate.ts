// Keeps track of the kind of token we are lexing.
enum LexingState {
  LPAREN,
  RPAREN,
  SPACE,
  SYMBOL,
  COMMENT,
  STRING,
  NUMBER
}

