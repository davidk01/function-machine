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

  // Builtins sit in a map indexed by an enum with a special stack number.
  get_builtin(builtin_location : number) {
    return Stack.builtins[builtin_location];
  }

  // Need stack number and stack location to reference a variable.
  get_variable(args : StackLocation) : Ref {
    if (args.stack == -1) { // Working with builtins
      return this.get_builtin(args.stack_location);
    }
    if (args.stack == this.level) {
      return this.stack[args.stack_location];
    } else if (args.stack > this.level) {
      throw new Error('Can not load from a future stack level, yet.');
    } else {
      // Level doesn't match so recurse.
      return this.up.get_variable(args);
    }
  }

  // Chain another stack on this one and also increment the level.
  increment() : Stack {
    return new Stack(this, this.level + 1);
  }

  // Push an element to the front of the stack.
  unshift(val : Ref) : void {
    this.stack.unshift(val);
  }

  // Just push a ref on the stack.
  push(val : Ref) : void {
    this.stack.push(val);
  }

  // Get a reference from the stack.
  pop() : Ref {
    return this.stack.pop();
  }

  // Throw everything away. Poor man's garbage collection.
  reset() : void {
    this.stack = [];
  }

}
