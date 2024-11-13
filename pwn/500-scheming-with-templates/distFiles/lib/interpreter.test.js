/**
 * end-to-end tests
 */

"use strict";

const { compile, run, EvaluationContext } = require("./interpreter");

describe("atoms", () => {
  test("number", () => {
    const outputs = run("5", new EvaluationContext());
    expect(outputs.result).toEqual("5");
    expect(outputs.stdout).toEqual("");
  });

  test("string", () => {
    const program = compile('"abc123"');
    const outputs = program(new EvaluationContext());
    expect(outputs).toEqual({ result: "abc123", stdout: "" });
  });
});

describe("simple expressions", () => {
  test("add", () => {
    const program = compile("(add 1 2)");
    const outputs = program(new EvaluationContext());
    expect(outputs).toEqual({ result: "3", stdout: "" });
  });

  test("sub with println", () => {
    const program = compile("(println (sub 1 2))");
    const outputs = program(new EvaluationContext());
    expect(outputs).toEqual({ result: "", stdout: "-1\n" });
  });
});

describe("multiple expressions", () => {
  test("two", () => {
    const program = compile("(add 1 2) (sub 1 2)");
    const outputs = program(new EvaluationContext());
    expect(outputs).toEqual({ result: "-1", stdout: "" });
  });

  test("two exprs, print first", () => {
    expect(
      run("(println (add 1 2)) (sub 1 2)", new EvaluationContext()),
    ).toEqual({
      result: "-1",
      stdout: "3\n",
    });
  });

  test("two exprs, print second", () => {
    expect(
      run("(add 1 2) (println (sub 1 2))", new EvaluationContext()),
    ).toEqual({
      result: "",
      stdout: "-1\n",
    });
  });

  test("two exprs, both printed", () => {
    expect(
      run("(println (add 1 2)) (println (sub 1 2))", new EvaluationContext()),
    ).toEqual({
      result: "",
      stdout: "3\n-1\n",
    });
  });
});

describe("whitespace", () => {
  test("newline in nested s-expressions", () => {
    const script = `(println
                      (add 1 2))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "3\n",
    });
  });

  test("newline between top-level expressions", () => {
    const script = `(println (mul 1 3))
                      (println (sub 1 2))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "3\n-1\n",
    });
  });

  test("everywhere it should work", () => {
    const script = `(println\n(add      \n1\n\t2) \n )
           \t\t\t
            (println\t(sub  \n\n 1 \t\n 2    )\n  \t )`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "3\n-1\n",
    });
  });
});

describe("functional programming", () => {
  test("fold using a stdlib function", () => {
    const script = `(println
                      (fold (ref 'add') 0 (list 1 2 3)))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "6\n",
    });
  });

  test("fold using a custom function", () => {
    const script = `(define 'myAdd'
                      (lambda (list 'a' 'b')
                        (add (ref 'a') (ref 'b'))))
                    (println
                      (fold (ref 'myAdd') 0 (list 1 2 3)))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "6\n",
    });
  });

  test("fold using a lambda inline", () => {
    const script = `(println
                      (fold
                        (lambda (list 'a' 'b')
                          (add (a) (b)))
                        0
                        (list 1 2 3)))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "6\n",
    });
  });

  test("recursion", () => {
    const script = `(define 'pow'
                      (lambda (list 'n' 'exp')
                        (if (eq (ref 'exp') 0)
                          1
                          (mul (ref 'n') (pow (ref 'n') (sub (ref 'exp') 1))))))
                    (println (pow 2 3))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "8\n",
    });
  });
});
