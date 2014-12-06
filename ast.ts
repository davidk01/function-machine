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

class Tuple extends ASTNode {

  constructor(public elements : Array<ASTNode>) { super(); }

}

class SExpr extends ASTNode {

  constructor(public expressions : Array<ASTNode>) { super(); }

}
