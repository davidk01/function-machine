interface InstructionArgs { }

class ArgCheckArguments implements InstructionArgs {
  
  constructor() { }

}

class PushStackArguments implements InstructionArgs {

  constructor(public count : number) { }

}

class JumpArguments implements InstructionArgs {

  constructor(public label : string) { }

}

class LoadArguments implements InstructionArgs {

  constructor(public constant : number) { }

}

// Bunch of static methods for generating instructions. Really just a bunch of boilerplate that is
// unavoidable. Not sure what the best way is to validate the instructions have the right arguments.
class Instruction { 

  private static is_null(obj : any) : boolean {
    return obj == null || obj == undefined;
  }

  // Load a variable from the stack location specified by stack number. We figure this stuff out
  // statically during typechecking/AST annotation phase.
  static LOADVAR(args : StackLocation) {
    if (this.is_null(args.stack_number && args.stack_location)) {
      throw new Error('Must provide stack and stack location.');
    }
    return new Instruction('loadvar', args);
  }

  // Checks the stack argument count to make sure the function can be applied.
  // In case there aren't enough arguments we need to return a closure.
  static ARGCHECK(args : ArgCheckArguments) {
    return new Instruction('argcheck', args);
  }

  // Return instruction.
  static RETURN() {
    return new Instruction('return', null);
  }

  // Push 'n' number of variables onto a new stack.
  static PUSHSTACK(args : PushStackArguments) {
    if (this.is_null(args.count)) {
      throw new Error('Must provide number of elements to push onto new stack.');
    }
    return new Instruction('pushstack', args);
  }

  // Apply the function object at the top of the stack.
  static APPLY() {
    return new Instruction('apply', null);
  }

  // Jump if zero.
  static JUMPZ(args : JumpArguments) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction('jumpz', args);
  }

  // Unconditional jump.
  static JUMP(args : JumpArguments) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction('jump', args);
  }

  // Load a constant.
  static LOAD(constant : LoadArguments) {
    if (this.is_null(constant.constant)) {
      throw new Error('Must provide constant.');
    }
    return new Instruction('load', constant);
  }

  // Make a basic variable of whatever sitting on top of the stack.
  static MKBASIC() {
    return new Instruction('mkbasic', null);
  }

  // Initialize a variable on top of stack. Basically a null pointer.
  static INITVAR(args : StackLocation) {
    if (this.is_null(args.stack_number && args.stack_location)) {
      throw new Error('Must provide location for variable initialization.');
    }
    return new Instruction('initvar', args);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(args : StackLocation) {
    if (this.is_null(args.stack_number && args.stack_location)) {
      throw new Error('Must provide store location.');
    }
    return new Instruction('storea', args);
  }

  // Label for jumps.
  static LABEL(args : JumpArguments) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide label.');
    }
    return new Instruction('label', args);
  }

  static MKFUNC(args : MkFuncData) {
    if (this.is_null(args.label && args.argument_count)) {
      throw new Error('Missing parameters for MKFUNC.');
    }
    return new Instruction('mkfunc', args);
  }

  constructor(public instruction : string, public args : InstructionArgs) { }

}
