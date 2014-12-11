/// <reference path="vm.ts" />
// Top of syntax tree hierarchy.
var I = Instruction;

class ASTNode { 

  refine() : ASTNode { return this; }

  symbol() : boolean { return false; }

  compile() : Array<Instruction> {
    throw new Error("Implement in subclasses.");
  }

}

// Number.
class Num extends ASTNode { 

  constructor(private num : number) { super(); }

  // Load the constant and push it to the heap.
  compile() : Array<Instruction> {
    return [I.LOAD(this.num), I.MKBASIC()];
  }

}

// Symbol. Just a wrapper around a set of characters.
class Symbol extends ASTNode {

  constructor(public symb : string) { super(); }

  symbol() : boolean { return true; }

  // Load the heap reference that the variable points to. Need to know if the variable
  // is on the current stack or not
  compile() : Array<Instruction> {
    throw new Error();
  }

}

// List the data not the s-expression.
class List extends ASTNode {

  constructor(private list : Array<ASTNode>) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Basically same as List but is more like the mathematical vector than a list.
class Tuple extends ASTNode {

  constructor(private elements : Array<ASTNode>) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Generic sequence of AST nodes with a head and a tail.
class SExpr extends ASTNode {

  private head : ASTNode;

  private tail : Array<ASTNode>;

  constructor(private expressions : Array<ASTNode>) { 
    super(); 
    this.head = expressions[0];
    this.tail = expressions.slice(1);
  }

  // Let bindings come in pairs of (variable, value).
  refine_let_bindings() : Array<BindingPair> {
    if (this.expressions.length % 2 != 0) {
      throw new Error("Let bindings must have even length.");
    }
    var variables : Array<Symbol> = this.expressions.reduce((m, e, index, exprs) : Array<Symbol> => {
      if (index % 2 == 0) {
        m.push(e.refine());
      }
      return m; 
    }, []);
    var expressions : Array<ASTNode> = this.expressions.reduce((m, e, index, exprs) : Array<ASTNode> => {
      if (index % 2 == 1) {
        m.push(e.refine());
      }
      return m; 
    }, []);
    var accumulator : Array<BindingPair> = [];
    variables.forEach((current_var, index, vars) => accumulator.push(new BindingPair(current_var, expressions[index])));
    return accumulator;
  }

  // Need to make sure everything is a symbol.
  refine_argument_definitions() : Array<Symbol> {
    if (!this.head.symbol()) {
      throw new Error("Function arguments must be all symbols.");
    }
    var symbols : Array<Symbol> = this.tail.map((element : ASTNode, index : number, elements : Array<ASTNode>) : Symbol => {
      if (!element.symbol()) {
        throw new Error("Function arguments must be symbols.");
      }
      return (<Symbol>element);
    });
    return [(<Symbol>this.head)].concat(symbols);
  }

  // Pattern matching is its own set of problems so as in the book we only focus on very simple
  // patterns that are one level deep. Extension to more general patterns is for future enhancements.
  refine_match_patterns() : Array<PatternPair> {
    if (this.expressions.length % 2 != 0) {
      throw new Error("Pattern pairs must come in pairs.");
    }
    var pattern_pairs : Array<PatternPair> = [];
    this.expressions.forEach((element, index, expressions) => {
      if (index % 2 == 0) {
        pattern_pairs.push(new PatternPair(element, expressions[index + 1]));
      }
    });
    return pattern_pairs;
  }

  // Can't return anything specific because it can be any number of things like function call, anonymous function, match
  // expression, etc.
  refine() : ASTNode {
    if (this.head.symbol()) {
      switch((<Symbol>this.head).symb) {
        case 'fun': // function definition
          return new AnonymousFunction((<SExpr>this.tail[0]).refine_argument_definitions(), new FunctionBody(this.tail[1].refine()));
        case 'let': // let binding
          return new LetExpressions((<SExpr>this.tail[0]).refine_let_bindings(), this.tail[1].refine());
        case 'match': // pattern matching
          return new MatchExpression(this.tail[0].refine(), (<SExpr>this.tail[1]).refine_match_patterns());
        case 'if': // conditional
          return new IfExpression(this.tail[0].refine(), this.tail[1].refine(), this.tail[2].refine());
      }
    }
    // Otherwise it must be a function call.
    return new FunctionCall(this.head, this.tail.map((x : ASTNode) : ASTNode => x.refine()));
  }

}

// s-expressions get refined and this is one of the control structures that we get.
class IfExpression extends ASTNode {

  constructor(private test : ASTNode, private true_branch : ASTNode, private false_branch : ASTNode) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Exactly what it sounds like. We have a symbol that is the name of the function and the list of arguments.
class FunctionCall extends ASTNode {

  constructor(private func : ASTNode, private args : Array<ASTNode>) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Anonymous function is just a set of arguments which need to be symbols and a body.
class AnonymousFunction extends ASTNode {

  constructor(private args : Array<Symbol>, private body : FunctionBody) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// A wrapper around a generic ASTNode.
class FunctionBody extends ASTNode {

  constructor(private exprs : ASTNode) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Introduces a set of bindings in pairs: <var expr> <var expr> ...
class LetExpressions extends ASTNode {

  constructor(private bindings : Array<BindingPair>, private body : ASTNode) { super(); }

  // Compile the bindings. Compile the body. Stick them together.
  compile() : Array<Instruction> {
    var compiled_bindings = this.bindings.reduce((previous : Array<Instruction>,
      current : BindingPair, index : number, bindings : Array<BindingPair>) => {
        return previous.concat(current.compile());
    }, []);
    return compiled_bindings.concat(this.body.compile());
  }

}

// The actual binding pair that appears in let expressions.
class BindingPair extends ASTNode {

  private variable_location : number;

  constructor(private variable : Symbol, private value : ASTNode) { super(); }

  // Compile the variable. Compile the value. Perform the assignment.
  compile() : Array<Instruction> {
    return [I.INITVAR()].concat(this.value.compile()).concat([I.STOREA(this.variable_location)]);
  }

}

// Pattern matching.
class MatchExpression extends ASTNode {

  constructor(private value : ASTNode, private patterns : Array<PatternPair>) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Like let expressions but this time we have pattern matching pairs.
class PatternPair extends ASTNode {

  constructor(private pattern : ASTNode, private expression : ASTNode) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}
