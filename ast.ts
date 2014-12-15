/// <reference path="vm.ts" />
// Top of syntax tree hierarchy.
var I = Instruction;

// Keeps track of various bits for annotating the AST. Not sure if I should call this typechecking
// because it is some kind of static analysis.
class AnnotationContext {

  // Location of the latest variable declaration.
  private latest_location : number;

  // We generate unique labels using this number.
  private label_number : number;

  // Keep track of variables in the current scope.
  private variables : { [s : string] : any };

  // Keeps track of stack increments during function calls.
  private stack_number : number;

  // Keep track of the parent context to mirror the scoping rules of the language.
  constructor(private up : AnnotationContext) {
    this.label_number = (this.up && this.up.get_label_number()) || -1;
    this.latest_location = (this.up && this.up.get_latest_location()) || 0;
    // Bult-in functions and variables have a special stack number and stack location: (-1, ?).
    this.variables = {
      '+': new Symbol('+', -1, Builtins.PLUS)
    };
    this.stack_number = (this.up && this.up.get_stack_number()) || 0;
  }

  has_variable(variable : Symbol) : boolean {
    return this.variables[variable.symb] || (this.up && this.up.has_variable(variable));
  }

  get_variable(variable : Symbol) : Symbol {
    return this.variables[variable.symb] || (this.up && this.up.get_variable(variable));
  }

  get_label_number() : number {
    return this.label_number;
  }

  // Tack on another context whenver we introduce new scope.
  increment() : AnnotationContext {
    return new AnnotationContext(this);
  }

  add_variable(name : string, node : Symbol) : void {
    this.latest_location += 1;
    this.variables[name] = node;
  }

  get_latest_location() : number {
    return this.latest_location;
  }

  get_stack_number() : number {
    return this.stack_number;
  }

  // The ordering of things is again important because of the various side-effects of incrementing stack and
  // location numbers.
  increment_stack_number() : void {
    this.stack_number += 1;
    this.latest_location = 0;
  }

  // Increment the label counter and give us another unique label.
  get_label() : string {
    this.label_number += 1;
    return 'label' + this.label_number;
  }

}

class ASTNode { 

  refine() : ASTNode { return this; }

  symbol() : boolean { return false; }

  annotate(context : AnnotationContext) : void {
    throw new Error('Should never happen.');
  }

  compile() : Array<Instruction> {
    throw new Error('Should never happen.');
  }

}

// Number.
class Num extends ASTNode { 

  constructor(private num : number) { super(); }

  // Nothing to do.
  annotate(context : AnnotationContext) : void {
    return;
  }

  // Load the constant and push it to the heap.
  compile() : Array<Instruction> {
    return [I.LOAD({constant: this.num}), I.MKBASIC()];
  }

}

// Symbol. Just a wrapper around a set of characters.
class Symbol extends ASTNode {

  constructor(public symb : string, public stack : number, public stack_location : number) { super(); }

  symbol() : boolean { return true; }

  // Annotate with stack number and location. The order in which we call things is important because
  // adding a variable increments the latest stack location. Might be a better way to do this.
  // We also need to be careful about annotating variables that have already been declared. If the variable
  // has already been declared then we annotate it with the same data as the previous declaration.
  annotate(context : AnnotationContext) : void {
    // This is kinda ugly. TODO: Figure out a better way.
    if (context.has_variable(this)) {
      // Not sure if this is valid. TODO: Fix this.
      console.log('Variable already declared. Assuming use site.');
      var symbol : Symbol = context.get_variable(this);
      this.stack = symbol.get_stack_number();
      this.stack_location = symbol.get_stack_location();
      return;
    }
    this.stack = context.get_stack_number();
    this.stack_location = context.get_latest_location();
    context.add_variable(this.symb, this);
  }

  get_stack_number() : number {
    return this.stack;
  }

  get_stack_location() : number {
    return this.stack_location;
  }

  // Load a variable accounting for stack nesting and stack location on that stack level.
  compile() : Array<Instruction> {
    return [I.LOADVAR({stack: this.stack, stack_location: this.stack_location})];
  }

}

// List the data not the s-expression.
class List extends ASTNode {

  constructor(private list : Array<ASTNode>) { super(); }

  annotate(context : AnnotationContext) : void {
    this.list.forEach(x => x.annotate(context));
  }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Basically same as List but is more like the mathematical vector than a list.
class Tuple extends ASTNode {

  constructor(private elements : Array<ASTNode>) { super(); }

  annotate(context : AnnotationContext) : void {
    this.elements.forEach(x => x.annotate(context));
  }

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

  compile() : Array<Instruction> {
    throw new Error('Should never happen.');
  }

  // SExpr should not appear anywhere during the compilation process because the refinement process
  // must get rid of all SExpr instances.
  annotate(context : AnnotationContext) : void {
    throw new Error('Should never be called.');
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
    return new FunctionCall(this.head.refine(), this.tail.map((x : ASTNode) : ASTNode => x.refine()));
  }

}

// s-expressions get refined and this is one of the control structures that we get.
class IfExpression extends ASTNode {

