// Basic instructions
enum Instructions {
  LOAD, MKBASIC, INITVAR, STOREA, LABEL, MKFUNC,
  JUMPZ, JUMP, PUSHSTACK, APPLY, LOADVAR
}

// Builtin functions
enum Builtins {
  PLUS
}

class Instruction { 

  private static is_null(obj : any) {
    return obj == null || obj == undefined;
  }

  // Load a variable from the stack location specified by stack number. We figure this stuff out
  // statically during typechecking/AST annotation phase.
  static LOADVAR(args : {stack : number; stack_location : number}) {
    if (this.is_null(args.stack && args.stack_location)) {
      throw new Error('Must provide stack and stack location.');
    }
    return new Instruction(Instructions.LOADVAR, args);
  }

  // Push 'n' number of variables onto a new stack.
  static PUSHSTACK(args : {count : number}) {
    if (this.is_null(args.count)) {
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
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction(Instructions.JUMPZ, args);
  }

  // Unconditional jump.
  static JUMP(args : {label : string}) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction(Instructions.JUMP, args);
  }

  // Load a constant.
  static LOAD(constant : {constant : number}) {
    if (this.is_null(constant.constant)) {
      throw new Error('Must provide constant.');
    }
    return new Instruction(Instructions.LOAD, constant);
  }

  // Make a basic variable of whatever sitting on top of the stack.
  static MKBASIC() {
    return new Instruction(Instructions.MKBASIC, null);
  }

  // Initialize a variable on top of stack. Basically a null pointer.
  static INITVAR(args : {var_location : number}) {
    if (this.is_null(args.var_location)) {
      throw new Error('Must provide location for variable initialization.');
    }
    return new Instruction(Instructions.INITVAR, args);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(args : {store_location : number}) {
    if (this.is_null(args.store_location)) {
      throw new Error('Must provide store location.');
    }
    return new Instruction(Instructions.STOREA, args);
  }

  // Label for jumps.
  static LABEL(args : {label : string}) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide label.');
    }
    return new Instruction(Instructions.LABEL, args);
  }

  static MKFUNC(args : {label : string; argument_count : number}) {
    if (this.is_null(args.label && args.argument_count)) {
      throw new Error('Missing parameters for MKFUNC.');
    }
    return new Instruction(Instructions.MKFUNC, args);
  }

  constructor(public instruction : Instructions, public args : {}) { }

}

// Heap reference types.
enum RefType {
  BASIC, VECTOR, BUILTIN, FUNCTION, CLOSURE
}

// An actual heap reference.
class HeapRef {

  constructor(public type : RefType, public value : any) { }

  repr() : string {
    return "{Type = " + this.type + " , Value = " + JSON.stringify(this.value) + "}";
  }

}

// Just a map from integers to heap references.
class Heap {

  private heap : { [n : number] : HeapRef };

  private current_index : number;

  constructor() {
    this.current_index = 0;
    this.heap = {};
  }

  repr() : string {
    var accumulator : string = "";
    for (var i = 0; i < this.current_index; i++) {
      accumulator += ("" + i + " => " + this.heap[i].repr() + "\n");
    }
    return accumulator;
  }

  // Generate a function pointer.
  func_ref(pc : number) : HeapRef {
    var new_ref : HeapRef = new HeapRef(RefType.FUNCTION, pc);
    this.heap[this.current_index] = new_ref;
    this.current_index += 1;
    return new_ref;
  }

  // Generate a basic value pointer.
  basic_ref(val : number) : HeapRef {
    var new_ref : HeapRef = new HeapRef(RefType.BASIC, val);
    this.heap[this.current_index] = new_ref;
    this.current_index += 1;
    return new_ref;
  }

}

interface StackLocation {
  stack : number;
  stack_location : number;
}

// Populate the builtin map so that LOADVAR instructions can load them.
function generate_builtins() {
  var builtins : { [index : number] : HeapRef } = {};
  builtins[Builtins.PLUS] = new HeapRef(RefType.BUILTIN, null);
  return builtins;
}

// Stack, wraps an array and exposes some basic operations.
class Stack {

  static builtins = generate_builtins();

  // Holds the actual stack contents for this level.
  stack : Array<any>;

  constructor(private up : Stack, private level : number) { 
    this.stack = [];
  }

  private current_repr() : string {
    return this.stack.map(x => {
      if (x.repr) {
        return x.repr();
      } else {
        console.log('repr not found: ', x);
        return x.toString();
      }
    }).join(', ');
  }

  repr() : string {
    if (this.up) {
      return this.up.repr() + " | " + this.current_repr();
    }
    return this.current_repr();
  }

  get_builtin(builtin_location : number) {
    return Stack.builtins[builtin_location];
  }

