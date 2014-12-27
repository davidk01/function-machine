// All the reference kinds.
enum RefType {
  REF, BASIC, VECTOR, FUNCTION, CLOSURE
}

// Reference type.
class Ref {

  // Type and value.
  constructor(public type : RefType, public value : any) { }

  // Want a string representation for debugging.
  repr() : string {
    var ref_map : { [n : number] : string } = {};
    ref_map[RefType.REF] = 'R';
    ref_map[RefType.BASIC] = 'B';
    ref_map[RefType.VECTOR] = 'V';
    ref_map[RefType.FUNCTION] = 'F';
    ref_map[RefType.CLOSURE] = 'C';
    var repr = ref_map[this.type];
    if (repr == null || repr == undefined) {
      throw new Error('Unknown reference type.');
    }
    return ref_map[this.type] + ':' + this.value;
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
  get_ref(ref : Ref) : Ref {
    if (ref.type == RefType.REF) {
      return this.heap[ref.value];
    }
    throw new Error('Can not de-reference something that is not a reference.');
  }

  // This method always returns a REF tagged reference and the value it points to is the actual
  // tagged value.
  private ref_maker(type : RefType, value : any) : Ref {
    var current_index = this.current_index;
    var new_ref : Ref = new Ref(type, value);
    this.heap[current_index] = new_ref;
    this.current_index += 1;
    return new Ref(RefType.REF, current_index);
  }

  // Generate a function pointer.
  func_ref(pc : number) : Ref {
    return this.ref_maker(RefType.FUNCTION, pc);
  }

  // Generate a basic value pointer.
  basic_ref(val : number) : Ref {
    return this.ref_maker(RefType.BASIC, val);
  }

  // Take an array of references and just store them.
  vector_ref(stack : Array<Ref>) : Ref {
    return this.ref_maker(RefType.VECTOR, stack);
  }

  closure_ref(args : ClosureRef) : Ref {
    return this.ref_maker(RefType.CLOSURE, args);
  }

}
