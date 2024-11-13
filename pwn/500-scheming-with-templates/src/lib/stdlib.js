/*
 * handycalc standard library
 */
"use strict";

function loadStdLib(handlebars) {
  const hbs = handlebars;
  const g = hbs.globals;

  /* core functions */

  /**
   * (begin expr1 expr2 ...)
   * Evaluate expressions in sequence.
   */
  function begin(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let resultsArray = [];
      for (let elem of argsArray) {
        resultsArray.push(evaluate(elem));
      }

      return resultsArray.pop();
    };
  }

  /**
   * (define [name] [value])
   * name must resolve to a string because that's the easiest
   * way to work around Handlebars' eager evaluation/lookups
   */
  function define(...args) {
    const _options = args.pop();
    const name = evaluate(args.shift());
    const value = args.shift();

    return () => {
      g.__ctx__.store(name, evaluate(value));
    };
  }

  /**
   * (if [bool] [expr] [else-expr])
   * This overrides the built-in `if` helper so that we don't
   * have to deal with those pesky blocks anymore.
   */
  function $if(...args) {
    const _options = args.pop();
    const predicate = args.shift();
    const trueBranch = args.shift();
    const elseBranch = args.shift();

    return () => {
      if (evaluate(predicate)) {
        return evaluate(trueBranch);
      }
      return evaluate(elseBranch);
    };
  }

  /**
   * (lambda [argspec] [exprs])
   * where argspec is a list of strings, ex. (list 'a1' 'a2')
   * and kwargs are defined using Handlebars-native key=val
   * syntax
   */
  function lambda(...args) {
    const _options = args.pop();
    // if you want this to work properly, pass a list of
    // strings as the first argument to `lambda`
    const lambdaBody = Array.from(args);
    const argSpec = evaluate(args.shift());

    return () => {
      return (...args) => {
        g.__ctx__.push();

        for (let argName of argSpec) {
          const result = evaluate(args.shift());
          g.__ctx__.store(argName, result);
        }

        // clone so subsequent calls behave consistently
        const exprs = Array.from(lambdaBody);

        const lastExpr = exprs.pop();
        for (let expr of exprs) {
          evaluate(expr);
        }
        const result = evaluate(lastExpr);

        g.__ctx__.pop();
        return result;
      };
    };
  }

  /**
   * (ref 'name')
   * workaround for the fact that it's kinda hard to override
   * Handlebars' eager variable lookups to make them lazy
   *
   * (name) works unless you want to reference a function
   * without calling it, in which case you need (ref 'someFn')
   */
  function ref(...args) {
    const _options = args.pop();
    const name = args.shift();
    return () => {
      const val = g.__ctx__.lookup(name);

      if (val === undefined) {
        return (...args) => {
          const argsArray = Array.from(args);
          argsArray.push({ name: name });
          return hbs.helpers[name](...argsArray)();
        };
      }

      return val;
    };
  }

  /* boolean logic */

  function and(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let result = true;
      for (let arg of argsArray) {
        result = result && evaluate(arg);
        // short-circuit
        if (!result) return false;
      }
      return true;
    };
  }

  function not(...args) {
    const _options = args.pop();
    const arg = args.shift();

    return () => !evaluate(arg);
  }

  function or(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let result = false;
      for (let arg of argsArray) {
        result = result || evaluate(arg);
        // short-circuit
        if (result) return true;
      }
      return false;
    };
  }

  /* comparison functions */

  function eq(...args) {
    const _options = args.pop();
    const left = args.shift();
    const right = args.shift();

    return () => {
      return evaluate(left) === evaluate(right);
    };
  }

  function lt(...args) {
    const _options = args.pop();
    const left = args.shift();
    const right = args.shift();

    return () => {
      return evaluate(left) < evaluate(right);
    };
  }

  function gt(...args) {
    const _options = args.pop();
    const left = args.shift();
    const right = args.shift();

    return () => {
      return evaluate(left) > evaluate(right);
    };
  }

  function leq(...args) {
    const _options = args.pop();
    const left = args.shift();
    const right = args.shift();

    return () => {
      return evaluate(left) <= evaluate(right);
    };
  }

  function geq(...args) {
    const _options = args.pop();
    const left = args.shift();
    const right = args.shift();

    return () => {
      return evaluate(left) >= evaluate(right);
    };
  }

  /* lists */

  /**
   * (list a b c ...)
   * Create a new list. Lists are JS arrays internally,
   * but indexing is not supported because recursion is
   * more fun.
   */
  function list(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      return argsArray.map((f) => evaluate(f));
    };
  }

  /**
   * (fold [fn] [init] [list])
   */
  function fold(...args) {
    const options = args.pop();
    const argsArray = Array.from(args);
    const passOpts = options.passOpts ?? false;

    return () => {
      const fn = evaluate(argsArray.shift());
      let acc = evaluate(argsArray.shift());

      for (let elem of evaluate(argsArray.shift())) {
        if (passOpts) {
          acc = fn(acc, evaluate(elem), options);
        } else {
          acc = fn(acc, evaluate(elem));
        }
      }

      return acc;
    };
  }

  /**
   * (map [fn] [list])
   */
  function map(...args) {
    const options = args.pop();
    const argsArray = Array.from(args);
    const passOpts = options.passOpts ?? false;

    return () => {
      const fn = evaluate(argsArray.shift());
      const arr = evaluate(argsArray.shift());

      return arr.map((elem) => {
        if (passOpts) {
          return fn.call(this, evaluate(elem), options);
        } else {
          return fn.call(this, evaluate(elem));
        }
      });
    };
  }

  /* arithmetic functions */

  function add(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let sum = 0;
      for (let n of argsArray) {
        sum += evaluate(n);
      }

      return sum;
    };
  }

  function sub(...args) {
    const _options = args.pop();
    const first = args.shift();
    const rest = Array.from(args);

    return () => {
      let dif = evaluate(first);
      for (let n of rest) {
        const val = evaluate(n);
        dif -= val;
      }

      return dif;
    };
  }

  function mul(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let product = 1;
      for (let n of argsArray) {
        product = product * evaluate(n);
      }

      return product;
    };
  }

  function div(...args) {
    const _options = args.pop();
    const first = args.shift();
    const rest = Array.from(args);

    return () => {
      let result = evaluate(first);
      for (let n of rest) {
        result = result / evaluate(n);
      }

      return result;
    };
  }

  /* I/O */

  /**
   * debug printing
   */
  function dbg(...args) {
    const _options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      let evaluated = argsArray.map(evaluate);
      console.log("DBG: ", evaluated);
      for (let expr of evaluated) {
        console.log(expr.toString());
      }
    };
  }

  /**
   * Print a line to "standard output", which is currently just
   * a big string.
   */
  function println(...args) {
    const options = args.pop();
    const sep = options.hash.sep ?? " ";
    const argsArray = Array.from(args);

    return () => {
      const output = argsArray.map(evaluate).join(sep);
      console.log(output);
      g.__stdout__.push(output + "\n");
    };
  }

  /* hooks to load in the Handlebars runtime */

  /**
   * Override for the default helperMissing hook to provide
   * proper lookups for variables and user-defined functions
   */
  function helperMissing(...args) {
    const options = args.pop();
    const argsArray = Array.from(args);

    return () => {
      const fn = g.__ctx__.lookup(options.name);
      return evaluate(fn, ...argsArray);
    };
  }

  /**
   * Override for the default blockHelperMissing hook
   * to turn missing block helpers into no-ops. We don't
   * need block helpers anyway, so this is mostly just
   * for hygiene.
   */
  function blockHelperMissing(...args) {
    return undefined;
  }

  /* internal helper functions, not loaded as helpers */

  /**
   * Force evaluation of closures.
   * @param {any} valOrFunc
   * @param  {...any} args
   * @returns {any}
   */
  function evaluate(valOrFunc, ...args) {
    if (typeof valOrFunc === "function") {
      return valOrFunc(...args);
    }
    return valOrFunc;
  }

  const helpers = {
    // base
    begin: begin,
    define: define,
    if: $if,
    lambda: lambda,
    ref: ref,
    // boolean
    and: and,
    not: not,
    or: or,
    // comparisons
    eq: eq,
    lt: lt,
    gt: gt,
    leq: leq,
    geq: geq,
    // list
    list: list,
    fold: fold,
    map: map,
    // maths
    add: add,
    sub: sub,
    mul: mul,
    div: div,
    // I/O
    dbg: dbg,
    println: println,
    // hooks
    helperMissing: helperMissing,
    blockHelperMissing: blockHelperMissing,
  };

  for (let name in helpers) {
    hbs.registerHelper(name, helpers[name]);
  }
}

module.exports = loadStdLib;
