class ASTNode { 

  refine() : ASTNode { return this; }

  symbol() : boolean { return false; }

}

class Num extends ASTNode { 

  constructor(private num : number) { super(); }

}

class Symbol extends ASTNode {

  constructor(public symb : string) { super(); }

  symbol() : boolean { return true; }

}

class List extends ASTNode {

  constructor(private list : Array<ASTNode>) { super(); }

  refine() : ASTNode {
    return null;
  }

}

class Tuple extends ASTNode {

  constructor(private elements : Array<ASTNode>) { super(); }

  refine() : ASTNode {
    return new Tuple(this.elements.map(x => x.refine()));
  }

}

class SExpr extends ASTNode {

  constructor(private expressions : Array<ASTNode>) { super(); }

  // Arguments must be a list of symbols.
  refine_argument_definitions() : Array<Symbol> {
    return this.expressions.map(x => {
      if (x.symbol()) {
        return (<Symbol>x);
      } else {
        throw new Error("Function argument definitions must be symbols.");
      }
    });
  }

  // a.k.a. normalization
  refine() : ASTNode {
    var exprs : Array<ASTNode> = this.expressions;
    var refined_head : ASTNode = exprs[0].refine();
    if (refined_head.symbol()) {
      // Dealing with a symbol so lets figure out if we need to refine it further
      switch((<Symbol>refined_head).symb) {
        case 'fun': // function definition
          return new AnonymousFunction((<SExpr>exprs[1]).refine_argument_definitions(), exprs[2].refine_definition_body());
        case 'let': // let binding
          return new LetExpressions(exprs[1].refine_let_bindings(), exprs[2].refine_let_body());
        case 'match': // pattern matching
          return new MatchExpression(exprs[1].refine_match_value(), exprs[2].refine_match_patterns());
        case 'if': // conditional
          return new IfExpression(exprs[1].refine_if_condition(), exprs[2].refine_true_branch(), exprs[3].refine_false_branch());
        default:
          throw new Error('Unknown symbol: ' + refined_head.symbol);
      }
    }
    // Otherwise it must be a function call.
    return new FunctionCall((<Symbol>refined_head), exprs.slice(1).map(x => x.refine()));
  }

}

// Non-initial nodes that only result from the refinement process.
class FunctionCall extends ASTNode {

  constructor(private name : Symbol, private args : Array<ASTNode>) { super(); }

}

class AnonymousFunction extends ASTNode {

  constructor(private args : Array<Symbol>, private body : ASTNode) { super(); }

}

