"use strict";

const loadStdLib = require("./stdlib");
const Handlebars = require("handlebars");
const HandlebarsRuntime = require("handlebars/runtime");

class EvaluationContext {
  constructor(initialFrame = undefined) {
    this.stack = [];

    if (typeof initialFrame !== "object" || initialFrame == null) {
      this.stack.push(Object.create(null));
    } else {
      this.stack.push(initialFrame);
    }
  }

  lookup(key) {
    // prettier-ignore
    for (let i = this.stack.length; i-->0; ) {
      const frame = this.stack[i];
      if (frame[key] !== undefined) return frame[key];
    }
    return undefined;
  }

  lookupTop(key) {
    return this.stack[this.stack.length - 1][key];
  }

  push(frame) {
    this.stack.push(frame ?? Object.create(null));
    return this;
  }

  pop() {
    this.stack.pop();
    return this;
  }

  store(key, value) {
    this.stack[this.stack.length - 1][key] = value;
  }

  get top() {
    return this.stack[this.stack.length - 1];
  }
}

function compile(script) {
  const precompiledScript = Handlebars.precompile(
    `{{runProgram (begin ${script})}}`,
  );
  const compiledScript = eval(`(${precompiledScript})`);

  function runScript(context) {
    const runtime = createRuntime(context);

    const program = runtime.template(compiledScript);
    const result = program({});

    return {
      result: result,
      stdout: runtime.globals.__stdout__.join(""),
    };
  }

  return runScript;
}

function run(script, context = new EvaluationContext()) {
  const program = compile(script);
  return program(context);
}

function createRuntime(context) {
  const runtime = HandlebarsRuntime.create();

  delete runtime.compile;
  runtime.globals = {};
  Object.assign(runtime.globals, {
    __stdout__: [],
    __ctx__: context,
  });

  runtime.registerHelper("runProgram", (...args) => {
    args.pop(); // options
    return args.map((f) => f()).pop();
  });
  loadStdLib(runtime);

  return runtime;
}

module.exports = {
  compile: compile,
  run: run,
  EvaluationContext: EvaluationContext,
};
