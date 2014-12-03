The goal isn't to do anything tricky with syntax and grammars so we focus on just using/parsing s-expressions and then doing the required transformations starting from s-expressions. The syntax in the book is

    e ::= b | x | op e | e op e |
      (if e then e else e) | (e e ... e) |
      (fun x y ... -> e) | (let x = e in e) |
      (let rec x = e and y = e ... in e)

the equivalent s-expressions just collapse into basic forms/symbols and lists

    s-expr ::= val | sym | (sym s-expr) | (let (sym s-expr sym s-expr ...) s-expr) |
      (lambda (sym sym ...) s-expr)

I don't see any reason to split `let` into two cases (recursive/non-recursive) so will revisit this later when it becomes an issue.

When we extend things with tuples and lists for pattern matching that are only nested one level deep I think basic syntax like `<,>` for tuples and `[]` for lists should be fine.
