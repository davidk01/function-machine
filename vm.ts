/// <reference path="instruction.ts" />
/// <reference path="heap.ts" />
/// <reference path="stack.ts" />
/// <reference path="builtins.ts" />

// Allows us to defer the resolution of labels to program points to runtime.
interface LabelMap {
  [label : string] : CodeAddress;
}

// What runs our code.
class VM {

  // Current instruction.
  private ir : Instruction;

  // Program counter.
  private pc : number;

  // Current runtime stack.
  stack : Stack;

  // Runtime heap.
  heap : Heap;

  // Keeps track of label addresses as we resolve them during runtime.
  private label_map : LabelMap;

  // Return stack. Contains program counters.
  private returns : Array<number>;

  // Take the instructions and initialize the program counter, the initial stack, heap, etc.
  constructor(private instructions : Array<Instruction>) {
    this.pc = 0;
    this.stack = new Stack(null, 0); // no parent, level 0.
    this.heap = new Heap();
    this.label_map = {};
    this.returns = [];
  }

  // Null check.
  is_not_null(obj : any) : boolean {
    if (obj == null || obj == undefined) {
      throw new Error('Null check failed.');
    }
    return true;
  }

  // Return. Pop program counter from return stack and do some basic bookkeeping.
  ret() : void {
    var return_value : Ref = this.stack.pop();
    this.stack = this.stack.up;
    this.stack.push(return_value);
    this.pc = this.returns.pop();
  }

  // Dereference a reference value, i.e. retrieve the heap value it points to.
  deref(ref : Ref) : Ref {
    return this.heap.get_ref(ref);
  }

  // Figure out the address of the label at runtime and then cache the result.
  resolve_label(label : string) : number {
    if (this.label_map[label]) {
      return this.label_map[label];
    }
    for (var i = 0; i < this.instructions.length; i++) {
      var instruction = this.instructions[i];
      var args : InstructionArgs = instruction.args;
      if (instruction.instruction === 'label' &&
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
      "ir: " + this.ir.instruction + "\n" +
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

  // Generate a basic reference for the given number.
  basic_ref(val : number) : Ref {
    return this.heap.basic_ref(val);
  }

  // Generate a function reference with the given program counter.
  func_ref(pc : number) : Ref {
    return this.heap.func_ref(pc);
  }

  // Number of elements on the current stack.
  stack_length() : number {
    return this.stack.stack.length;
  }

  // Take the given references and wrap them up in a vector reference.
  vector_ref(vals : Array<Ref>) : Ref {
    return this.heap.vector_ref(vals);
  }

  // Create a reference to a closure with the given argument vector and program counter.
  closure_ref(arg_vector : Ref, pc : number) : Ref {
    return this.heap.closure_ref({arg_vector: arg_vector, pc: pc});
  }

  // Empty the stack.
  reset() : void {
    this.stack.reset();
  }

  // Execute the instruction.
  execute() : void {
    var args : InstructionArgs = this.ir.args;
    console.log(this.ir.instruction);
    switch(this.ir.instruction) {
      case 'load': // Just loads a constant
        this.stack.push(args.constant);
        break;
      case 'mkbasic': // Make a basic variable reference, ints for the time being
        var basic : number = (<number>this.stack.pop());
        var basic_ref : Ref = this.basic_ref(basic);
        this.stack.push(basic_ref);
        break;
      case 'initvar': // Initialize a variable on the stack at a specific location
        throw new Error();
        break;
      case 'storea': // Store the top of the stack at the specified address
        throw new Error();
        break;
      case 'label': // noop, just used for resolving jump addresses
        break;
      case 'mkfunc': // Make a function object and push the reference onto the stack
        var func_ref : Ref = this.func_ref(this.pc);
        this.stack.push(func_ref);
        this.pc = this.resolve_label(args.label);
        break;
      case 'jumpz': // Jump if top of stack is zero
        throw new Error();
        break;
      case 'jump': // Unconditional jump
        throw new Error();
        break;
      case 'pushstack': // Push specified number of values onto new stack and preserve the order
        var new_stack : Stack = this.stack.increment();
        for (var i = 0; i < args.count; i++) {
          new_stack.unshift(this.stack.pop());
        }
        this.stack = new_stack;
        break;
      case 'return':
        this.ret();
        break;
      case 'apply': // Apply the function reference on top of stack
        this.returns.push(this.pc);
        var func_ref : Ref = this.stack.pop();
        if (func_ref.type == RefType.BUILTIN) {
          func_ref.value(this);
          return;
        } else if (func_ref.type == RefType.FUNCTION) {
          var destination : number = this.deref(func_ref).value;
          this.pc = destination;
          return;
        } else if (func_ref.type == RefType.CLOSURE) {
          var closure : Ref = this.deref(func_ref).value;
          var pc : number = closure.pc;
          var closure_args : Array<Ref> = this.deref(closure.arg_vector).value;
          this.stack.stack = closure_args.concat(this.stack.stack);
          this.pc = pc;
          return;
        }
        throw new Error('Can not apply non-function reference.');
      case 'argcheck':
        // happy case. don't need to do anything.
        if (args.count === this.stack_length()) {
          return;
        }
        // we have less arguments than we need so need to generate closure
        if (args.count > this.stack_length()) {
          var vector_ref : Ref = this.vector_ref(this.stack.stack);
          this.reset();
          this.stack.push(this.closure_ref(vector_ref, this.pc - 1));
          this.ret();
        }
        break;
      case 'loadvar': // Load a variable from a specific stack and location
        this.stack.push(this.stack.get_variable(args));
        break;
      default:
        throw new Error('Unrecognized instruction.');
    }
  }

}