  private false_branch_label : string;

  private end_label : string;

  constructor(private test : ASTNode, private true_branch : ASTNode, private false_branch : ASTNode) { super(); }

  // Pretty simple. Generate labels and recursively annotate the children.
  annotate(context : AnnotationContext) : void {
    // get the labels
    this.end_label = context.get_label();
    this.false_branch_label = context.get_label();
    // recurse
    this.test.annotate(context);
    this.true_branch.annotate(context);
    this.false_branch.annotate(context);
  }

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

  // There are only three possibilities for what can be the head of the function call:
  // anonymous function, built-in, or function reference.
  constructor(private func : ASTNode, private args : Array<ASTNode>) { super(); }

  // First evaluate the arguments. Push arguments onto the new stack. Push the function/closure
  // reference. Call the function.
  // arg1 arg2 ... argN pushstack(N) func-reference apply(N)
  compile() : Array<Instruction> {
    console.log('Compiling function call: ', this.func);
    var compiled_args = this.args.reduce((previous : Array<Instruction>, current : ASTNode, index : number, args : Array<ASTNode>) => {
      return previous.concat(current.compile());
    }, []);
    var compiled_func = this.func.compile();
    // We push an extra argument because the last argument is going to be the reference to the function we want to apply.
    return compiled_args.concat(compiled_func).concat([I.PUSHSTACK({count: this.args.length + 1}), I.APPLY()]);
  }

  // Doesn't look like I need to do anything other than recursively call annotate.
  annotate(context : AnnotationContext) : void {
    this.args.forEach(x => x.annotate(context));
    var func_call_context = context.increment();
    func_call_context.increment_stack_number();
    this.func.annotate(func_call_context);
  }

}

// Anonymous function is just a set of arguments which need to be symbols and a body.
class AnonymousFunction extends ASTNode {

  // We use the label during a second pass to resolve jump addresses.
  private starting_label : string;

  // Marks the end of the function body.
  private ending_label : string;

  // Arguments and the body of the function.
  constructor(private args : Array<Symbol>, private body : FunctionBody) { super(); }

  // Mark the starting point for the function. Compile the instructions. Make a function object
  // that points at the starting label as the code start point.
  compile() : Array<Instruction> {
    console.log('Compiling function. Starting label: ', this.starting_label);
    return [I.LABEL({label: this.starting_label}),
      I.MKFUNC({label: this.ending_label, argument_count: this.args.length})].concat(
        this.body.compile()).concat(I.LABEL({label: this.ending_label}));
  }

  // Generate the label and then increment the context and annotate the arguments and body in that context.
  // Incrementing the context because we want to mimic the scoping rules of the language.
  annotate(context : AnnotationContext) : void {
    this.starting_label = context.get_label();
    this.ending_label = this.starting_label + 'end';
    var body_context = context.increment();
    this.args.forEach(x => x.annotate(body_context));
    this.body.annotate(body_context);
  }

}

// A wrapper around a generic ASTNode.
class FunctionBody extends ASTNode {

  constructor(private exprs : ASTNode) { super(); }

  compile() : Array<Instruction> {
    return this.exprs.compile();
  }

  // Just recurse. Not sure if correct.
  annotate(context : AnnotationContext) : void {
    this.exprs.annotate(context);
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

  // Let expressions introduce a new scope and hence a new context. We annotate the bindings in the new
  // context and then annotate the body in that context.
  annotate(context : AnnotationContext) : void {
    var let_context = context.increment();
    this.bindings.forEach(binding => binding.annotate(let_context));
    this.body.annotate(let_context);
  }

}

// The actual binding pair that appears in let expressions.
class BindingPair extends ASTNode {

  constructor(private variable : Symbol, private value : ASTNode) { super(); }

  // Compile the variable. Compile the value. Perform the assignment.
  compile() : Array<Instruction> {
    var var_location = this.variable.get_stack_location();
    return [I.INITVAR({var_location: var_location})].concat(this.value.compile()).concat([I.STOREA({store_location: var_location})]);
  }

  // Recursively annotate the variable and the value it corresponds to. This means no forward references.
  // If we annotate all the variables ahead of all the values then both forward and backward references will be
  // allowed.
  annotate(context : AnnotationContext) : void {
    this.variable.annotate(context);
    this.value.annotate(context);
  }

}

// Pattern matching.
class MatchExpression extends ASTNode {

  constructor(private value : ASTNode, private patterns : Array<PatternPair>) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

  // Each pattern gets annotated in a different context because patterns can introduce bindings.
  annotate(context : AnnotationContext) : void {
    this.value.annotate(context);
    this.patterns.forEach(p => { var pattern_context = context.increment(); p.annotate(pattern_context); });
  }

}

// Like let expressions but this time we have pattern matching pairs.
class PatternPair extends ASTNode {

  constructor(private pattern : ASTNode, private expression : ASTNode) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

  // A match expression introduces a new context for each pattern so we don't need to increment the context
  // here. We can just annotate.
  annotate(context : AnnotationContext) : void {
    this.pattern.annotate(context);
    this.expression.annotate(context);
  }

}
