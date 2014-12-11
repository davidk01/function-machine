/// <reference path="lexer.ts" />
/// <reference path="parser.ts" />
var examples : { [n : string] : string } = {
  'anonymous function': "(fun (x y) (+ x y))",
  'function application': "((fun (x y) (+ x y)) 1 2)",
  'factorial': "(let (factorial (fun (x) (if (less-than 0 x) (* x (factorial (- x 1))) 1))) (factorial 3))",
  'let in': "(let (add (fun (x y) (+ x y))) (add 1 2))",
  'pattern matching': "(let (map (fun (f l) (match l ([] [] (cons x xs) (cons (f x) (map f xs)))))) (map (fun (x) x) [1, 2, 3]))",
  'tuple': "<1, 2, 3>",
  'list': "[1, 2, 3]"
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

// Generate the lexical elements.
function lex_input() : Array<any> {
  var input_text : string = input_area().value;
  var lex_result : Array<Token> = L.lex(input_text);
  var lex_result_json : string = JSON.stringify(lex_result);
  lexemes_area().value = lex_result_json;
  return lex_result;
}

// Generate s-expressions from the lexical elements.
function parse_input() {
  var lexemes = lex_input();
  var ast = G.parse(lexemes);
  ast_area().value = JSON.stringify(ast);
  return ast;
}

// Refine the s-expressions.
function ast_input() {
  var s_exprs : Array<ASTNode> = parse_input();
  var refined_ast = T.refine_sexprs(s_exprs);
  ast_area().value = JSON.stringify(refined_ast);
  return refined_ast;
}

function compile_input() {
  var refined_ast = ast_input();
  var compiled = refined_ast.map(x => x.compile());
  ast_area().value = JSON.stringify(compiled);
  return compiled;
}

function instantiate_examples() {
  var div = document.querySelector('#buttons');
  for (var k in examples) {
    var example : string = examples[k];
    var element = document.createElement('input');
    element.type = 'button';
    element.value = k;
    element.onclick = (function(button_name : string) { return function() { set_example(button_name); }; })(k);
    div.appendChild(element);
  }
}
