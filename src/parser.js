var parser = require('../public/parse');

var nodePool
var nodeStack

// commonjs export
var parse = exports.parse = function(src, lexicon, resume) {
  var stream = new parser.StringStream(src);
  var state = {
    cc: window.gcexports.parser.program,   // top level parsing function
    argc: 0,
    argcStack: [0],
    paramc: 0,
    paramcStack: [0],
    env: [ {name: "global", lexicon: lexicon } ],
    exprc: 0,
    exprcStack: [0],
    nodeStack: [],
    nodeStackStack: [],
    nodePool: ["unused"],
    nodeMap: {},
    nextToken: -1,
    errors: [],
    coords: [],
    inStr: 0,
    quoteCharStack: [],
  };
  var next = function () {
    return parser.parse(stream, state, resume);
  }
  while (state.cc != null && stream.peek()) {
    next()
    nodePool = state.nodePool
    nodeStack = state.nodeStack
  }
  return nodePool;
}

if (!module.parent) {
  process.argv.forEach(function (val, index, array) {
    if (index < 2) return
    
    fs = require('fs')
    fs.readFile(val, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
        return;
      }
      console.log("parsing: " + data);
      var t0 = new Date;
      parse(data, {}, function (err, ast) {
        console.log("ast=" + JSON.stringify(ast, null, 2));
      });
    });
  });
}
