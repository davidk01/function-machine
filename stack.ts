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
