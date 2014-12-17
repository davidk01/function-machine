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
