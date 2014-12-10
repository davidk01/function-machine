class Instruction { 

  static i(instruction : string, ...args : Array<any>) {
    return new Instruction(instruction, args);
  }

  constructor(private instruction : string, private args : Array<any>) { }

}