  get_variable(args : StackLocation) : any {
    if (args.stack == -1) { // Working with builtins
      return this.get_builtin(args.stack_location);
    }
    if (args.stack == this.level) {
      return this.stack[args.stack_location];
    } else if (args.stack > this.level) {
      throw new Error('Can not load from a future stack level, yet.');
    } else {
      return this.up.get_variable(args);
    }
  }

  // Chain another stack on this one and also increment the level.
  increment() : Stack {
    return new Stack(this, this.level + 1);
  }

  unshift(val : any) : void {
    this.stack.unshift(val);
  }

  // Just push a constant on the stack. Constants for now are just ints.
  push(val : any) : void {
    this.stack.push(val);
  }

  pop() : any {
    return this.stack.pop();
  }

}

// What runs our code.
class VM {

  // Current instruction.
  private ir : Instruction;

  // Program counter.
  private pc : number;

  // Current runtime stack.
  private stack : Stack;

  // Runtime heap.
  private heap : Heap;

  // Keeps track of label addresses as we resolve them during runtime.
  private label_map : { [label : string] : number };

  // Return stack.
  private returns : Array<number>;

  // Take the instructions and initialize the program counter, the initial stack, heap, etc.
  constructor(private instructions : Array<Instruction>) {
    this.pc = 0;
    this.stack = new Stack(null, 0);
    this.heap = new Heap();
    this.label_map = {};
    this.returns = [];
  }

  // Null check.
  is_not_null(obj : any) : boolean {
    return !(obj == null || obj == undefined);
  }

  // Figure out the address of the label at runtime and then cache the result.
  resolve_label(label : string) : number {
    if (this.label_map[label]) {
      return this.label_map[label];
    }
    for (var i = 0; i < this.instructions.length; i++) {
      var instruction = this.instructions[i];
      var args : any = instruction.args;
      if (instruction.instruction == Instructions.LABEL &&
        this.is_not_null(args) && args.label && args.label == label) {
        this.label_map[label] = i;
        return i;
      }
    }
    throw new Error('Could not resolve label.');
  }

  // A string representation of the current VM state.
  repr() : string {
    return  "pc: " + this.pc.toString() + "\n" +
      "ir: " + JSON.stringify(this.ir) + "\n" +
      "stack: " + this.stack.repr() + "\n" +
      "heap: " + this.heap.repr();
  }

  // run until there are no more instructions or we hit halt and
  // throw an exception.
  run() : void {
    this.step();
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
    var args : any = this.ir.args;
    switch(this.ir.instruction) {
      case Instructions.LOAD: // Just loads a constant
        console.log('LOAD');
        this.stack.push(args.constant);
        break;
      case Instructions.MKBASIC: // Make a basic variable reference, ints for the time being
        console.log('MKBASIC');
        var basic : number = (<number>this.stack.pop());
        var basic_ref : HeapRef = this.heap.basic_ref(basic);
        this.stack.push(basic_ref);
        break;
      case Instructions.INITVAR: // Initialize a variable on the stack at a specific location
        console.log('INITVAR');
        throw new Error();
        break;
      case Instructions.STOREA: // Store the top of the stack at the specified address
        console.log('STOREA');
        throw new Error();
        break;
      case Instructions.LABEL: // noop, just used for resolving jump addresses
        console.log('LABEL');
        break;
      case Instructions.MKFUNC: // Make a function object and push the reference onto the stack
        console.log('MKFUNC');
        var func_ref : HeapRef = this.heap.func_ref(this.pc);
        this.stack.push(func_ref);
        this.pc = this.resolve_label(args.label);
        break;
      case Instructions.JUMPZ: // Jump if top of stack is zero
        console.log('JUMPZ');
        throw new Error();
        break;
      case Instructions.JUMP: // Unconditional jump
        console.log('JUMP');
        throw new Error();
        break;
      case Instructions.PUSHSTACK: // Push specified number of values onto new stack and preserve the order
        console.log('PUSHSTACK');
        var new_stack : Stack = this.stack.increment();
        new_stack.unshift(this.stack.pop());
        new_stack.unshift(this.stack.pop());
        this.stack = new_stack;
        break;
      case Instructions.APPLY: // Apply the function reference on top of stack
        console.log('APPLY');
        var func_ref : HeapRef = this.stack.pop();
        if (func_ref.type == RefType.BUILTIN) {
          throw new Error();
        }
        if (!(func_ref.type == RefType.FUNCTION)) {
          throw new Error('Can not apply non-function reference.');
        }
        this.returns.push(this.pc);
        this.pc = func_ref.value;
        break;
      case Instructions.LOADVAR: // Load a variable from a specific stack and location
        console.log('LOADVAR');
        this.stack.push(this.stack.get_variable(args));
        break;
      default:
        throw new Error('Unrecognized instruction.');
    }
  }

}
