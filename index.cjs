const { loopWhile } = require("deasync")

let esmModule

import("./index.js").then(exports => esmModule = exports)
loopWhile(() => !esmModule)
module.exports = esmModule
