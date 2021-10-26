const { loopWhile } = require("deasync")

let esmModule

console.log("hello")

import("./index.js").then(exports => esmModule = exports)
loopWhile(() => !esmModule)
module.exports = esmModule
