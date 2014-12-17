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
