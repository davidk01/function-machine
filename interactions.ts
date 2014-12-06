function input_area() : HTMLTextAreaElement {
  return (<HTMLTextAreaElement>document.querySelector('#input'));
}

function lexemes_area() : HTMLTextAreaElement {
  return (<HTMLTextAreaElement>document.querySelector('#output'));
}

function ast_area() : HTMLTextAreaElement {
  return (<HTMLTextAreaElement>document.querySelector('#output'));
}

function lex_input() : Array<any> {
  var input_text : string = input_area().value;
  var lexer : Lexer = new Lexer(input_text);
  while (!lexer.lex_next()) {
    lexer.lex_next();
  }
  var lex_result : Array<any> = lexer.lex_next();
  var lex_result_json : string = JSON.stringify(lex_result);
  console.log(lex_result_json);
  lexemes_area().value = lex_result_json;
  return lex_result;
}

function parse_input() {
  var lexemes = lex_input();
  var ast = G.parse(lexemes);
  console.log(ast);
  ast_area().value = JSON.stringify(ast);
  return ast;
}
