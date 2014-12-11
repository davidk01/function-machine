enum Instructions {
  LOAD, MKBASIC, INITVAR, STOREA, LABEL, MKFUNC,
  JUMPZ, JUMP, PUSHSTACK, APPLY, LOADVAR
}

class Instruction { 

  // Load a variable from the stack location specified by stack number. We figure this stuff out
  // statically during typechecking/AST annotation phase.
  static LOADVAR(args : {stack : number; stack_location : number}) {
    if (!(args.stack && args.stack_location)) {
      throw new Error('Must provide stack and stack location.');
    }
    return new Instruction(Instructions.LOADVAR, args);
  }

  // Push 'n' number of variables onto a new stack.
  static PUSHSTACK(args : {count : number}) {
    if (!args.count) {
      throw new Error('Must provide number of elements to push onto new stack.');
    }
    return new Instruction(Instructions.PUSHSTACK, args);
  }

  // Apply the function object at the top of the stack.
  static APPLY() {
    return new Instruction(Instructions.APPLY, null);
  }

  // Jump if zero.
  static JUMPZ(args : {label : string}) {
    if (!args.label) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction(Instructions.JUMPZ, args);
  }

  // Unconditional jump.
  static JUMP(args : {label : string}) {
    if (!args.label) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction(Instructions.JUMP, args);
  }

  // Load a constant.
  static LOAD(constant : {constant : number}) {
    return new Instruction(Instructions.LOAD, constant);
  }

  // Make a basic variable of whatever sitting on top of the stack.
  static MKBASIC() {
    return new Instruction(Instructions.MKBASIC, null);
  }

  // Initialize a variable on top of stack. Basically a null pointer.
  static INITVAR(args : {var_location : number}) {
    if (!args.var_location) {
      throw new Error('Must provide location for variable initialization.');
    }
    return new Instruction(Instructions.INITVAR, args);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(args : {store_location : number}) {
    if (!args.store_location) {
      throw new Error('Must provide store location.');
    }
    return new Instruction(Instructions.STOREA, args);
  }

  // Label for jumps.
  static LABEL(args : {label : string}) {
    if (!args.label) {
      throw new Error('Must provide label.');
    }
    return new Instruction(Instructions.LABEL, args);
  }

  static MKFUNC(args : {label : string; argument_count : number}) {
    if (!(args.label && args.argument_count)) {
      throw new Error('Missing parameters for MKFUNC.');
    }
    return new Instruction(Instructions.MKFUNC, args);
  }

  constructor(public instruction : Instructions, public args : {}) { }

}

class Stack {

  // Holds the actual stack contents for this level.
  stack : Array<any>;

  constructor(private up : Stack, private level : number) { 
    this.stack = [];
  }

  // Chain another stack on this one and also increment the level.
  increment() : Stack {
    return new Stack(this, this.level + 1);
  }

}

class VM {

  // Current instruction.
  private ir : Instruction;

  // Program counter.
  private pc : number;

  // Current runtime stack.
  private stack : Stack;

  // Take the instructions and initialize the program counter and the initial stack.
  constructor(private instructions : Array<Instruction>) {
    this.pc = 0;
    this.stack = new Stack(null, 0);
  }

  // A string representation of the current VM state.
  repr() : string {
    return  "pc: " + this.pc.toString() + "\n" +
      "ir: " + this.ir.toString() + "\n";
  }

  // run until there are no more instructions or we hit halt and
  // throw an exception.
  run() : void {
    while (this.ir) {
      this.step();
    }
  }

  // Fetch and execute.
  step() : void {
    this.fetch();
    this.execute();
  }

  // Fetch the instruction pointed at by current PC and increment PC.
  fetch() : void {
    this.ir = this.instructions[this.pc];
    this.pc += 1;
  }

  // Execute the instruction.
  execute() : void {
    switch(this.ir.instruction) {
      case Instructions.LOAD:
      case Instructions.MKBASIC:
      case Instructions.INITVAR:
      case Instructions.STOREA:
      case Instructions.LABEL:
      case Instructions.MKFUNC:
      case Instructions.JUMPZ:
      case Instructions.JUMP:
      case Instructions.PUSHSTACK:
      case Instructions.APPLY:
      case Instructions.LOADVAR:
      default:
        throw new Error('Unrecognized instruction.');
    }
  }

}
