enum Instructions {
  LOAD,
  MKBASIC,
  INITVAR,
  STOREA
}

class Instruction { 

  // Load a constant.
  static LOAD(...args : Array<any>) {
    return new Instruction(Instructions.LOAD, args);
  }

  // Make a basic variable of whatever sitting on top of the stack.
  static MKBASIC() {
    return new Instruction(Instructions.MKBASIC, []);
  }

  // Initialize a variable on top of stack. Basically a null pointer.
  static INITVAR() {
    return new Instruction(Instructions.INITVAR, []);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(loc : number) {
    return new Instruction(Instructions.STOREA, [loc]);
  }

  constructor(private instruction : Instructions, private args : Array<any>) { }

}
