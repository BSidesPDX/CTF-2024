const hbs = require("handlebars");
const readline = require("readline/promises");
const interpreter = require("./lib/interpreter");
const constants = require("./lib/constants");

const userInput = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const helpMessage = `Usage:
,q    : quit
,help : help
Write code & press <Enter> to run it!

Code syntax: Scheme-like, except you'll need to use
(ref "varName") to reference variables.

Example code:
(define 'myAdd'
  (lambda (list 'a' 'b')
    (add (ref 'a') (ref 'b'))))
(println
  (fold (ref 'myAdd') 0 (list 1 2 3)))`;

async function interact() {
  let done = false;
  const context = new interpreter.EvaluationContext(constants);

  while (!done) {
    const script = await userInput.question("> ");
    switch (script) {
      case ",help":
        console.log(helpMessage);
        break;
      case ",q":
        done = true;
        break;
      default:
        console.log(interpreter.run(script, context));
    }
  }
}

console.log(`Welcome to not-quite-a-Scheme!
,q to quit
,help for help`);

interact().then(() => userInput.close());
