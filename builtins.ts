function generate_builtins() {
  var builtins : HeapMap = {};
  // PLUS
  var plus = function(vm : VM) : void {
    var arg1_ref : Ref = vm.deref(vm.stack.pop());
    if (!(arg1_ref.type == RefType.BASIC)) {
      throw new Error('First argument type must be basic.');
    }
    var arg2_ref : Ref = vm.deref(vm.stack.pop());
    if (!(arg2_ref.type == RefType.BASIC)) {
      throw new Error('Second argument type must be basic.');
    }
    var sum_ref : Ref = vm.heap.basic_ref(arg1_ref.value + arg2_ref.value);
    vm.stack.push(sum_ref);
    return vm.ret();
  }
  builtins['+'] = new Ref(RefType.BUILTIN, plus);
  // builtins[Builtins.PLUS] = new HeapRef(RefType.BUILTIN, plus);
  return builtins;
}
