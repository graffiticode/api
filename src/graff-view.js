import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  assert,
  message,
  messages,
  reserveCodeRange,
  decodeID,
  encodeID,
} from "./share.js"
window.gcexports.ReactDOM = ReactDOM;
window.gcexports.decodeID = decodeID;
window.gcexports.encodeID = encodeID;
let dispatch = (obj => {
  window.gcexports.dispatcher.dispatch(obj);
});
window.gcexports.compileSrc = (lang, src, resume) => {
  $.ajax({
    type: "PUT",
    url: "/compile",
    data: {
      "language": lang,
      "src": src,
      "jwt": localStorage.getItem("accessToken"),
      "userID": localStorage.getItem("userID"),
    },
    dataType: "json",
    success: function(data) {
      resume(null, data);
    },
    error: function(xhr, msg, err) {
      console.log("ERROR " + msg + " " + err);
    }
  });
};
var GraffContent = React.createClass({
  componentWillUnmount: function() {
  },
  lastItemID: undefined,
  pendingRequests: 0,
  compileCode: function(itemID) {
    let langID, codeID, dataID;
    let ids = decodeID(itemID);
    langID = ids[0];
    codeID = ids[1];
    dataID = ids.slice(2);
    let self = this;
    let lang = window.gcexports.language;
    let state = this.state && this.state[itemID] ? this.state[itemID] : {};
    let params = "";
    let refresh = state.refresh;
    if (refresh) {
      params += "&refresh=true";
      state.refresh = false;
    }
    if (codeID && itemID && (refresh || itemID !== this.lastItemID)) {
      self.lastItemID = itemID;
      self.pendingRequests++;
      try {
      d3.json(location.origin + "/data/?id=" + itemID + params, (err, obj) => {
        self.pendingRequests--;
        // if (dataID && +dataID !== 0) {
        //   // This is the magic where we collapse the "tail" into a JSON object.
        //   // Next this JSON object gets interned as static data (in L113).
        //   console.log(decodeID(window.gcexports.id).join("+") + " --> " + dataID);
        //   d3.json(location.origin + "/data/?id=" + encodeID(dataID) + params, (err, data) => {
        //     let state = {};
        //     state[lang] = {
        //       id: itemID,
        //       obj: obj,
        //       data: data,
        //     };
        //     dispatch(state);
        //   });
        // } else {
        //   let state = {};
        //   state[lang] = {
        //     id: itemID,
        //     obj: obj,
        //     data: {},  // clear data
        //   };
        //   dispatch(state);
        // }
        let state = {};
        state[itemID] = {
          id: itemID,
          obj: obj,
          data: {},  // clear data
        };
        if (refresh || self.pendingRequests === 0) {
          self.pendingRequest = 0;
          dispatch(state);
        }
      });
      } catch (x) {
        console.log("x=" + x.stack);
      }
    }
  },
  componentDidMount: function() {
    let gcexports = window.gcexports;
    GraffView.dispatchToken = gcexports.dispatcher.register(this.onChange);
    let itemID = gcexports.id;
    if (!itemID) {
      // Wait for valid id.
      return;
    }
    this.compileCode(itemID);
    let language = gcexports.language;
    let history = {
      language: language,
      view: gcexports.view,
      itemID: itemID,
    };
    window.history.replaceState(history, language, "/" + gcexports.view + "?id=" + itemID);
    window.gcexports.compileCode = this.compileCode;
  },
  componentDidUpdate: function() {
    let gcexports = window.gcexports;
    let el = ReactDOM.findDOMNode(this);
    let lang = gcexports.language;
    let itemID = gcexports.id;
    if (this.state[itemID] /*&& this.state[itemID].id*/ && !this.state[itemID].errors) {
      let state = this.state[itemID];
      //assert(state.id === itemID);
      let ast = state.ast;
      let src = state.src;
      let obj = state.obj;
      let data = state.data;
      let label = state.label;
      let viewer = window.gcexports.viewer;
      let parentID = state.parentID;
      if (viewer && !viewer.Viewer && obj) {
        // Legacy code path
        viewer.update(el, obj, src, ast);
      }
      if (data && Object.keys(data).length) {
        this.postData(itemID, data, label, parentID);
      } else if (gcexports.decodeID(itemID)[2] !== 0 || state.refresh) {
        // Got an itemID with data that is not in memory.
        this.compileCode(itemID);
      }
      gcexports.doneLoading = true;
    }
    if (gcexports.view === "item") {
      let ids = gcexports.decodeID(itemID);
      let codeIDs = ids.slice(0, 2);
      let dataIDs = ids.slice(2);
      console.log("/" + gcexports.view + "?id=" + codeIDs.concat(gcexports.encodeID(dataIDs)).join("+"));
    }
  },
  postData: function postData(itemID, obj, label, parentID) {
    // Save the data and recompile code with data if the viewer requests it by
    // setting recompileCode=true. See L121 for an example.
    if (obj && Object.keys(obj).length > 0) {
      let gcexports = window.gcexports;
      let user = $("#username").data("user");
      let lang = gcexports.language;
      let state = this.state[itemID];
      let updateHistory = state.updateHistory;
      let self = this;
      // Append host language to label.
      label = label ? lang + " " + label : lang;
      self.pendingRequests++;
      $.ajax({
        type: "PUT",
        url: "/code",
        data: {
          src: JSON.stringify(obj) + "..",  // JSON is valid source.
          ast: "",
          obj: JSON.stringify(obj),
          img: "",
          user: user ? user.id : 1,
          parent: parentID,
          language: "L113",
          label: label + " data",
        },
        dataType: "json",
        success: function(data) {
          self.pendingRequests--;
          if (itemID) {
            // Wait until we have an itemID to update URL.
            let ids = decodeID(itemID);
            let lastDataID = encodeID(ids.slice(2));
            let dataID = data.id;
            ids = ids.slice(0, 2).concat(decodeID(dataID));
            itemID = encodeID(ids);
            if (dataID !== lastDataID && state.recompileCode) {
              self.compileCode(itemID);
            }
            if (state.dontUpdateID !== true) {
              gcexports.id = itemID;
              let history = {
                language: lang,
                view: gcexports.view,
                itemID: itemID,
              };
              if (updateHistory) {
                window.history.pushState(history, lang, "/" + gcexports.view + "?id=" + itemID);
              } else {
                window.history.replaceState(history, lang, "/" + gcexports.view + "?id=" + itemID);
              }
            }
          }
        },
        error: function(xhr, msg, err) {
          console.log("Unable to submit code. Probably due to a SQL syntax error");
        }
      });
    }
  },
  onChange: function (data) {
    // Every dispatch comes through here.
    if (!window.gcexports) {
      // Not ready yet.
      return;
    }
    let itemID = window.gcexports.id;
    if (this.state === null) {
      let state = data;
      let ids = decodeID(itemID);
      let codeID = encodeID(ids.slice(0, 2).concat(0));
      if (!state[codeID] && data[itemID]) {
        state[codeID] = {
          id: codeID,
          obj: data[itemID].obj,
        };
      }
      this.setState(state);
    } else {
      // Copy state for the current item.
      let state = {};
      let ids = decodeID(itemID);
      let codeID = encodeID(ids.slice(0, 2).concat(0));
      let item = data[itemID];
      if (item && !item.obj) {
        // If item doesn't have an obj, then get it from the previous compile of this itemID or codeID.
        item.obj = 
          this.state[itemID] && this.state[itemID].obj ||
          this.state[codeID] && this.state[codeID].obj ||
          this.compileCode(itemID);
        item.id = itemID;
      } else if (this.state[codeID] && !this.state[codeID].obj) {
        // Don't have the base obj set yet.
        state[codeID] = {
          id: codeID,
          obj: this.state[codeID].obj,
        };
      }
      if (item) {
        if (this.state.postCode) {
          // New code so clear (don't copy) old state.
          state[itemID] = item;
        } else {
          state[itemID] = Object.assign({}, this.state[itemID], item);
        }
        this.setState(Object.assign({}, this.state, state));
      }
    }
  },
  render: function () {
    if (window.gcexports &&
        window.gcexports.viewer &&
        window.gcexports.viewer.Viewer) {
      let Viewer = window.gcexports.viewer.Viewer;
      let lang = window.gcexports.language;
      let itemID = window.gcexports.id;
      if (this.state && this.state[itemID] && this.state[itemID].obj) {
        let state = this.state[itemID];
        let obj = state.obj;
        let data = state.data;
        return (
          <Viewer id="graff-view" className="viewer" obj={obj} data={data} />
        );
      } else {
        return <div/>;
      }
    } else {
      // Legacy path.
      return (
        <svg height="0" width="100%" style={{background: "transparent"}}>
          <g>
            <rect key="1" width="100%" height="100%" fill="white"/>
          </g>
        </svg>
      );
    }
  },
});
var GraffView = React.createClass({
  render: function() {
    gcexports.onDidUpdate && gcexports.onDidUpdate();
    return (
      <GraffContent className="graffContentStage" />
    );
  },
});
export default GraffView;
