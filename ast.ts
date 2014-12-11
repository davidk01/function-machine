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
    return [I.LOAD({constant: this.num}), I.MKBASIC()];
  }

}

// Symbol. Just a wrapper around a set of characters.
class Symbol extends ASTNode {

  private stack : number;

  private stack_location : number;

  constructor(public symb : string) { super(); }

  symbol() : boolean { return true; }

  // Load a variable accounting for stack nesting and stack location on that stack level.
  compile() : Array<Instruction> {
    return [I.LOADVAR({stack: this.stack, stack_location: this.stack_location})];
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

  private false_branch_label : string;

  private end_label : string;

  constructor(private test : ASTNode, private true_branch : ASTNode, private false_branch : ASTNode) { super(); }

  // Nothing too fancy. Just some labels and jumps.
  // [test] jumpz(false) [true] jump(end) false [false] end
  compile() : Array<Instruction> {
    return this.test.compile().concat([I.JUMPZ({label: this.false_branch_label})]).concat(this.true_branch.compile()).concat(
      [I.JUMP({label: this.end_label}), I.LABEL({label: this.false_branch_label})]).concat(this.false_branch.compile()).concat(
        [I.LABEL({label: this.end_label})]);
  }

}

// Exactly what it sounds like. We have a symbol that is the name of the function and the list of arguments.
class FunctionCall extends ASTNode {

  constructor(private func : ASTNode, private args : Array<ASTNode>) { super(); }

  // First evaluate the arguments. Push arguments onto the new stack. Push the function/closure
  // reference. Call the function.
  // arg1 arg2 ... argN pushstack(N) func-reference apply(N)
  compile() : Array<Instruction> {
    return this.args.reduce((previous : Array<Instruction>, current : ASTNode, index : number, args : Array<ASTNode>) => {
      return previous.concat(current.compile());
    }, []).concat([I.PUSHSTACK({count: this.args.length})]).concat(this.func.compile()).concat([I.APPLY()]);
  }

}

// Anonymous function is just a set of arguments which need to be symbols and a body.
class AnonymousFunction extends ASTNode {

  // We use the label during a second pass to resolve jump addresses.
  private starting_label : string;

  // Arguments and the body of the function.
  constructor(private args : Array<Symbol>, private body : FunctionBody) { super(); }

  // Mark the starting point for the function. Compile the instructions. Make a function object
  // that points at the starting label as the code start point.
  compile() : Array<Instruction> {
    return [I.LABEL({label: this.starting_label})].concat(this.body.compile()).concat(
      [I.MKFUNC({label: this.starting_label, argument_count: this.args.length})]);
  }

}

// A wrapper around a generic ASTNode.
class FunctionBody extends ASTNode {

  constructor(private exprs : ASTNode) { super(); }

  compile() : Array<Instruction> {
    return this.exprs.compile();
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
    return [I.INITVAR({var_location: this.variable_location})].concat(this.value.compile()).concat([I.STOREA({store_location: this.variable_location})]);
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
