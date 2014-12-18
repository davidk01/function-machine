/// <reference path="vm.ts" />
/// <reference path="annotationcontext.ts" />
var I = Instruction;

class LoadVarData {
  
  constructor() { }

}

class LabelData {

  constructor(public label : string) { }

}

class MkFuncData {

  constructor(public label : string, public argument_count : number) { }

}

class StackLocation {

  constructor(public stack_number : number, public stack_location : number) { }

}

// Top of AST hierarchy.
class ASTNode { 

  symbol() : boolean { return false; }

  compile() : Array<Instruction> {
    throw new Error('Should never happen.');
  }

}

// Number.
class Num extends ASTNode { 

  constructor(private num : number, public attrs : any) { super(); }

  // Load the constant and push it to the heap.
  compile() : Array<Instruction> {
    return [I.LOAD({constant: this.num}), I.MKBASIC()];
  }

}

// Symbol. Just a wrapper around a set of characters.
class Symbol extends ASTNode {

  constructor(public symb : string, public attrs : any) { super(); }

  symbol() : boolean { return true; }

  // Load a variable accounting for stack nesting and stack location on that stack level.
  compile() : Array<Instruction> {
    var stack_data = this.attrs.stack_data;
    return [I.LOADVAR(stack_data)];
  }

}

// List the data not the s-expression.
class List extends ASTNode {

  constructor(private list : Array<ASTNode>, public attrs : any) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

// Basically same as List but is more like the mathematical vector than a list.
class Tuple extends ASTNode {

  constructor(private elements : Array<ASTNode>, public attrs : any) { super(); }

  compile() : Array<Instruction> {
    throw new Error();
  }

}

class FunctionApplication extends ASTNode {

  constructor(private func : AnonymousFunction, private args : Array<ASTNode>, public attrs : { arg_count : number }) { super(); }

}

class ClosureApplication extends ASTNode {

  constructor(private func : FunctionApplication, private args : Array<ASTNode>, public attrs : { arg_count : number }) { super(); }

}

// s-expressions get refined and this is one of the control structures that we get.
class IfExpression extends ASTNode {

  constructor(private test : ASTNode, private true_branch : ASTNode, private false_branch : ASTNode, public attrs : any) { super(); }

  // Nothing too fancy. Just some labels and jumps.
  // [test] jumpz(false) [true] jump(end) false [false] end
  compile() : Array<Instruction> {
    var comiled_test = this.test_compile();
    var compiled_true_branch = this.true_branch.compile();
    var compiled_false_branch = this.false_branch.compile();
    var end_label = this.attrs.end_label;
    var false_branch_label = this.attrs.false_branch_label;
    var code = compiled_test.concat(I.JUMPZ(false_branch_label)).concat(compiled_true_branch).concat(
      I.JUMP(end_label), I.LABEL(false_branch_label)).concat(compiled_false_branch).concat(I.LABEL(end_label));
    return code;
  }

}

// Exactly what it sounds like. We have a symbol or anonymous function and the list of arguments.
class FunctionCall extends ASTNode {

  constructor(private func : ASTNode, private args : Array<ASTNode>) { super(); }

  // First evaluate the arguments. Push arguments onto the new stack. Push the function/closure
  // reference. Call the function.
  // arg1 arg2 ... argN pushstack(N) func-reference apply(N)
  compile() : Array<Instruction> {
    var compiled_args = this.args.reduce((previous : Array<Instruction>, current : ASTNode) => {
      return previous.concat(current.compile());
    }, []);
    var compiled_func = this.func.compile();
    // We push an extra argument because the last argument is going to be the reference to the function we want to apply.
    return compiled_args.concat(compiled_func).concat(I.PUSHSTACK({count: this.args.length + 1}), I.APPLY());
  }

}

// Anonymous function is just a set of arguments which need to be symbols and a body.
class AnonymousFunction extends ASTNode {

  constructor(private args : Array<Symbol>, private body : FunctionBody, public attrs : any) { super(); }

  // Mark the starting point for the function. Compile the instructions. Make a function object
  // that points at the starting label as the code start point.
  compile() : Array<Instruction> {
    var starting_label = this.attrs.starting_label;
    var mkfunc_data = this.attrs.mkfunc_data;
    var arg_count = this.attrs.arg_count;
    var compiled_body = this.body.compile();
    var ending_label = this.attrs.ending_label;
    return [I.LABEL(starting_label), I.MKFUNC(mkfunc_data)].concat(I.ARGCHECK(arg_count)).concat(
      this.body.compile()).concat(I.RETURN(), I.LABEL(ending_label));
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

  constructor(private bindings : Array<BindingPair>, private body : ASTNode, public attrs : any) { super(); }

  // Compile the bindings. Compile the body. Stick them together.
  compile() : Array<Instruction> {
    var compiled_body = this.body.compile();
    var compiled_bindings = this.bindings.reduce((previous : Array<Instruction>, current : BindingPair) => {
        return previous.concat(current.compile());
    }, []);
    return compiled_bindings.concat(compiled_body);
  }

}

// The actual binding pair that appears in let expressions.
class BindingPair extends ASTNode {

  constructor(private variable : Symbol, private value : ASTNode, public attrs : any) { super(); }

  // Compile the variable. Compile the value. Perform the assignment.
  compile() : Array<Instruction> {
    var var_location = this.variable.attrs.stack_location;
    var compiled_value = this.value.compile();
    return [I.INITVAR(var_location)].concat(compiled_value).concat(I.STOREA(var_location));
  }

}
