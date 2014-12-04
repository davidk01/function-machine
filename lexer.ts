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

// Contains the basic stuff for an input state.
class InputState {

  // Where we are in the string.
  current_index : number;

  // Initial state.
  constructor(public input : string) { 
    this.current_index = 0;
  }

  // The actual current character.
  current_character() : string {
    return this.input[this.current_index];
  }

  // See if we are at the end of input.
  is_eof() : boolean {
    return !this.input[this.current_index];
  }

  // Move forward one character.
  advance() : void {
    // Do nothing if we are at the end of input.
    if (this.input[this.current_index] === undefined) {
      console.log("Already at the end of input.");
      return;
    }
    this.current_index += 1;
  }

}

class Token {

  constructor(public characters : string, public type : LexingState) { }

}

class Lexer {

  // Where we are in the current input string.
  input_state : InputState;

  // Current lexing state, i.e. the type of token we are lexing.
  current_state : LexingState;

  // Accumulator for tokens.
  accumulator : Array<Token>;

  // Accumulator for string to token converstion.
  string_accumulator : string;

  // Put everything into the initial state.
  constructor(input : string) {
    this.input_state = new InputState(input);
    this.accumulator = [];
    this.string_accumulator = "";
    var state : LexingState;
    var current_character : string = this.input_state.current_character();
    if (/\(/.test(current_character)) {
      state = LexingState.LPAREN;
    } else if (/\s/.test(current_character)) {
      state = LexingState.SPACE;
    } else if (/;/.test(current_character)) {
      state = LexingState.COMMENT;
    } else {
      throw new Error("Can not initialize initial lexing state: current character = " + current_character);
    }
    this.current_state = state;
  }

  // Delegate to input state.
  current_index() : number {
    return this.input_state.current_index;
  }

  // Delegate to input state.
  current_character() : string {
    return this.input_state.current_character();
  }

  // Delegate to input state.
  advance() : void {
    this.input_state.advance();
  }

  // Various token testers.

  is_space() : boolean {
    return /\s/.test(this.current_character());
  }

  is_lparen() : boolean {
    return /\(/.test(this.current_character());
  }

  is_rparen() : boolean {
    return /\)/.test(this.current_character());
  }

  is_paren() : boolean {
    return this.is_rparen() || this.is_lparen();
  }

  is_symbol() : boolean {
    return /[^;\(\)\d\s]/.test(this.current_character());
  }

  is_comment() : boolean {
    return /;/.test(this.current_character());
  }

  is_number() : boolean {
    return /\d/.test(this.current_character());
  }

  is_string() : boolean {
    return /"/.test(this.current_character());
  }

  // Advancing should be handled by someone else.
  update() : void {
    this.string_accumulator = "";
    if (this.is_lparen()) {
      this.current_state = LexingState.LPAREN;
    } else if (this.is_rparen()) {
      this.current_state = LexingState.RPAREN;
    } else if (this.is_symbol()) {
      this.current_state = LexingState.SYMBOL;
    } else if (this.is_comment()) {
      this.current_state = LexingState.COMMENT;
    } else if (this.is_number()) {
      this.current_state = LexingState.NUMBER;
    } else if (this.is_string()) {
      this.current_state = LexingState.STRING;
    } else if (this.is_space()) {
      this.current_state = LexingState.SPACE;
    } else {
      throw new Error("Unknown start of token: token start = ." + this.current_character());
    }
  }

  // Accumulate characters until we hit a space character.
  accumulate_until_space_or_paren() : void {
    while (!(this.is_space() || this.is_paren())) {
      this.string_accumulator += this.current_character();
      this.advance();
    }
  }

  // Consume everything until we hit a newline without accumulating anything.
  skip_until_newline() : void {
    while (!/\n/.test(this.current_character())) {
      this.advance();
    }
  }

  // Go until we hit non-space character.
  skip_while_space() : void {
    while (/\s/.test(this.current_character())) {
      this.advance();
    }
  }

  // Accumulate the next token and set up the state for the next token lex.
  lex_next() : Array<Token> {
    if (this.input_state.is_eof()) {
      console.log("Nothing left to lex. At end of input.");
      return this.accumulator;
    }
    switch(this.current_state) {
      case LexingState.LPAREN:
        this.accumulator.push(new Token(this.current_character(), this.current_state));
        this.advance();
        break;
      case LexingState.RPAREN:
        this.accumulator.push(new Token(this.current_character(), this.current_state));
        this.advance();
        break;
      case LexingState.SPACE:
        this.skip_while_space();
        break;
      case LexingState.SYMBOL:
        this.accumulate_until_space_or_paren();
        this.accumulator.push(new Token(this.string_accumulator, this.current_state));
        break;
      case LexingState.COMMENT:
        this.skip_until_newline();
        break;
      case LexingState.NUMBER:
        this.accumulate_until_space_or_paren();
        this.accumulator.push(new Token(this.string_accumulator, this.current_state));
        break;
      default:
        throw new Error("This should not happen.");
    }
    // Advance one more time and put us in the correct state for lexing the next token.
    this.update();
    return null;
  }

}
