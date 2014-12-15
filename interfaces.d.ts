/// <reference path="ast.ts" />
// All the interfaces.
interface LabelMap {
  [label : string] : number;
}

interface StackLocation {
  stack : number;
  stack_location : number;
}

interface HeapMap {
  [n : number] : HeapVal;
}

interface MkfuncArgument {
  label : string;
  argument_count : number;
}

interface StoreArgument {
  store_location : number;
}

interface InitVarArgument {
  var_location : number;
}

interface LoadArgument {
  constant : number;
}

interface JumpArgument {
  label : string;
}

interface PushStackArgument {
  count : number;
}

interface ExampleMap {
  [name : string] : string;
}

interface VariableMap {
  [s : string] : Symbol;
}

interface BuiltinMap {
  [symb : string] : Symbol;
}
