"use strict";

var Console = require('./console');
var Engine = require('./engine');
var Scanner = require('./scanner');
var OutlineLexer = require('./outline-lexer');
var InlineLexer = require('./inline-lexer');
var Parser = require('./parser');
var Story = require('./story');
var grammar = require('./grammar');

'use strict';

function Document(element) {
    var self = this;
    this.document = element.ownerDocument;
    this.parent = element;
    this.frame = null;
    this.content = null;
    this.contentCursor = null;
    this.contentCursorParent = null;
    this.engine = null;
    this.carry = '';
    this.p = false;
    this.br = false;
}

Document.prototype.write = function write(lift, text, drop) {
    var document = this.document;
    lift = this.carry || lift;
    if (this.p) {
        this.contentCursor = {
            type: "p",
            children: [],
        };
        this.contentCursorParent.children.push(this.contentCursor);
        this.p = false;
        this.br = false;
        lift = '';
    }
    if (this.br) {
        this.contentCursor.children.push({
            type: "br",
        });
        this.br = false;
        lift = '';
    }
    var cc = this.contentCursor;
    var lastChild = cc.children[cc.children.length - 1];
    if (lastChild && lastChild === "text") {
        lastChild.value = lastChild.value + lift + text;
    } else {
        cc.children.push({
            type: "text",
            value: lift + text
        });
    }
    this.carry = drop;
};

Document.prototype.break = function _break() {
    this.br = true;
};

Document.prototype.paragraph = function paragraph() {
    this.p = true;
};

Document.prototype.startOption = function startOption() {
    var option = {
        children: [],
    };
    this.contentCursor = option;
    this.contentCursorParent = option;
    this.content.options.push(option);
    this.p = false;
    this.br = false;
    this.carry = '';
};

Document.prototype.stopOption = function stopOption() {
    this.p = false;
    this.br = false;
};

Document.prototype.flush = function flush() {
    // No-op (for console only)
};

Document.prototype.pardon = function pardon() {
    // No-op (for console only)
};

function addChildren(parentElement, content) {
    content.children.forEach(function(child) {
        if (child.type === "p") {
            var para = document.createElement("p");
            addChildren(para, child);
            parentElement.appendChild(para);
        } else if (child.type === "text") {
            parentElement.appendChild(document.createTextNode(child.value));
        } else if (child.type === "br") {
            parentElement.appendChild(document.createElement("br"));
        }
    });
}

Document.prototype.display = function display() {
    console.log("display content");
    console.log(this.content);

    var content = this.content;
    this.parent.innerHTML = "";
    addChildren(this.parent, content.body);
    var optionsTable = document.createElement("table");
    var self = this;
    content.options.forEach(function(option, i) {
        var optionIndex = i + 1;
        var tr = document.createElement("tr");
        var cell = document.createElement("th");
        cell.appendChild(document.createTextNode(optionIndex + "."));
        tr.appendChild(cell);
        cell = document.createElement("td");
        cell.onclick = function() {
            self.answer(optionIndex);
        };
        addChildren(cell, option);
        tr.appendChild(cell);
        optionsTable.appendChild(tr);
    });
    this.parent.appendChild(optionsTable);
};

Document.prototype.clear = function clear() {
    this.createPage(this.document, this);
    this.br = false;
    this.p = true;
    this.carry = '';
};

Document.prototype.createPage = function createPage(document) {
    this.content = {
        body: {
            children: [],
        },
        options: [],
    };
    this.contentCursorParent = this.content.body;
    this.contentCursor = null;
};

Document.prototype.ask = function ask() {
};

Document.prototype.answer = function answer(text) {
    this.engine.answer(text);
};

Document.prototype.close = function close() {
};


var cm = window.cm = CodeMirror(document.getElementById("editor"),
{
    value: "Test content\n\n",
    lineNumbers: true,
});

cm.setSize("100%", "100%");

var preview = document.getElementById("preview");
var doc = new Document(preview);
var currentWaypoint = null;
var currentStoryStates = {};
var lastEditorContents = "";

function updateURL() {
    var currentState = {
        waypoint: currentWaypoint,
        script: cm.getValue(),
    };
    window.history.replaceState(currentState, '', '#' + encodeURIComponent(JSON.stringify(currentState)));
}

function startGame() {
    doc.clear();
    preview.innerHTML = "";
    var story = new Story();

    var p = new Parser(grammar.start(story));
    var il = new InlineLexer(p);
    var ol = new OutlineLexer(il);
    var s = new Scanner(ol);
    s.next(cm.getValue());
    s.return();
    currentStoryStates = story.states;
    var engine = new Engine({
        story: story.states,
        render: doc,
        dialog: doc,
        handler: {
            waypoint: function(waypoint) {
                currentWaypoint = waypoint;
                updateURL();
            },
            goto: function _goto(label) {
                console.log(label);
            },
            answer: function answer(text) {
                console.log('>', text);
            }
        }
    });

    engine.resume(currentWaypoint);
}

function reloadFromURL() {
    var currentState = window.location.hash;
    if (!currentState) {
        return;
    }
    currentState = currentState.slice(1);
    currentState = decodeURIComponent(currentState);
    try {
        currentState = JSON.parse(currentState);
    } catch (e) {
        console.error("Unable to parse URL contents");
        currentState = null;
    }
    cm.setValue(currentState.script);
    currentWaypoint = currentState.waypoint;
    startGame();
}

reloadFromURL();

function changeModes() {
    var modeButton = document.getElementById("mode_button");
    if (modeButton.innerHTML === "JSON") {
        modeButton.innerHTML = "Kni";
        lastEditorContents = cm.getValue();
        cm.setOption("readOnly", true);
        cm.setValue(JSON.stringify(currentStoryStates, null, 2));
    } else {
        modeButton.innerHTML = "JSON";
        cm.setValue(lastEditorContents);
        cm.setOption("readOnly", false);
    }
}

document.getElementById("run_button").addEventListener("click", startGame);
document.getElementById("reset_button").addEventListener("click", function() {
    currentWaypoint = null;
    updateURL();
    startGame();
});

document.getElementById("mode_button").addEventListener("click", changeModes);