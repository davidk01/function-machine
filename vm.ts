/// <reference path="interfaces.d.ts" />

// Builtin functions
enum Builtins {
  PLUS
}

interface InstructionArgs { }

class Instruction { 

  private static is_null(obj : any) : boolean {
    return obj == null || obj == undefined;
  }

  // Load a variable from the stack location specified by stack number. We figure this stuff out
  // statically during typechecking/AST annotation phase.
  static LOADVAR(args : StackLocation) {
    if (this.is_null(args.stack && args.stack_location)) {
      throw new Error('Must provide stack and stack location.');
    }
    return new Instruction('loadvar', args);
  }

  // Checks the stack argument count to make sure the function can be applied.
  // In case there aren't enough arguments we need to return a closure.
  static ARGCHECK(args : ArgCheckArgument) {
    return new Instruction('argcheck', args);
  }

  // Return instruction.
  static RETURN() {
    return new Instruction('return', null);
  }

  // Push 'n' number of variables onto a new stack.
  static PUSHSTACK(args : PushStackArgument) {
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
  static JUMPZ(args : JumpArgument) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction('jumpz', args);
  }

  // Unconditional jump.
  static JUMP(args : JumpArgument) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide jump label.');
    }
    return new Instruction('jump', args);
  }

  // Load a constant.
  static LOAD(constant : LoadArgument) {
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
  static INITVAR(args : InitVarArgument) {
    if (this.is_null(args.var_location)) {
      throw new Error('Must provide location for variable initialization.');
    }
    return new Instruction('initvar', args);
  }

  // Store whatever is on top of the stack at the given location on the stack.
  static STOREA(args : StoreArgument) {
    if (this.is_null(args.store_location)) {
      throw new Error('Must provide store location.');
    }
    return new Instruction('storea', args);
  }

  // Label for jumps.
  static LABEL(args : JumpArgument) {
    if (this.is_null(args.label)) {
      throw new Error('Must provide label.');
    }
    return new Instruction('label', args);
  }

  static MKFUNC(args : MkfuncArgument) {
    if (this.is_null(args.label && args.argument_count)) {
      throw new Error('Missing parameters for MKFUNC.');
    }
    return new Instruction('mkfunc', args);
  }

  constructor(public instruction : string, public args : InstructionArgs) { }

}

// Heap reference types.
enum RefType {
  BASIC, VECTOR, BUILTIN, FUNCTION, CLOSURE
}

interface HeapRefValue { }

// An actual heap reference.
class HeapRef {

  constructor(public type : RefType, public value : HeapRefValue) { }

  repr() : string {
    var val = typeof this.value == "function" ? "func" : this.value;
    return "Ref@" + val;
  }

}

interface HeapValValue { }

// Heap references point to heap values.
class HeapVal {

  constructor(public type : RefType, public value : any) { }

  repr() : string {
    var t : string;
    switch(this.type) {
      case RefType.BASIC:
        t = "b";
        break;
      case RefType.VECTOR:
        t = "v";
        break;
      case RefType.BUILTIN:
        t = "bi";
        break;
      case RefType.FUNCTION:
        t = "f";
        break;
      case RefType.CLOSURE:
        t = "c";
        break;
    }
    return t + ':' + this.value;
  }

}

// Just a map from integers to heap references.
class Heap {

  private heap : HeapMap;

  private current_index : number;

  constructor() {
    this.current_index = 0;
    this.heap = {};
  }

  repr() : string {
    var accumulator : string = "";
    for (var i = 0; i < this.current_index; i++) {
      accumulator += (this.heap[i].repr() + "@" + i + "\n");
    }
    return accumulator;
  }

  // Dereference a heap reference.
  get_ref(ref : StackValue) : HeapVal {
    return this.heap[ref.address];
  }

  // One place to do the index incrementing and assignment.
  private ref_maker(type : RefType, value : HeapVal) {
    var new_ref : HeapRef = new HeapRef(type, this.current_index);
    this.heap[this.current_index] = value;
    this.current_index += 1;
    return new_ref;
  }

  // Generate a function pointer.
  func_ref(pc : number) : HeapRef {
    return this.ref_maker(RefType.FUNCTION, new HeapVal(RefType.FUNCTION, pc));
  }

  // Generate a basic value pointer.
  basic_ref(val : number) : HeapRef {
    return this.ref_maker(RefType.BASIC, new HeapVal(RefType.BASIC, val));
  }

  // Take an array of references and just store them.
  vector_ref(stack : Array<HeapRef>) : HeapRef {
    return this.ref_maker(RefType.VECTOR, new HeapVal(RefType.VECTOR, stack));
  }

  closure_ref(args : ClosureRef) : HeapRef {
    return this.ref_maker(RefType.CLOSURE, new HeapVal(RefType.CLOSURE, args));
  }

}

// Populate the builtin map so that LOADVAR instructions can load them.
function generate_builtins() {
  var builtins : HeapMap = {};
  // PLUS
  var plus = function(vm : VM) : void {
    var arg1_ref : StackValue = vm.stack.pop();
    if (!(arg1_ref.type == RefType.BASIC)) {
      throw new Error('First argument type must be basic.');
    }
    var arg2_ref : StackValue = vm.stack.pop();
    if (!(arg1_ref.type == RefType.BASIC)) {
      throw new Error('Second argument type must be basic.');
    }
    var arg1 : HeapVal = vm.deref(arg1_ref);
    var arg2 : HeapVal = vm.deref(arg2_ref);
    var sum_ref : HeapRef = vm.heap.basic_ref(arg1.value + arg2.value);
    vm.stack.push(sum_ref);
    return vm.ret();
  }
  builtins[Builtins.PLUS] = new HeapRef(RefType.BUILTIN, plus);
  return builtins;
}

