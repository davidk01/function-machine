class ASTNode { }

class Num extends ASTNode { 

  constructor(public num : number) { super(); }

}

class Symbol extends ASTNode {

  constructor(public symbol : string) { super(); }

}

class List extends ASTNode {

  constructor(public list : Array<ASTNode>) { super(); }

}
