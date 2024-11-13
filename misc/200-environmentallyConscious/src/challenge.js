const vm = require('vm')
const readline = require('readline')

const userInput = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
})


const sandboxContext = vm.createContext({
    import: undefined,
    console: console,
    env: {
        get: function(envVar){
            return process.env[envVar]
        }
    }
}, {
    codeGeneration: {
        strings: false,
        wasm: false
    }
})

// stolen from safe-eval (https://github.com/hacksparrow/safe-eval/commit/23319e33f96b59ce547c847137ad751878dcbbd4)
const superSecurePrelude = `
    (function() {
      Function = undefined;
      const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
      keys.forEach((key) => {
        const item = this[key];
        if (!item || typeof item.constructor !== 'function') return;
        this[key].constructor = undefined;
      });
    })();
`

userInput.prompt();
userInput.on('line', (userCode) => {
    // vm setup is copied from node-red
    const script = new vm.Script(superSecurePrelude + userCode, {
        filename: "SecureSandbox",
        displayErrors: true,
    })

    script.runInContext(sandboxContext, {
        timeout: 10_000
    })
    userInput.prompt()
})
