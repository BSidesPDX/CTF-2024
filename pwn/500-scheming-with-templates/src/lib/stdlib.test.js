const { compile, run, EvaluationContext } = require("./interpreter");

describe("add", () => {
  test("computes a sum", () => {
    expect(run("(add 1 5)", new EvaluationContext())).toEqual({
      result: "6",
      stdout: "",
    });
  });
});

describe("sub", () => {
  test("n - n = 0", () => {
    expect(run("(sub 1 1)", new EvaluationContext())).toEqual({
      result: "0",
      stdout: "",
    });
    expect(run("(sub -1 -1)", new EvaluationContext())).toEqual({
      result: "0",
      stdout: "",
    });
  });
});

describe("define", () => {
  test("creates a variable in the current scope", () => {
    const script = `(define 'x' 1)
                      (println (x))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "1\n",
    });
  });

  test("creates a function, in combination with `lambda`", () => {
    const script = `(define "add2"
                    (lambda (list "x" "y")
                      (add (x) (y))))
                  (println (add2 1 (add 4 5)))`;
    expect(run(script, new EvaluationContext())).toEqual({
      result: "",
      stdout: "10\n",
    });
  });
});
