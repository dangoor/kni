"use strict";

var Console = require('./console.js');
var Engine = require('./engine.js');
var Scanner = require('./scanner.js');
var OutlineLexer = require('./outline-lexer.js');
var InlineLexer = require('./inline-lexer.js');
var Parser = require('./parser.js');
var Story = require('./story.js');
var grammar = require('./grammar.js');

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
});

var preview = document.getElementById("preview");
var doc = new Document(preview);

document.getElementById("run_button").addEventListener("click", function() {
    doc.clear();
    preview.innerHTML = "";
    var story = new Story();

    var p = new Parser(grammar.start(story));
    var il = new InlineLexer(p);
    var ol = new OutlineLexer(il);
    var s = new Scanner(ol);
    s.next(cm.getValue());
    s.return();
    var engine = new Engine({
        story: story.states,
        render: doc,
        dialog: doc,
        handler: {
            goto: function _goto(label) {
                console.log(label);
            },
            answer: function answer(text) {
                console.log('>', text);
            }
        }
    });

    engine.resume();
});