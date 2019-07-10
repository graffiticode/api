let nodePool;
let nodeMap;

function intern(n) {
  if (!n) {
    return 0;
  }
  var tag = n.tag;
  var elts = "";
  var elts_nids = [ ];
  var count = n.elts.length;
  for (var i = 0; i < count; i++) {
    if (typeof n.elts[i] === "object") {
      n.elts[i] = intern(n.elts[i]);
    }
    elts += n.elts[i];
  }
  var key = tag + count + elts;
  var nid = nodeMap[key];
  if (nid === void 0) {
    nodePool.push({tag: tag, elts: n.elts});
    nid = nodePool.length - 1;
    nodeMap[key] = nid;
    if (n.coord) {
      ctx.state.coords[nid] = n.coord;
    }
  }
  return nid;
}

function newNode(tag, elts) {
  return {
    tag: tag,
    elts: elts,
  }
};

const NULL = "NULL";
const STR = "STR";
const NUM = "NUM";
const BOOL = "BOOL";
const LIST = "LIST";
const RECORD = "RECORD";
const BINDING = "BINDING";

function objectChildToCode(data) {
  let type = typeof data;
  let tag =
    data === null && NULL ||
    type === "string" && STR ||
    type === "number" && NUM ||
    type === "boolean" && BOOL ||
    Array.isArray(data) && LIST ||
    type === "object" && RECORD;
  let elts = [];
  if (tag === LIST) {
    Object.keys(data).forEach(k => {
      elts.push(intern(objectChildToCode(data[k])));
    })
  } else if (tag == RECORD) {
    Object.keys(data).forEach(k => {
      elts.push(newNode(BINDING, [
        intern(newNode(STR, [k])),
        intern(objectChildToCode(data[k]))
      ]));
    });
  } else {
    elts.push(data);
  }
  let node = newNode(tag, elts);
  return node;
}

function objectToCode(data) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  nodePool = ["unused"];
  nodeMap = {};
  intern(objectChildToCode(data));
  return poolToObject();
}

function poolToObject() {
  let obj = {};
  for (let i=1; i < nodePool.length; i++) {
    let n = nodePool[i];
    obj[i] = nodeToObject(n);
  }
  obj.root = nodePool.length - 1;
  return obj;
}

function nodeToObject(n) {
  let obj;
  if (typeof n === "object") {
    switch (n.tag) {
    case "num":
      obj = n.elts[0];
      break;
    case "str":
      obj = n.elts[0];
      break;
    default:
      obj = {};
      obj["tag"] = n.tag;
      obj["elts"] = [];
      for (var i=0; i < n.elts.length; i++) {
        obj["elts"][i] = nodeToObject(n.elts[i]);
      }
      break;
    }
  } else if (typeof n === "string") {
    obj = n;
  } else {
    obj = n;
  }
  return obj;
}

