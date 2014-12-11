enum Instructions {
  LOAD, MKBASIC, INITVAR, STOREA, LABEL, MKFUNC,
  JUMPZ, JUMP, PUSHSTACK, APPLY, LOADVAR
}

class Instruction { 

  static LOADVAR(stack : number, stack_location : number) {
    return new Instruction(Instructions.LOADVAR, {stack: stack, stack_location: stack_location});
  }

  // Push 'n' number of variables onto a new stack.
  static PUSHSTACK(n : number) {
    return new Instruction(Instructions.PUSHSTACK, {count: n});
  }

  // Apply the function object at the top of the stack.
  static APPLY() {
    return new Instruction(Instructions.APPLY, null);
  }

  // Jump if zero.
  static JUMPZ(label : string) {
    return new Instruction(Instructions.JUMPZ, {label: label});
  }

  // Unconditional jump.
  static JUMP(label : string) {
    return new Instruction(Instructions.JUMP, {label: label});
  }

  // Load a constant.
  static LOAD(constant : {}) {
    return new Instruction(Instructions.LOAD, constant);
  }

  // Make a basic variable of whatever sitting on top of the stack.
  static MKBASIC() {
    return new Instruction(Instructions.MKBASIC, null);
  }

  // Initialize a variable on top of stack. Basically a null pointer.
  static INITVAR() {
    return new Instruction(Instructions.INITVAR, null);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(loc : number) {
    return new Instruction(Instructions.STOREA, {store_location: loc});
  }

  // Label for jumps.
  static LABEL(label : string) {
    return new Instruction(Instructions.LABEL, {label: label});
  }

  static MKFUNC(label : string, arg_count : number) {
    return new Instruction(Instructions.MKFUNC, {starting_point: label, arg_count: arg_count});
  }

  constructor(private instruction : Instructions, private args : {}) { }

}
