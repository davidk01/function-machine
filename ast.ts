class ASTNode { 

  refine() : ASTNode { return this; }

}

class Num extends ASTNode { 

  constructor(public num : number) { super(); }

}

class Symbol extends ASTNode {

  constructor(public symbol : string) { super(); }

}

class List extends ASTNode {

  constructor(public list : Array<ASTNode>) { super(); }

  refine() : ASTNode {
    return null;
  }

}

class Tuple extends ASTNode {

  constructor(public elements : Array<ASTNode>) { super(); }

  refine() : ASTNode {
    return null;
  }

}

class SExpr extends ASTNode {

  constructor(public expressions : Array<ASTNode>) { super(); }

  refine() : ASTNode {
    var head : ASTNode = this.expressions[0];
    return null;
  }


}

// Non-initial nodes that only result from the refinement process.