interface StackValue { 
  type: RefType;
  address: number;
}

// Stack, wraps an array and exposes some basic operations.
class Stack {

  static builtins : HeapMap = generate_builtins();

  // Holds the actual stack contents for this level.
  stack : Array<any>;

  constructor(public up : Stack, private level : number) { 
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

  get_variable(args : StackLocation) : StackValue {
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

  unshift(val : StackValue) : void {
    this.stack.unshift(val);
  }

  // Just push a constant on the stack. Constants for now are just ints.
  push(val : StackValue) : void {
    this.stack.push(val);
  }

  pop() : StackValue {
    return this.stack.pop();
  }

  reset() : void {
    this.stack = [];
  }

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

  // Push top of stack onto previous stack, reset stack, and pc.
  ret() : void {
    var return_value : StackValue = this.stack.pop();
    this.stack = this.stack.up;
    this.stack.push(return_value);
    this.pc = this.returns.pop();
  }

  // Dereference whatever is passed in.
  deref(ref : StackValue) : HeapVal {
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
      if (instruction.instruction == 'label' &&
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

  basic_ref(val : number) : HeapRef {
    return this.heap.basic_ref(val);
  }

  func_ref(pc : number) : HeapRef {
    return this.heap.func_ref(pc);
  }

  stack_length() : number {
    return this.stack.stack.length;
  }

  vector_ref(vals : Array<HeapRef>) : HeapRef {
    return this.heap.vector_ref(vals);
  }

  closure_ref(arg_vector : HeapRef, pc : number) : HeapRef {
    return this.heap.closure_ref({arg_vector: arg_vector, pc: pc});
  }

  reset() : void {
    this.stack.reset();
  }

  // Execute the instruction.
  execute() : void {
    var args : InstructionArgs = this.ir.args;
    switch(this.ir.instruction) {
      case 'load': // Just loads a constant
        console.log('LOAD: ', args.constant);
        this.stack.push(args.constant);
        break;
      case 'mkbasic': // Make a basic variable reference, ints for the time being
        console.log('MKBASIC');
        var basic : number = (<number>this.stack.pop());
        var basic_ref : HeapRef = this.basic_ref(basic);
        this.stack.push(basic_ref);
        break;
      case 'initvar': // Initialize a variable on the stack at a specific location
        console.log('INITVAR');
        throw new Error();
        break;
      case 'storea': // Store the top of the stack at the specified address
        console.log('STOREA');
        throw new Error();
        break;
      case 'label': // noop, just used for resolving jump addresses
        console.log('LABEL');
        break;
      case 'mkfunc': // Make a function object and push the reference onto the stack
        console.log('MKFUNC');
        var func_ref : HeapRef = this.func_ref(this.pc);
        this.stack.push(func_ref);
        this.pc = this.resolve_label(args.label);
        break;
      case 'jumpz': // Jump if top of stack is zero
        console.log('JUMPZ');
        throw new Error();
        break;
      case 'jump': // Unconditional jump
        console.log('JUMP');
        throw new Error();
        break;
      case 'pushstack': // Push specified number of values onto new stack and preserve the order
        console.log('PUSHSTACK: ', args.count);
        var new_stack : Stack = this.stack.increment();
        for (var i = 0; i < args.count; i++) {
          new_stack.unshift(this.stack.pop());
        }
        this.stack = new_stack;
        break;
      case 'return':
        console.log('RETURN: ', this.returns[this.returns.length - 1]);
        this.ret();
        break;
      case 'apply': // Apply the function reference on top of stack
        console.log('APPLY');
        this.returns.push(this.pc);
        var func_ref : HeapRef = this.stack.pop();
        if (func_ref.type == RefType.BUILTIN) {
          func_ref.value(this);
          return;
        } else if (func_ref.type == RefType.FUNCTION) {
          var destination : number = this.deref(func_ref).value;
          this.pc = destination;
          return;
        } else if (func_ref.type == RefType.CLOSURE) {
          var closure : ClosureRef = this.deref(func_ref).value;
          var pc : number = closure.pc;
          var closure_args : Array<HeapRef> = this.deref(closure.arg_vector).value;
          this.stack.stack = closure_args.concat(this.stack.stack);
          this.pc = pc;
          return;
        }
        throw new Error('Can not apply non-function reference.');
      case 'argcheck':
        console.log('ARGCHECK: ', args.count);
        // happy case. don't need to do anything.
        if (args.count === this.stack_length()) {
          return;
        }
        // we have less arguments than we need so need to generate closure
        if (args.count > this.stack_length()) {
          var vector_ref : HeapRef = this.vector_ref(this.stack.stack);
          this.reset();
          this.stack.push(this.closure_ref(vector_ref, this.pc - 1));
          this.ret();
        }
        break;
      case 'loadvar': // Load a variable from a specific stack and location
        console.log('LOADVAR: ', args.stack, args.stack_location);
        this.stack.push(this.stack.get_variable(args));
        break;
      default:
        throw new Error('Unrecognized instruction.');
    }
  }

}
