# Scheming with Templates: Walkthrough

There are a few components to look into:
- Handlebars and its usage (server-side template injection)
- The "standard library" implementing the toy language
- The stack on which variables are stored

Any SSTI and standard library bugs you may have found are
_not_ intended.

Review of the code where Handlebars is called should find that:
- The version of Handlebars used blocks special property access, so [this](http://mahmoudsec.blogspot.com/2019/04/handlebars-template-injection-and-rce.html)) should not be possible
- User input is coerced to a string and the `compile` method is removed
from the Handlebars runtime to prevent exploits such as [this](https://gist.github.com/tlherysr/eb085a3d697ac8ebc8bdd2817d208708)

Understanding how the standard library "helpers" implement
lazy evaluation and lambdas are by returning functions from functions.
Lambdas can be assigned to variables, since this is a
functional language.

Each function scope involves creation of a new stack frame.
Importantly, variables can have arbitrary names (i.e. there's
no filter in the `define` function to block use of special
property names). Because variables can share names with
special properties, there's also no filter in `ref`. We
can request a stack frame's constructor, and an object's
constructor's constructor (`Function`) is a great tool for
pwning Javascript.

There are two caveats:
- New stack frame objects are created using `Object.create(null)`,
so they do not have special properties like `constructor` or `__proto__`.
- _Nested_ property lookups aren't available, so getting to
the `Function` constructor isn't quite so straightforward even
if you find a stack frame with a non-null prototype.

Is there even such a stack frame? Stack frames are created in
several places:
- Lambdas (call to `EvaluationContext.push`). This uses `Object.create(null)`.
- Interpreter initialization. This passes an initial frame to
the `EvaluationContext` constructor.

The initial frame is the `constants` module. Modules are objects,
and nothing special has been done to this one. We can grab its
constructor, but still can't get the _constructor's_ constructor.
But that's okay, because the `__proto__` property is assignable.
Assign a lambda to it, and the initial frame's constructor becomes
`Function`.

Due to the way function lookups are implemented in the
overridden lookup code, that assignment makes it possible
to construct arbitrary functions using `(constructor "code")`.
Construct a function that executes a shell command or reads
`flag.txt` directly and call it to pwn the server.

## The Author's Solution

The following program sets the prototype of the initial stack frame, gets a reference to the Function constructor, then creates and runs a function to read the flag:
```scheme
(define '__proto__' (lambda (list ) 1)) (define 'fn' (ref 'constructor'))
(define 'exploit' (fn '{ return process.mainModule.require(`child_process`).execSync(`cat<flag.txt`); }'))
(exploit)
```

Full solve:
```bash
$PROG="(define '__proto__' (lambda (list ) 1)) (define 'fn' (ref 'constructor')) (define 'exploit' (fn '{ return process.mainModule.require(\`child_process\`).execSync(\`cat<flag.txt\`); }')) (exploit)"
echo $PROG | nc chal.ctf.bsidespdx.org 8090
```
