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

  annotate(context : AnnotationContext) {
    throw new Error();
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
    return [I.LOADVAR(this.attrs.get_stack_data())];
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
    return this.test.compile().concat([I.JUMPZ(this.attrs.if_false_branch_label_data)]).concat(this.true_branch.compile()).concat(
      [I.JUMP(this.attrs.if_end_label_data), I.LABEL(this.attrs.if_false_branch_label_data)]).concat(this.false_branch.compile()).concat(
        [I.LABEL(this.attrs.if_end_label_data)]);
  }

}

// Exactly what it sounds like. We have a symbol or anonymous function and the list of arguments.
class FunctionCall extends ASTNode {

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

}

// Anonymous function is just a set of arguments which need to be symbols and a body.
class AnonymousFunction extends ASTNode {

  constructor(private args : Array<Symbol>, private body : FunctionBody, public attrs : any) { super(); }

  // Mark the starting point for the function. Compile the instructions. Make a function object
  // that points at the starting label as the code start point.
  compile() : Array<Instruction> {
    return [I.LABEL(this.attrs.anonymous_func_starting_label),
      I.MKFUNC(this.attrs.anonymous_func_mkfunc_data)].concat(
        I.ARGCHECK({count: this.args.length})).concat(this.body.compile()).concat(
          [I.RETURN(), I.LABEL(this.attrs.anonymous_func_ending_label)]);
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
    var compiled_bindings = this.bindings.reduce((previous : Array<Instruction>,
      current : BindingPair, index : number, bindings : Array<BindingPair>) => {
        return previous.concat(current.compile());
    }, []);
    return compiled_bindings.concat(this.body.compile());
  }

}

// The actual binding pair that appears in let expressions.
class BindingPair extends ASTNode {

  constructor(private variable : Symbol, private value : ASTNode, public attrs : any) { super(); }

  // Compile the variable. Compile the value. Perform the assignment.
  compile() : Array<Instruction> {
    var var_location = this.variable.attrs.stack_location;
    return [I.INITVAR(var_location)].concat(this.value.compile()).concat([I.STOREA(var_location)]);
  }

}
