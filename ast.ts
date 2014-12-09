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

  refine() : List {
    throw new Error();
    return null;
  }

}

class Tuple extends ASTNode {

  constructor(private elements : Array<ASTNode>) { super(); }

  refine() : Tuple {
    return new Tuple(this.elements.map(x => x.refine()));
  }

}

class SExpr extends ASTNode {

  private head : Symbol;

  private tail : Array<ASTNode>;

  constructor(private expressions : Array<ASTNode>) { 
    super(); 
    if (expressions[0].symbol()) {
      this.head = (<Symbol>expressions[0]);
    } else {
      throw new Error("Head of SExpr must be a symbol.");
    }
    this.tail = expressions.slice(1);
  }

  // Let bindings come in pairs of (variable, value).
  refine_let_bindings() : Array<BindingPair> {
    if (this.expressions.length % 2 != 0) {
      throw new Error("Let bindings must have even length.");
    }
    var variables : Array<Symbol> = this.expressions.reduce((m, e, index, exprs) : Array<Symbol> => {
      index % 2 == 0 ? m.push(e.refine()) : false;
      return m; 
    }, []);
    var expressions : Array<ASTNode> = this.expressions.reduce((m, e, index, exprs) : Array<ASTNode> => {
      index % 2 == 1 ? m.push(e.refine()) : false;
      return m; 
    }, []);
    var accumulator : Array<BindingPair> = [];
    variables.forEach((current_var, index, vars) => accumulator.push(new BindingPair(current_var, expressions[index])));
    return accumulator;
  }

  // Need to make sure everything is a symbol.
  refine_argument_definitions() : Array<Symbol> {
    var symbols : Array<Symbol> = this.tail.map((element, index : number, elements) => {
      if (!element.symbol()) {
        throw new Error("Function arguments must be symbols.");
      }
      return (<Symbol>element);
    });
    return [this.head].concat(symbols);
  }

  // Pattern matching is its own set of problems so as in the book we only focus on very simple
  // patterns that are one level deep. Extension to more general patterns is for future enhancements.
  refine_match_patterns() : Array<PatternPair> {
    throw new Error();
  }

  // Can't return anything specific because it can be any number of things like function call, anonymous function, match
  // expression, etc.
  refine() : ASTNode {
    switch(this.head.symb) {
      case 'fun': // function definition
        return new AnonymousFunction((<SExpr>this.tail[0]).refine_argument_definitions(), new FunctionBody(this.tail[1].refine()));
      case 'let': // let binding
        return new LetExpressions((<SExpr>this.tail[0]).refine_let_bindings(), this.tail[1].refine());
      case 'match': // pattern matching
        return new MatchExpression(this.tail[0].refine(), (<SExpr>this.tail[1]).refine_match_patterns());
      case 'if': // conditional
        return new IfExpression(this.tail[0].refine(), this.tail[1].refine(), this.tail[2].refine());
      default:
        throw new Error('Unknown symbol: ' + refined_head.symbol);
    }
    // Otherwise it must be a function call.
    return new FunctionCall((<Symbol>refined_head), exprs.slice(1).map(x => x.refine()));
  }

}

// Non-initial nodes that only result from the refinement process.
class FunctionCall extends ASTNode {

  constructor(private name : Symbol, private args : Array<Symbol>) { super(); }

}

class AnonymousFunction extends ASTNode {

  constructor(private args : Array<Symbol>, private body : FunctionBody) { super(); }

}

class FunctionBody extends ASTNode {

  constructor(private exprs : ASTNode) { super(); }

}

class LetExpressions extends ASTNode {

  constructor(private bindings : Array<BindingPair>, private body : ASTNode) { super(); }

}

class BindingPair extends ASTNode {

  constructor(private variable : Symbol, private value : ASTNode) { super(); }

}

class MatchExpression extends ASTNode {

  constructor(private value : ASTNode, private patterns : Array<MatchPattern>) { super(); }

}
