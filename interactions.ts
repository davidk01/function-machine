var examples : { [n : string] : string } = {
  'anonymous-function': "(fun (x y) (+ x y))",
  'function-application': "((fun (x y) (+ x y)) 1 2)",
  'let-in': "(let (add (fun (x y) (+ x y))) (add 1 2))",
  'pattern-matching': "(let (map (fun (f l) (match l (() '() (cons x xs) (cons (f x) (map f xs)))))) (map (fun (x) x) (cons 1 (cons 2 '()))))"
}

function set_example(name : string) : string {
  input_area().value = examples[name];
  return examples[name];
}

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
  var lex_result : Array<Token> = L.lex(input_text);
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
