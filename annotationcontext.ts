class VariableMap {

  constructor(private vars : { [str : string] : Symbol }) { }

  get(variable : string) : Symbol {
    return this.vars[variable];
  }

  set(variable : string, node : Symbol) {
    this.vars[variable] = node;
  }

}

class AnnotationContext {

  // Location of the latest variable declaration.
  private latest_location : number;

  // We generate unique labels using this number.
  private label_number : number;

  // Keep track of variables in the current scope.
  private variables : VariableMap;

  // Keeps track of stack increments during function calls.
  private stack_number : number;

  // Keep track of the parent context to mirror the scoping rules of the language.
  constructor(private up : AnnotationContext) {
    this.variables = new VariableMap({});
    this.label_number = (this.up && this.up.get_label_number()) || -1;
    this.latest_location = (this.up && this.up.get_latest_location()) || 0;
    this.stack_number = (this.up && this.up.get_stack_number()) || 0;
  }

  has_variable(variable : Symbol) : boolean {
    return !!this.get_variable(variable);
  }

  get_variable(variable : Symbol) : Symbol {
    return this.variables.get(variable.symb) || (this.up && this.up.get_variable(variable));
  }

  get_label_number() : number {
    return this.label_number;
  }

  // Tack on another context whenver we introduce new scope.
  increment() : AnnotationContext {
    return new AnnotationContext(this);
  }

  add_variable(name : string, node : Symbol) : void {
    this.latest_location += 1;
    this.variables.set(name, node);
  }

  get_latest_location() : number {
    return this.latest_location;
  }

  get_stack_number() : number {
    return this.stack_number;
  }

  // The ordering of things is again important because of the various side-effects of incrementing stack and
  // location numbers.
  increment_stack_number() : void {
    this.stack_number += 1;
    this.latest_location = 0;
  }

  // Increment the label counter and give us another unique label.
  get_label() : string {
    this.label_number += 1;
    return 'label' + this.label_number;
  }

}
