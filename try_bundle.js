// @generated
/*eslint semi:[0], no-native-reassign:[0]*/
global = this;
(function (modules) {

    // Bundle allows the run-time to extract already-loaded modules from the
    // boot bundle.
    var bundle = {};
    var main;

    // Unpack module tuples into module objects.
    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];
        module = modules[i] = new Module(
            module[0],
            module[1],
            module[2],
            module[3],
            module[4]
        );
        bundle[module.filename] = module;
    }

    function Module(id, dirname, basename, dependencies, factory) {
        this.id = id;
        this.dirname = dirname;
        this.filename = dirname + "/" + basename;
        // Dependency map and factory are used to instantiate bundled modules.
        this.dependencies = dependencies;
        this.factory = factory;
    }

    Module.prototype._require = function () {
        var module = this;
        if (module.exports === void 0) {
            module.exports = {};
            var require = function (id) {
                var index = module.dependencies[id];
                var dependency = modules[index];
                if (!dependency)
                    throw new Error("Bundle is missing a dependency: " + id);
                return dependency._require();
            };
            require.main = main;
            module.exports = module.factory(
                require,
                module.exports,
                module,
                module.filename,
                module.dirname
            ) || module.exports;
        }
        return module.exports;
    };

    // Communicate the bundle to all bundled modules
    Module.prototype.modules = bundle;

    return function require(filename) {
        main = bundle[filename];
        main._require();
    }
})([["console.js","kni","console.js",{"./excerpt":4,"./wrapper":14},function (require, exports, module, __filename, __dirname){

// kni/console.js
// --------------

'use strict';

module.exports = Console;

var Excerpt = require('./excerpt');
var Wrapper = require('./wrapper');

function Console(writer) {
    this.writer = writer;
    this.wrapper = new Wrapper(writer);
    this.excerpt = new Excerpt();
    this.options = [];
    this.cursor = this.excerpt;
}

Console.prototype.write = function write(lift, text, drop) {
    this.cursor.digest(lift, text, drop);
};

Console.prototype.break = function _break() {
    this.cursor.break();
};

Console.prototype.paragraph = function paragraph() {
    this.cursor.paragraph();
};

Console.prototype.startOption = function startOption() {
    var option = new Excerpt();
    this.cursor = option;
    this.options.push(option);
};

Console.prototype.stopOption = function stopOption() {
    this.cursor = this.excerpt;
};

Console.prototype.flush = function flush() {
    this.writer.write('\n');
};

Console.prototype.pardon = function pardon() {
    this.writer.write('?\n');
};

Console.prototype.display = function display() {
    this.excerpt.write(this.wrapper);
    for (var i = 0; i < this.options.length; i++) {
        var number = i + 1;
        var lead = (number + '.   ').slice(0, 3) + ' ';
        this.wrapper.word(lead);
        this.wrapper.flush = true;
        this.wrapper.push('    ', '   ');
        this.options[i].write(this.wrapper);
        this.wrapper.pop();
    }
};

Console.prototype.clear = function clear() {
    this.excerpt = new Excerpt();
    this.options = [];
    this.cursor = this.excerpt;
};

}],["describe.js","kni","describe.js",{},function (require, exports, module, __filename, __dirname){

// kni/describe.js
// ---------------

'use strict';

module.exports = describe;

function describe(node) {
    return types[node.type](node);
}

var types = {};

types.text = function text(node) {
    return node.text;
};

types.echo = function echo(node) {
    return S(node.expression);
};

types.opt = function opt(node) {
    return '(Q ' + node.question.join(' ') + ') (A ' + node.answer.join(' ') + ')';
};

types.goto = function goto(node) {
    return '';
};

types.call = function call(node) {
    return node.branch + '(' + node.args.map(S).join(' ') + ')';
};

types.args = function args(node) {
    return '(' + node.locals.join(' ') + ')';
};

types.jump = function jump(node) {
    return node.branch + ' if ' + S(node.condition);
};

types.switch = function _switch(node) {
    var desc = '';
    if (node.variable) {
        desc += '(' + node.variable + '+' +  node.value + ') ' + S(node.expression);
    } else {
        desc += S(node.expression);
    }
    desc += ' (' + node.branches.join(' ') + ') W(' + node.weights.map(S).join(' ') + ')';
    return desc;
};

types.set = function set(node) {
    return node.variable + ' ' + S(node.expression);
};

types.move = function move(node) {
    return S(node.source) + ' -> ' + S(node.target);
};

types.br = function br(node) {
    return '';
};

types.par = function par(node) {
    return '';
};

types.rule = function rule(node) {
    return '';
};

types.startJoin = function startJoin(node) {
    return '';
};

types.stopJoin = function stopJoin(node) {
    return '';
};

types.delimit = function delimit(node) {
    return '';
};

types.ask = function ask(node) {
    return '';
};

function S(args) {
    if (args[0] === 'val' || args[0] === 'get') {
        return args[1];
    } else if (args[0] === 'var') {
        return '(' + args[0] + ' ' + V(args[1], args[2]) + ')';
    } else {
        return '(' + args[0] + ' ' + args.slice(1).map(S).join(' ') + ')';
    }
}

function V(source, target) {
    var r = '';
    for (var i = 0; i < target.length; i++) {
        r += source[i];
        r += '{' + S(target[i]) + '}';
    }
    r += source[i];
    return r;
}

}],["engine.js","kni","engine.js",{"./story":12,"./evaluate":3,"./describe":1},function (require, exports, module, __filename, __dirname){

// kni/engine.js
// -------------

'use strict';

var Story = require('./story');
var evaluate = require('./evaluate');
var describe = require('./describe');

module.exports = Engine;

var debug = typeof process === 'object' && process.env.DEBUG_ENGINE;

function Engine(args) {
    // istanbul ignore next
    var self = this;
    this.story = args.story;
    this.handler = args.handler;
    this.options = [];
    this.keywords = {};
    this.noOption = null;
    this.global = new Global(this.handler);
    this.top = this.global;
    this.stack = [this.top];
    this.label = '';
    // istanbul ignore next
    var start = args.start || 'start';
    this.instruction = new Story.constructors.goto(start);
    this.render = args.render;
    this.dialog = args.dialog;
    this.dialog.engine = this;
    // istanbul ignore next
    this.randomer = args.randomer || Math;
    this.debug = debug;
    this.waypoint = null;
    Object.seal(this);
}

Engine.prototype.continue = function _continue() {
    var _continue;
    do {
        // istanbul ignore if
        if (this.debug) {
            console.log(this.label + ' ' +  this.instruction.type + ' ' + describe(this.instruction));
        }
        // istanbul ignore if
        if (!this['$' + this.instruction.type]) {
            console.error('Unexpected instruction type: ' + this.instruction.type, this.instruction);
            this.resume();
        }
        _continue = this['$' + this.instruction.type](this.instruction);
    } while (_continue);
};

Engine.prototype.goto = function _goto(label) {
    while (label == null && this.stack.length > 1) {
        var top = this.stack.pop();
        if (top.stopOption) {
            this.render.stopOption();
        }
        this.top = this.stack[this.stack.length - 1];
        label = top.next;
    }
    if (label == null) {
        return this.end();
    }
    var next = this.story[label];
    // istanbul ignore if
    if (!next) {
        console.error('Story missing label', label);
        return this.resume();
    }
    // istanbul ignore if
    if (!next) {
        console.error('Story missing instruction for label: ' + label);
        return this.resume();
    }
    if (this.handler && this.handler.goto) {
        this.handler.goto(label, next);
    }
    this.label = label;
    this.instruction = next;
    return true;
};

Engine.prototype.gothrough = function gothrough(sequence, next, stopOption) {
    var prev = this.label;
    for (var i = sequence.length -1; i >= 0; i--) {
        // Note that we pass the top frame as both the parent scope and the
        // caller scope so that the entire sequence has the same variable
        // visibility.
        if (next) {
            this.top = new Frame(this.top, this.top, [], next, prev, stopOption);
            this.stack.push(this.top);
        }
        prev = next;
        next = sequence[i];
        stopOption = false;
    }
    return this.goto(next);
};

Engine.prototype.end = function end() {
    if (this.handler && this.handler.end) {
        this.handler.end(this);
    }
    this.display();
    this.dialog.close();
    return false;
};

Engine.prototype.ask = function ask() {
    if (this.options.length) {
        this.display();
        if (this.handler && this.handler.ask) {
            this.handler.ask(this);
        }
        this.dialog.ask();
    } else if (this.noOption != null) {
        var answer = this.noOption.answer;
        this.flush();
        this.gothrough(answer, null, false);
        this.continue();
    } else {
        return this.goto(this.instruction.next);
    }
};

Engine.prototype.answer = function answer(text) {
    if (this.handler && this.handler.answer) {
        this.handler.answer(text, this);
    }
    this.render.flush();
    var choice = text - 1;
    if (choice >= 0 && choice < this.options.length) {
        return this.choice(this.options[choice]);
    } else if (this.keywords[text]) {
        return this.choice(this.keywords[text]);
    } else {
        this.render.pardon();
        this.ask();
    }
};

Engine.prototype.choice = function _choice(choice) {
    if (this.handler && this.handler.choice) {
        this.handler.choice(choice, this);
    }
    this.render.clear();
    this.waypoint = this.capture(choice.answer);
    if (this.handler && this.handler.waypoint) {
        this.handler.waypoint(this.waypoint, this);
    }
    // There is no known case where gothrough would immediately exit for
    // lack of further instructions, so
    // istanbul ignore else
    if (this.gothrough(choice.answer, null, false)) {
        this.flush();
        this.continue();
    }
};

Engine.prototype.display = function display() {
    this.render.display();
};

Engine.prototype.flush = function flush() {
    this.options.length = 0;
    this.noOption = null;
    this.keywords = {};
};

Engine.prototype.write = function write(text) {
    this.render.write(this.instruction.lift, text, this.instruction.drop);
    return this.goto(this.instruction.next);
};

// istanbul ignore next
Engine.prototype.capture = function capture(answer) {
    var stack = [];
    var top = this.top;
    while (top !== this.global) {
        stack.unshift(top.capture());
        top = top.parent;
    }
    return [
        this.label || "",
        answer,
        stack,
        this.global.capture(),
        [
            this.randomer._state0U,
            this.randomer._state0L,
            this.randomer._state1U,
            this.randomer._state1L
        ]
    ];
};

// istanbul ignore next
Engine.prototype.resume = function resume(state) {
    this.render.clear();
    this.flush();
    this.label = '';
    this.global = new Global(this.handler);
    this.top = this.global;
    this.stack = [this.top];
    if (state == null) {
        if (this.handler && this.handler.waypoint) {
            this.handler.waypoint(null, this);
        }
        this.goto('start');
        this.continue();
        return;
    }

    this.label = state[0];
    var answer = state[1];
    var stack = state[2];
    for (var i = 0; i < stack.length; i++) {
        this.top = Frame.resume(this.top, this.global, stack[i]);
        this.stack.push(this.top);
    }
    var global = state[3];
    var keys = global[0];
    var values = global[1];
    for (var i = 0; i < keys.length; i++) {
        this.global.set(keys[i], values[i]);
    }
    var random = state[4];
    this.randomer._state0U = random[0];
    this.randomer._state0L = random[1];
    this.randomer._state1U = random[2];
    this.randomer._state1L = random[3];
    if (answer == null) {
        this.flush();
        this.continue();
    } else if (this.gothrough(answer, null, false)) {
        this.flush();
        this.continue();
    }
};

// istanbul ignore next
Engine.prototype.log = function log() {
    this.top.log();
    console.log('');
};

// Here begin the instructions

Engine.prototype.$text = function $text() {
    return this.write(this.instruction.text);
};

Engine.prototype.$echo = function $echo() {
    return this.write('' + evaluate(this.top, this.randomer, this.instruction.expression));
};

Engine.prototype.$br = function $br() {
    this.render.break();
    return this.goto(this.instruction.next);
};

Engine.prototype.$par = function $par() {
    this.render.paragraph();
    return this.goto(this.instruction.next);
};

Engine.prototype.$rule = function $rule() {
    // TODO
    this.render.paragraph();
    return this.goto(this.instruction.next);
};

Engine.prototype.$goto = function $goto() {
    return this.goto(this.instruction.next);
};

Engine.prototype.$call = function $call() {
    var procedure = this.story[this.instruction.branch];
    // istanbul ignore if
    if (!procedure) {
        console.error('no such procedure ' + this.instruction.branch, this.instruction);
        return this.resume();
    }
    // istanbul ignore if
    if (procedure.type !== 'args') {
        console.error('Can\'t call non-procedure ' + this.instruction.branch, this.instruction);
        return this.resume();
    }
    // istanbul ignore if
    if (procedure.locals.length !== this.instruction.args.length) {
        console.error('Argument length mismatch for ' + this.instruction.branch, this.instruction, procedure);
        return this.resume();
    }
    // TODO replace this.global with closure scope if scoped procedures become
    // viable. This will require that the engine create references to closures
    // when entering a new scope (calling a procedure), in addition to
    // capturing locals. As such the parser will need to retain a reference to
    // the enclosing procedure and note all of the child procedures as they are
    // encountered.
    this.top = new Frame(this.top, this.global, procedure.locals, this.instruction.next, this.label);
    if (this.instruction.next) {
        this.stack.push(this.top);
    }
    for (var i = 0; i < this.instruction.args.length; i++) {
        var arg = this.instruction.args[i];
        var value = evaluate(this.top.parent, this.randomer, arg);
        this.top.set(procedure.locals[i], value);
    }
    return this.goto(this.instruction.branch);
};

Engine.prototype.$args = function $args() {
    // Procedure argument instructions exist as targets for labels as well as
    // for reference to locals in calls.
    return this.goto(this.instruction.next);
};

Engine.prototype.$opt = function $opt() {
    var option = this.instruction;
    for (var i = 0; i < option.keywords.length; i++) {
        var keyword = option.keywords[i];
        // The first option to introduce a keyword wins, not the last.
        if (!this.keywords[keyword]) {
            this.keywords[keyword] = option;
        }
    }
    if (option.question.length) {
        this.options.push(option);
        this.render.startOption();
        return this.gothrough(option.question, this.instruction.next, true);
    } else if (this.noOption == null) {
        this.noOption = option;
    }
    return this.goto(option.next);
};

Engine.prototype.$move = function $move() {
    var value = evaluate(this.top, this.randomer, this.instruction.source);
    var name = evaluate.nominate(this.top, this.randomer, this.instruction.target);
    // istanbul ignore if
    if (this.debug) {
        console.log(this.top.at() + '/' + this.label + ' ' + name + ' = ' + value);
    }
    this.top.set(name, value);
    return this.goto(this.instruction.next);
};

Engine.prototype.$jump = function $jump() {
    var j = this.instruction;
    if (evaluate(this.top, this.randomer, j.condition)) {
        return this.goto(this.instruction.branch);
    } else {
        return this.goto(this.instruction.next);
    }
};

Engine.prototype.$switch = function $switch() {
    var branches = this.instruction.branches.slice();
    var weightExpressions = this.instruction.weights.slice();
    var samples = 1;
    var nexts = [];
    if (this.instruction.mode === 'pick') {
        samples = evaluate(this.top, this.randomer, this.instruction.expression);
    }
    for (var i = 0; i < samples; i++) {
        var value;
        var weights = [];
        var weight = weigh(this.top, this.randomer, weightExpressions, weights);
        if (this.instruction.mode === 'rand' || this.instruction.mode === 'pick') {
            if (weights.length === weight) {
                value = Math.floor(this.randomer.random() * branches.length);
            } else {
                value = pick(weights, weight, this.randomer);
                if (value == null) {
                    break;
                }
            }
        } else {
            value = evaluate(this.top, this.randomer, this.instruction.expression);
            if (this.instruction.variable != null) {
                this.top.set(this.instruction.variable, value + this.instruction.value);
            }
        }
        if (this.instruction.mode === 'loop') {
            // actual modulo, wraps negatives
            value = ((value % branches.length) + branches.length) % branches.length;
        } else if (this.instruction.mode === 'hash') {
            value = evaluate.hash(value) % branches.length;
        }
        value = Math.min(value, branches.length - 1);
        value = Math.max(value, 0);
        var next = branches[value];
        pop(branches, value);
        pop(weightExpressions, value);
        nexts.push(next);
    }
    // istanbul ignore if
    if (this.debug) {
        console.log(this.top.at() + '/' + this.label + ' ' + value + ' -> ' + next);
    }
    return this.gothrough(nexts, this.instruction.next, false);
};

function weigh(scope, randomer, expressions, weights) {
    var weight = 0;
    for (var i = 0; i < expressions.length; i++) {
        weights[i] = evaluate(scope, randomer, expressions[i]);
        weight += weights[i];
    }
    return weight;
}

function pick(weights, weight, randomer) {
    var offset = Math.floor(randomer.random() * weight);
    var passed = 0;
    for (var i = 0; i < weights.length; i++) {
        passed += weights[i];
        if (offset < passed) {
            return i;
        }
    }
    return null;
}

function pop(array, index) {
    array[index] = array[array.length - 1];
    array.length--;
}

Engine.prototype.$ask = function $ask() {
    this.ask();
    return false;
};

function Global(handler) {
    this.scope = Object.create(null);
    this.handler = handler;
    Object.seal(this);
}

Global.prototype.get = function get(name) {
    if (this.handler && this.handler.has && this.handler.has(name)) {
        return this.handler.get(name);
    } else {
        return this.scope[name] || 0;
    }
};

Global.prototype.set = function set(name, value) {
    if (this.handler && this.handler.has && this.handler.has(name)) {
        this.handler.set(name, value);
    } else {
        this.scope[name] = value;
    }
    if (this.handler && this.handler.changed) {
        this.handler.changed(name, value);
    }
};

// istanbul ignore next
Global.prototype.log = function log() {
    var names = Object.keys(this.scope);
    names.sort();
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var value = this.scope[name];
        console.log(name + ' = ' + value);
    }
    console.log('');
};

// istanbul ignore next
Global.prototype.at = function at() {
    return '';
};

// istanbul ignore next
Global.prototype.capture = function capture() {
    var names = Object.keys(this.scope);
    var values = [];
    for (var i = 0; i < names.length; i++) {
        values[i] = this.scope[names[i]] || 0;
    }
    return [
        names,
        values
    ];
};

// TODO names of parent and caller are not right, might be swapped.
// parent should be the scope parent for upchain lookups.
function Frame(parent, caller, locals, next, branch, stopOption) {
    this.locals = locals;
    this.scope = Object.create(null);
    for (var i = 0; i < locals.length; i++) {
        this.scope[locals[i]] = 0;
    }
    this.parent = parent;
    this.caller = caller;
    this.next = next;
    this.branch = branch;
    this.stopOption = stopOption || false;
}

Frame.prototype.get = function get(name) {
    if (this.locals.indexOf(name) >= 0) {
        return this.scope[name];
    }
    return this.caller.get(name);
};

Frame.prototype.set = function set(name, value) {
    // istanbul ignore else
    if (this.locals.indexOf(name) >= 0) {
        this.scope[name] = value;
        return;
    }
    this.caller.set(name, value);
};

// istanbul ignore next
Frame.prototype.log = function log() {
    this.parent.log();
    console.log('--- ' + this.branch + ' -> ' + this.next);
    for (var i = 0; i < this.locals.length; i++) {
        var name = this.locals[i];
        var value = this.scope[name];
        console.log(name + ' = ' + value);
    }
};

// istanbul ignore next
Frame.prototype.at = function at() {
    return this.caller.at() + '/' + this.branch;
};

// istanbul ignore next
Frame.prototype.capture = function capture() {
    var values = [];
    // var object = {};
    for (var i = 0; i < this.locals.length; i++) {
        var local = this.locals[i];
        values.push(this.scope[local] || 0);
    }
    return [
        this.locals,
        values,
        this.next || "",
        this.branch || "",
        +(this.caller === this.top),
        +this.stopOption
    ];
};

// istanbul ignore next
Frame.resume = function resume(top, global, state) {
    var keys = state[0];
    var values = state[1];
    var next = state[2];
    var branch = state[3];
    var dynamic = state[4];
    var stopOption = state[5];
    top = new Frame(
        top,
        dynamic ? top : global,
        keys,
        next,
        branch,
        !!stopOption
    );
    for (var i = 0; i < keys.length; i++) {
        top.set(keys[i], values[i]);
    }
    return top;
};

}],["evaluate.js","kni","evaluate.js",{},function (require, exports, module, __filename, __dirname){

// kni/evaluate.js
// ---------------

'use strict';

module.exports = evaluate;

function evaluate(scope, randomer, args) {
    var name = args[0];
    if (unary[name] && args.length === 2) {
        return unary[name](
            evaluate(scope, randomer, args[1]),
            scope,
            randomer
        );
    } else if (binary[name] && args.length === 3) {
        return binary[name](
            evaluate(scope, randomer, args[1]),
            evaluate(scope, randomer, args[2]),
            scope,
            randomer
        );
    } else if (name === 'val') {
        return args[1];
    } else if (name === 'get') {
        return +scope.get(args[1]);
    // istanbul ignore else
    } else if (name === 'var') {
        return +scope.get(nominate(scope, randomer, args));
    } else if (name === 'call') {
        var name = args[1][1];
        var f = functions[name];
        if (!f) {
            // TODO thread line number for containing instruction
            throw new Error('No function named ' + name);
        }
        var values = [];
        for (var i = 2; i < args.length; i++) {
            values.push(evaluate(scope, randomer, args[i]));
        }
        return f.apply(null, values);
    } else {
        throw new Error('Unexpected operator ' + JSON.stringify(args));
    }
}

evaluate.nominate = nominate;
function nominate(scope, randomer, args) {
    if (args[0] === 'get') {
        return args[1];
    }
    var literals = args[1];
    var variables = args[2];
    var name = '';
    for (var i = 0; i < variables.length; i++) {
        name += literals[i] + evaluate(scope, randomer, variables[i]);
    }
    name += literals[i];
    return name;
}

var functions = {
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan2: Math.atan2,
    atan: Math.atan,
    exp: Math.exp,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    sin: Math.sin,
    tan: Math.tan,

    floor: Math.floor,
    ceil: Math.floor,
    round: Math.floor,

    sign: function (x) {
        if (x < 0) {
            return -1;
        }
        if (x > 0) {
            return 1;
        }
        return 0;
    },

    mean: function () {
        var mean = 0;
        for (var i = 0; i < arguments.length; i++) {
            mean += arguments[i];
        }
        return mean / i;
    },

    root: function root(x, y) {
        if (y === 2 || y == null) {
            return Math.sqrt(x);
        }
        return Math.pow(x, 1 / y);
    },

    distance: function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    manhattan: function distance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1, 2) + Math.abs(y2 - y1);
    },

    // TODO parameterize these functions in terms of the expected turns to
    // go from 25% to 75% of capacity, to adjust the rate. This will maybe
    // almost make them understandable.
    //
    // sigmoid: function (steps, cap) {
    //     if (steps === -Infinity) {
    //         return 0;
    //     } else if (steps === Infinity) {
    //         return cap;
    //     } else {
    //         return cap / (1 + Math.pow(Math.E, -steps));
    //     }
    // },

    // diomgis: function (pop, cap) {
    //     if (pop <= 0) {
    //         return -Infinity;
    //     }
    //     var ratio = cap / pop - 1;
    //     if (ratio === 0) {
    //         return Infinity;
    //     }
    //     return -Math.log(ratio, Math.E);
    // },

};

var binary = {
    '+': function (x, y) {
        return x + y;
    },
    '-': function (x, y) {
        return x - y;
    },
    '*': function (x, y) {
        return x * y;
    },
    '/': function (x, y) {
        return (x / y) >> 0;
    },
    '%': function (x, y) {
        return ((x % y) + y) % y;
    },
    '**': function (x, y) {
        return Math.pow(x, y);
    },
    'or': function (x, y) {
        return x || y ? 1 : 0;
    },
    'and': function (x, y) {
        return x && y ? 1 : 0;
    },
    '>=': function (x, y) {
        return x >= y ? 1 : 0;
    },
    '>': function (x, y) {
        return x > y ? 1 : 0;
    },
    '<=': function (x, y) {
        return x <= y ? 1 : 0;
    },
    '<': function (x, y) {
        return x < y ? 1 : 0;
    },
    '==': function (x, y) {
        return x === y ? 1 : 0;
    },
    '<>': function (x, y) {
        return x != y ? 1 : 0;
    },
    '#': function (x, y) {
        return hilbert(x, y);
    },
    '~': function (x, y, scope, randomer) {
        var r = 0;
        for (var i = 0; i < x; i++) {
            r += randomer.random() * y;
        }
        return Math.floor(r);
    }
};

// istanbul ignore next
var unary = {
    'not': function (x) {
        return x ? 0 : 1;
    },
    '-': function (x) {
        return -x;
    },
    '~': function (x, scope, randomer) {
        return Math.floor(randomer.random() * x);
    },
    '#': function (x) {
        return hash(x);
    }
};

// Robert Jenkins's 32 bit hash function
// https://gist.github.com/badboy/6267743
evaluate.hash = hash;
function hash(a) {
    a = (a+0x7ed55d16) + (a<<12);
    a = (a^0xc761c23c) ^ (a>>>19);
    a = (a+0x165667b1) + (a<<5);
    a = (a+0xd3a2646c) ^ (a<<9);
    a = (a+0xfd7046c5) + (a<<3);
    a = (a^0xb55a4f09) ^ (a>>>16);
    return a;
}

// hilbert in range from 0 to 2^32
// x and y in range from 0 to 2^16
// each dimension has origin at 2^15
var dimensionWidth = (-1 >>> 16) + 1;
var halfDimensionWidth = dimensionWidth / 2;
function hilbert(x, y) {
    x += halfDimensionWidth;
    y += halfDimensionWidth;
    var rx = 0;
    var ry = y;
    var scalar = 0;
    for (var scale = dimensionWidth; scale > 0; scale /= 2) {
        rx = x & scale;
        ry = y & scale;
        scalar += scale * ((3 * rx) ^ ry);
        // rotate
        if (!ry) {
            if (rx) {
                x = scale - 1 - x;
                y = scale - 1 - y;
            }
            // transpose
            var t = x;
            x = y;
            y = t;
        }
    }
    return scalar;
}

}],["excerpt.js","kni","excerpt.js",{},function (require, exports, module, __filename, __dirname){

// kni/excerpt.js
// --------------

// An interface for building excerpts and writing them to a stream.
// The stream must have the interface of the line wrapper.
'use strict';

module.exports = Excerpt;

function Excerpt() {
    this.children = [];
    this.flag = false;
}

Excerpt.prototype.Child = Paragraph;
Excerpt.prototype.paragraph = flag;
Excerpt.prototype.break = breakChild;

// istanbul ignore next
Excerpt.prototype.startJoin = function startJoin(lift, delimiter, conjunction) {
    if (this.children.length === 0) {
        return;
    }
    var last = this.children[this.children.length - 1];
    last.startJoin(lift, delimiter, conjunction);
};

// istanbul ignore next
Excerpt.prototype.delimit = function delimit(delimiter) {
    if (this.children.length === 0) {
        return;
    }
    var last = this.children[this.children.length - 1];
    last.delimit(delimiter);
};

// istanbul ignore next
Excerpt.prototype.stopJoin = function stopJoin() {
    if (this.children.length === 0) {
        return;
    }
    var last = this.children[this.children.length - 1];
    last.stopJoin();
};

Excerpt.prototype.digest = function digest(lift, words, drop) {
    if (typeof words === 'string') {
        words = words.split(' ');
    }
    if (this.children.length === 0 || this.flag) {
        this.children.push(new this.Child());
        this.flag = false;
    }
    var last = this.children[this.children.length - 1];
    last.digest(lift, words, drop);
};

Excerpt.prototype.write = function write(wrapper) {
    for (var i = 0; i < this.children.length; i++) {
        if (i > 0) {
            wrapper.break();
        }
        this.children[i].write(wrapper);
    }
};

function Paragraph() {
    this.children = [];
    this.flag = false;
}

Paragraph.prototype.Child = Stanza;
Paragraph.prototype.break = flag;
Paragraph.prototype.startJoin = Excerpt.prototype.startJoin;
Paragraph.prototype.delimit = Excerpt.prototype.delimit;
Paragraph.prototype.stopJoin = Excerpt.prototype.stopJoin;
Paragraph.prototype.digest = Excerpt.prototype.digest;

Paragraph.prototype.write = function write(wrapper) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].write(wrapper);
    }
};

function Stanza() {
    this.children = [];
    this.lift = false;
    this.empty = true;
    this.cursor = new StanzaProxy(this);
}

// istanbul ignore next
Stanza.prototype.startJoin = function startJoin(lift, delimiter, conjunction) {
    this.cursor = this.cursor.startJoin(lift, delimiter, conjunction);
};

// istanbul ignore next
Stanza.prototype.delimit = function delimit(delimiter) {
    this.cursor.delimit(delimiter);
};

// istanbul ignore next
Stanza.prototype.stopJoin = function stopJoin() {
    this.cursor = this.cursor.stopJoin();
};

Stanza.prototype.digest = function digest(lift, words, drop) {
    this.cursor.digest(lift, words, drop);
};

Stanza.prototype.write = function write(wrapper) {
    for (var i = 0; i < this.children.length; i++) {
        wrapper.word(this.children[i]);
    }
    wrapper.break();
};

Stanza.prototype.proxyDigest = function proxyDigest(lift, words, drop) {
    lift = this.lift || lift;
    var i = 0;
    if (!lift && words.length && this.children.length) {
        this.children[this.children.length - 1] += words[i++];
    }
    for (; i < words.length; i++) {
        this.children.push(words[i]);
    }
    this.lift = drop;
    this.empty = false;
};

function StanzaProxy(parent) {
    this.parent = parent;
}

// istanbul ignore next
StanzaProxy.prototype.startJoin = function startJoin(lift, delimiter, conjunction) {
    return new Conjunction(this, lift, delimiter, conjunction);
};

// istanbul ignore next
StanzaProxy.prototype.delimit = function delimit(delimiter) {
    this.parent.digest('', [delimiter], ' ');
};

// istanbul ignore next
StanzaProxy.prototype.stopJoin = function stopJoin() {
    throw new Error('cannot stop without starting conjunction');
};

StanzaProxy.prototype.digest = function digest(lift, words, drop) {
    this.parent.proxyDigest(lift, words, drop);
};

// istanbul ignore next
function Conjunction(parent, lift, delimiter, conjunction) {
    this.children = [];
    this.parent = parent;
    this.lift = lift;
    this.delimiter = delimiter;
    this.conjunction = conjunction;
}

Conjunction.prototype.Child = Stanza;
Conjunction.prototype.delimit = flag;
Conjunction.prototype.digest = Excerpt.prototype.digest;

Conjunction.prototype.startJoin = StanzaProxy.prototype.startJoin;

// istanbul ignore next
Conjunction.prototype.stopJoin = function stopJoin(drop) {
    if (this.children.length === 0) {
    } else if (this.children.length === 1) {
        this.parent.digest(this.lift, this.children[0].children, drop);
    } else if (this.children.length === 2) {
        this.parent.digest(this.lift, this.children[0].children, '');
        this.parent.digest(' ', [this.conjunction], ' ');
        this.parent.digest(' ', this.children[1].children, drop);
    } else {
        for (var i = 0; i < this.children.length - 1; i++) {
            this.parent.digest('', this.children[i].children, '');
            this.parent.digest('', [this.delimiter], ' ');
        }
        this.parent.digest('', [this.conjunction], ' ');
        this.parent.digest('', this.children[i].children, '');
    }
    return this.parent;
};

function flag() {
    this.flag = true;
}

function breakChild() {
    // istanbul ignore next
    if (this.children.length === 0) {
        return;
    }
    var last = this.children[this.children.length - 1];
    last.break();
};

}],["expression.js","kni","expression.js",{},function (require, exports, module, __filename, __dirname){

// kni/expression.js
// -----------------

'use strict';

module.exports = expression;

var unary = {
    'not': true,
    '-': true,
    '~': true,
    '#': true
};

var exponential = {
    '**': true // x ** y
};

var multiplicative = {
    '*': true,
    '/': true,
    '%': true,
    'rem': true,
    '~': true,
};

var arithmetic = {
    '+': true,
    '-': true,
};

var comparison = {
    '<': true,
    '<=': true,
    '==': true,
    '<>': true,
    '>=': true,
    '>': true,
    '#': true
};

var intersection = {
    'and': true
};

var union = {
    'or': true
};

var precedence = [ // from low to high
    union,
    intersection,
    comparison,
    arithmetic,
    multiplicative,
    exponential,
];

function expression(story, parent) {
    for (var i = 0; i < precedence.length; i++) {
        var operators = precedence[i];
        parent = new BinaryExpression(story, operators, parent);
    }
    return new Unary(story, parent);
}

expression.variable = variable;
function variable(story, parent) {
    return new GetStaticVariable(story, parent, [], [], '', true);
}

expression.label = label;
function label(story, parent) {
    return new GetStaticVariable(story, new AfterVariable(story, parent), [], [], '', true);
}

var inversions = {
    '==': '<>',
    '<>': '==',
    '>': '<=',
    '<': '>=',
    '>=': '<',
    '<=': '>'
};

expression.invert = invert;
function invert(expression) {
    if (expression[0] === 'not') {
        return expression[1];
    } else if (inversions[expression[0]]) {
        return [inversions[expression[0]], expression[1], expression[2]];
    } else {
        return ['not', expression];
    }
}

function Open(story, parent) {
    this.type = 'parenthetical-expression';
    this.story = story;
    this.parent = parent;
    Object.seal(this);
}

Open.prototype.return = function _return(expression, scanner) {
    return new Close(this.story, this.parent, expression);
};

function Close(story, parent, expression) {
    this.type = 'end-of-expression';
    this.story = story;
    this.parent = parent;
    this.expression = expression;
    Object.seal(this);
}

Close.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore else
    if (type === 'symbol' && text === ')') {
        return this.parent.return(this.expression, scanner);
    } else {
        this.story.error('Expected parenthetical expression to end with ) or continue with operator, got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent.return(this.expression, scanner);
    }
};

function Value(story, parent) {
    this.type = 'expect-value';
    this.story = story;
    this.parent = parent;
    Object.seal(this);
}

Value.prototype.next = function next(type, space, text, scanner) {
    if (type === 'number') {
        return this.parent.return(['val', +text], scanner);
    } else if (text === '(') {
        return expression(this.story, new Open(this.story, this.parent));
    } else if (text === '{') {
        return expression(this.story, new GetDynamicVariable(this.story, this.parent, [''], []));
    // istanbul ignore else
    } else if (type === 'alphanum') {
        return new GetStaticVariable(this.story, new AfterVariable(this.story, this.parent), [], [], text, false);
    } else {
        this.story.error('Expected expression, got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent.return(['val', 0], scanner)
            .next(type, space, text, scanner);
    }
};

function AfterVariable(story, parent) {
    this.story = story;
    this.parent = parent;
    Object.seal(this);
}

AfterVariable.prototype.return = function _return(expression, scanner) {
    return new MaybeCall(this.story, this.parent, expression);
};

function MaybeCall(story, parent, expression) {
    this.type = 'maybe-call';
    this.story = story;
    this.parent = parent;
    this.expression = expression;
    Object.seal(this);
}

MaybeCall.prototype.next = function next(type, space, text, scanner) {
    if (space === '' && text === '(') {
        return new Arguments(this.story, this.parent, this.expression);
    } else {
        return this.parent.return(this.expression, scanner)
            .next(type, space, text, scanner);
    }
};

function Arguments(story, parent, expression) {
    this.type = 'arguments';
    this.story = story;
    this.parent = parent;
    this.args = ['call', expression];
}

Arguments.prototype.next = function next(type, space, text, scanner) {
    if (text === ')') {
        return this.parent.return(this.args, scanner);
    } else {
        return expression(this.story, this)
            .next(type, space, text, scanner);
    }
};

Arguments.prototype.return = function _return(expression, scanner) {
    this.args.push(expression);
    return new MaybeArgument(this.story, this);
};

function MaybeArgument(story, parent) {
    this.story = story;
    this.parent = parent;
    Object.seal(this);
}

MaybeArgument.prototype.next = function next(type, space, text, scanner) {
    if (text === ',') {
        return expression(this.story, this.parent);
    // istanbul ignore else
    } else  if (text === ')') {
        return this.parent.next(type, space, text, scanner);
    } else {
        this.story.error('Expected , or ) to end argument list, got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent;
    }
};

function Unary(story, parent) {
    this.type = 'unary-expression';
    this.story = story;
    this.parent = parent;
    Object.seal(this);
}

Unary.prototype.next = function next(type, space, text, scanner) {
    if (unary[text] === true) {
        return new Unary(this.story,
            new UnaryOperator(this.story, this.parent, text));
    } else {
        return new Value(this.story, this.parent)
            .next(type, space, text, scanner);
    }
};

function UnaryOperator(story, parent, op) {
    this.type = 'unary-operator';
    this.story = story;
    this.parent = parent;
    this.op = op;
}

UnaryOperator.prototype.return = function _return(expression, scanner) {
    return this.parent.return([this.op, expression], scanner);
};

function MaybeOperator(story, parent, expression, operators) {
    this.type = 'maybe-operator';
    this.story = story;
    this.parent = parent;
    this.expression = expression;
    this.operators = operators;
    Object.seal(this);
}

MaybeOperator.prototype.next = function next(type, space, text, scanner) {
    if (this.operators[text] === true) {
        var parent = new MaybeExpression(this.story, this.parent, this.operators);
        parent = new PartialExpression(this.story, parent, text, this.expression);
        for (var i = precedence.indexOf(this.operators) + 1; i < precedence.length; i++) {
            parent = new MaybeExpression(this.story, parent, precedence[i]);
        }
        return new Unary(this.story, parent);
    } else {
        return this.parent.return(this.expression, scanner)
            .next(type, space, text, scanner);
    }
};

function MaybeExpression(story, parent, operators) {
    this.story = story;
    this.parent = parent;
    this.operators = operators;
    Object.seal(this);
}

MaybeExpression.prototype.return = function _return(expression, scanner) {
    return new MaybeOperator(this.story, this.parent, expression, this.operators);
};

function PartialExpression(story, parent, operator, expression) {
    this.story = story;
    this.parent = parent;
    this.operator = operator;
    this.expression = expression;
}

PartialExpression.prototype.return = function _return(expression, scanner) {
    return this.parent.return([this.operator, this.expression, expression], scanner);
};

function BinaryExpression(story, operators, parent) {
    this.type = 'binary-expression';
    this.story = story;
    this.parent = parent;
    this.operators = operators;
    Object.seal(this);
}

BinaryExpression.prototype.return = function _return(expression, scanner) {
    return new MaybeOperator(this.story, this.parent, expression, this.operators);
};

function GetDynamicVariable(story, parent, literals, expressions) {
    this.type = 'get-dynamic-variable';
    this.story = story;
    this.parent = parent;
    this.literals = literals;
    this.expressions = expressions;
    Object.seal(this);
}

GetDynamicVariable.prototype.return = function _return(expression, scanner) {
    return new Expect('token', '}', this.story,
        new GetStaticVariable(this.story,
            this.parent,
            this.literals,
            this.expressions.concat([expression]),
            ''
        )
    );
};

function GetStaticVariable(story, parent, literals, expressions, literal, fresh) {
    this.type = 'static-variable';
    this.story = story;
    this.parent = parent;
    this.literals = literals;
    this.expressions = expressions;
    this.literal = literal;
    this.fresh = fresh;
    Object.seal(this);
}

GetStaticVariable.prototype.next = function next(type, space, text, scanner) {
    if (type !== 'literal' && (space === '' || this.fresh)) {
        this.fresh = false;
        if (text === '{') {
            return expression(this.story, new GetDynamicVariable(
                this.story,
                this.parent,
                this.literals.concat([this.literal]),
                this.expressions
            ));
        } else if (text === '.') {
            this.literal += text;
            return this;
        } else if (type === 'alphanum' || type === 'number') {
            this.literal += text;
            return this;
        }
    }

    var state;
    if (this.literals.length === 0 && this.expressions.length === 0) {
        // istanbul ignore if
        if (this.literal === '') {
            this.story.error('Expected variable but got ' + type + '/' + text + ' at ' + scanner.position());
            state = this.parent.return([], scanner);
        } else {
            state = this.parent.return(['get', this.literal], scanner);
        }
    } else {
        state = this.parent.return(['var', this.literals.concat([this.literal]), this.expressions], scanner);
    }
    return state.next(type, space, text, scanner);
};

function Expect(type, text, story, parent) {
    this.type = 'expect';
    this.expect = type;
    this.text = text;
    this.story = story;
    this.parent = parent;
}

Expect.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore else
    if (type === this.expect && text === this.text) {
        return this.parent;
    } else {
        this.story.error('Expected ' + this.expect + ' ' + this.text + ', got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent;
    }
};

}],["grammar.js","kni","grammar.js",{"./path":10,"./story":12,"./expression":5},function (require, exports, module, __filename, __dirname){

// kni/grammar.js
// --------------

'use strict';

var Path = require('./path');
var story = require('./story');
var expression = require('./expression');

exports.start = start;

function start(story) {
    var path = Path.start();
    var stop = new Stop(story);
    var start = story.create(path, 'goto', null, '1:1');
    return new Thread(story, Path.zerothChild(path), stop, [start], []);
}

function Stop(story) {
    this.story = story;
    Object.freeze(this);
}

// istanbul ignore next
Stop.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore else
    if (type !== 'stop') {
        this.story.error('Expected end of file, got ' + type + '/' + text + ' at ' + scanner.position());
    }
    return new End();
};

Stop.prototype.return = function _return() {
    return this;
};

function End() {
    Object.freeze(this);
}

// istanbul ignore next
End.prototype.next = function next(type, space, text, scanner) {
    return this;
};

// ends are tied to the next instruction
// jumps are tied off after the next encountered prompt
function Thread(story, path, parent, ends, jumps) {
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.story = story;
    Object.freeze(this);
}

Thread.prototype.next = function next(type, space, text, scanner) {
    if (type === 'symbol'|| type === 'alphanum' || type === 'number' || type === 'literal' || text === '--' || text === '---') {
        return new Text(this.story, this.path, space, text, this, this.ends);
    }  else if (type === 'token') {
        if (text === '{') {
            return new Block(this.story, this.path, new ThenExpect('token', '}', this.story, this), this.ends);
        } else if (text === '@') {
            return expression.label(this.story, new Label(this.story, this.path, this, this.ends));
        } else if (text === '->') {
            return expression.label(this.story, new Goto(this.story, this.path, this, this.ends));
        } else if (text === '<-') {
            // Implicitly tie ends to null by dropping them.
            // Continue carrying jumps to the next encountered prompt.
            // Advance the path so that option thread don't appear empty.
            return new Thread(this.story, Path.next(this.path), this.parent, [], this.jumps);
        } else if (text === '/') {
            var node = this.story.create(this.path, 'break', scanner.position());
            tie(this.ends, this.path);
            return new Thread(this.story, Path.next(this.path), this.parent, [node], this.jumps);
        } else if (text === '//') {
            var node = this.story.create(this.path, 'paragraph', null, scanner.position());
            tie(this.ends, this.path);
            return new Thread(this.story, Path.next(this.path), this.parent, [node], this.jumps);
        } else if (text === '{"' || text === '{\'' || text === '"}' || text === '\'}') {
            return new Text(this.story, this.path, space, '', this, this.ends)
                .next(type, '', text, scanner);
        }
    } else if (type === 'start') {
        if (text === '+' || text === '*') {
            return new MaybeOption(this.story, this.path, new ThenExpect('stop', '', this.story, this), this.ends, [], text);
        } else if (text === '-') {
            return new MaybeThread(this.story, this.path, new ThenExpect('stop', '', this.story, this), this.ends, [], []);
        } else if (text === '>') {
            var node = this.story.create(this.path, 'ask', null, scanner.position());
            // tie off ends to the prompt.
            tie(this.ends, this.path);
            // promote jumps to ends, tying them off after the prompt.
            var jumps = this.jumps.slice();
            this.jumps.length = 0;
            return new Thread(this.story, Path.next(this.path), new ThenExpect('stop', '', this.story, this), jumps, []);
        } else { // if text === '!') {
            return new Program(this.story, this.path, new ThenExpect('stop', '', this.story, this), this.ends, []);
        }
    } else if (type === 'dash') {
        var node = this.story.create(this.path, 'rule', scanner.position());
        tie(this.ends, this.path);
        return new Thread(this.story, Path.next(this.path), this.parent, [node], this.jumps);
    } else if (type === 'break') {
        return this;
    }
    if (type === 'stop' || text === '|' || text === ']' || text === '[' || text === '}') {
        return this.parent.return(this.path, this.ends, this.jumps, scanner)
            .next(type, space, text, scanner);
    }
    return new Text(this.story, this.path, space, text, this, this.ends);
};

Thread.prototype.return = function _return(path, ends, jumps, scanner) {
    // All rules above (in next) guarantee that this.ends has been passed to
    // any rule that might use them. If the rule fails to use them, they must
    // return them. However, jumps are never passed to any rule that returns.
    return new Thread(this.story, path, this.parent, ends, this.jumps.concat(jumps));
};

function Text(story, path, lift, text, parent, ends) {
    this.story = story;
    this.path = path;
    this.lift = lift;
    this.text = text;
    this.parent = parent;
    this.ends = ends;
    Object.seal(this);
}

Text.prototype.next = function next(type, space, text, scanner) {
    if (type === 'alphanum' || type === 'number' || type === 'symbol' || type === 'literal') {
        this.text += space + text;
        return this;
    } else if (type === 'token') {
        if (text === '{"') {
            this.text += space + '“';
            return this;
        } else if (text === '"}') {
            this.text += space + '”';
            return this;
        } else if (text === '{\'') {
            this.text += space + '‘';
            return this;
        } else if (text === '\'}') {
            this.text += space + '’';
            return this;
        }
    } else if (text === '--') {
        this.text += space + '–'; // en-dash
        return this;
    } else if (text === '---') {
        this.text += space + '—'; // em-dash
        return this;
    }
    tie(this.ends, this.path);
    var node = this.story.create(this.path, 'text', this.text, scanner.position());
    node.lift = this.lift;
    node.drop = space;
    return this.parent.return(Path.next(this.path), [node], [], scanner)
        .next(type, space, text, scanner);
};

function MaybeThread(story, path, parent, ends, jumps, skips) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.skips = skips;
};

MaybeThread.prototype.next = function next(type, space, text, scanner) {
    if (type === 'token') {
        if (text === '{') {
            return expression(this.story,
                new ThenExpect('token', '}', this.story,
                    new ThreadCondition(this.story, this.path, this.parent, this.ends, this.jumps, this.skips)));
        }
    }
    return new Thread(this.story, this.path, this, this.ends, this.jumps)
        .next(type, space, text, scanner);
};

MaybeThread.prototype.return = function _return(path, ends, jumps, scanner) {
    return this.parent.return(path, ends.concat(this.skips), jumps, scanner);
};

function ThreadCondition(story, path, parent, ends, jumps, skips) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.skips = skips;
    Object.freeze(this);
}

ThreadCondition.prototype.return = function _return(args, scanner) {
    var node = this.story.create(this.path, 'jump', expression.invert(args), scanner.position());
    var branch = new Branch(node);
    tie(this.ends, this.path);
    return new MaybeThread(this.story, Path.next(this.path), this.parent, [node], this.jumps, this.skips.concat([branch]));
};

function MaybeOption(story, path, parent, ends, jumps, leader) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.leader = leader;
    this.conditions = [];
    this.consequences = [];
    this.keywords = {};
    this.at = path;
    this.descended = false;
    Object.seal(this);
}

MaybeOption.prototype.next = function next(type, space, text, scanner) {
    if (type === 'token') {
        if (text === '{') {
            return new OptionOperator(this.story,
                new ThenExpect('token', '}', this.story, this));
        }
        if (text === '<>') {
            return this.return('keyword', '', null, scanner);
        }
        if (text === '<') {
            return new Keyword(this);
        }
    }
    return this.option(scanner).next(type, space, text, scanner);
};

MaybeOption.prototype.return = function _return(operator, expression, modifier, scanner) {
    if (operator === '+' || operator === '-') {
        modifier = modifier || ['val', 1];
        this.consequences.push([expression, [operator, expression, modifier]]);
    }
    if (operator === '-') {
        this.conditions.push(['>=', expression, modifier]);
    }
    if (operator === '?') {
        this.conditions.push(expression);
    }
    if (operator === 'keyword') {
        this.keywords[expression] = true;
    }
    return this;
};

MaybeOption.prototype.advance = function advance() {
    if (this.descended) {
        this.at = Path.next(this.at);
    } else {
        this.at = Path.firstChild(this.at);
        this.descended = true;
    }
};

MaybeOption.prototype.option = function option(scanner) {
    var variable = Path.toName(this.path);
    var ends = [];

    tie(this.ends, this.at);

    if (this.leader === '*') {
        this.consequences.push([['get', variable], ['+', ['get', variable], ['val', 1]]]);
        var jump = this.story.create(this.at, 'jump', ['<>', ['get', variable], ['val', 0]], scanner.position());
        var jumpBranch = new Branch(jump);
        ends.push(jumpBranch);
        this.advance();
        tie([jump], this.at);
    }

    for (var i = 0; i < this.conditions.length; i++) {
        var condition = this.conditions[i];
        var jump = this.story.create(this.at, 'jump', ['==', condition, ['val', 0]], scanner.position());
        var jumpBranch = new Branch(jump);
        ends.push(jumpBranch);
        this.advance();
        tie([jump], this.at);
    }

    var option = new Option(this.story, this.path, this.parent, ends, this.jumps, this.leader, this.consequences);
    option.node = this.story.create(this.at, 'option', null, scanner.position());
    option.node.keywords = Object.keys(this.keywords).sort();
    this.advance();

    option.next = this.at;
    return option.thread(scanner,
        new OptionThread(this.story, this.at, option, [], option, 'qa', AfterInitialQA));
};

// Captures <keyword> annotations on options.
function Keyword(parent) {
    this.parent = parent;
    this.keyword = '';
    this.space = '';
}

Keyword.prototype.next = function next(type, space, text, scanner) {
    if (text === '>') {
        return this.parent.return('keyword', this.keyword, null, scanner);
    }
    this.keyword += (this.space && space) + text;
    this.space = ' ';
    return this;
};

// {+x}, {-x}, or {(x)}
function OptionOperator(story, parent) {
    this.story = story;
    this.parent = parent;
    Object.freeze(this);
}

OptionOperator.prototype.next = function next(type, space, text, scanner) {
    if (text === '+' || text === '-') {
        return expression(this.story,
            new OptionArgument(this.story, this.parent, text));
    // istanbul ignore else
    } else {
        return expression(this.story,
            new OptionArgument2(this.story, this.parent, '?'))
                .next(type, space, text, scanner);
    }
};

function OptionArgument(story, parent, operator) {
    this.story = story;
    this.parent = parent;
    this.operator = operator;
    Object.freeze(this);
}

OptionArgument.prototype.return = function _return(args, scanner) {
    if (args[0] === 'get' || args[0] === 'var') {
        return this.parent.return(this.operator, args, this.args, scanner);
    } else {
        return expression(this.story,
            new OptionArgument2(this.story, this.parent, this.operator, args));
    }
};

function OptionArgument2(story, parent, operator, args) {
    this.story = story;
    this.parent = parent;
    this.operator = operator;
    this.args = args;
    Object.freeze(this);
}

OptionArgument2.prototype.return = function _return(args, scanner) {
    return this.parent.return(this.operator, args, this.args, scanner);
};

function Option(story, path, parent, ends, jumps, leader, consequences) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends; // to tie off to the next option
    this.jumps = jumps; // to tie off to the next node after the next prompt
    this.node = null;
    this.leader = leader;
    this.consequences = consequences;
    this.next = null;
    this.mode = '';
    this.branch = null;
    Object.seal(this);
}

Option.prototype.return = function _return(path, ends, jumps, scanner) {
    // Create a jump from the end of the answer.
    if (this.mode !== 'a') {
        // If the answer is reused in the question, create a dedicated jump and
        // add it to the end of the answer.
        var jump = this.story.create(path, 'goto', null, scanner.position());
        this.node.answer.push(Path.toName(path));
        path = Path.next(path);
        ends = [jump];
    }

    return this.parent.return(
        Path.next(this.path),
        this.ends.concat([this.node]),
        this.jumps.concat(ends, jumps),
        scanner
    );
};

Option.prototype.thread = function thread(scanner, parent) {
    // Creat a dummy node, to replace if necessary, for arcs that begin with a
    // goto/divert arrow that otherwise would have loose ends to forward.
    var placeholder = this.story.create(this.next, 'goto', null, scanner.position());
    return new Thread(this.story, this.next, parent, [placeholder], []);
};

Option.prototype.push = function push(path, mode) {
    var start = Path.toName(this.next);
    var end = Path.toName(path);
    if (start !== end) {
        if (mode === 'q' || mode === 'qa') {
            this.node.question.push(start);
        }
        if (mode === 'a' || mode === 'qa') {
            this.node.answer.push(start);
        }
        this.next = path;
        this.mode = mode;
    }
};

// An option thread captures the end of an arc, and if the path has advanced,
// adds that arc to the option's questions and/or answer depending on the
// "mode" ("q", "a", or "qa") and proceeds to the following state.
function OptionThread(story, path, parent, ends, option, mode, Next) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    this.mode = mode;
    this.Next = Next;
    Object.freeze(this);
}

OptionThread.prototype.return = function _return(path, ends, jumps, scanner) {
    this.option.push(path, this.mode);
    return new this.Next(this.story, path, this.parent, ends, this.option);
};

// Every option begins with a (potentially empty) thread before the first open
// backet that will contribute both to the question and the answer.
function AfterInitialQA(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    Object.freeze(this);
}

AfterInitialQA.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore else
    if (type === 'token' && text === '[') {
        return this.option.thread(scanner, new AfterQorA(this.story, this.path, this, this.ends, this.option));
    } else {
        this.story.error('Expected brackets in option at ' + scanner.position());
        return this.return(this.path, this.ends, this.jumps, scanner);
    }
};

// The thread returns to this level after capturing the bracketed terms, after
// which anything and everything to the end of the block contributes to the
// answer.
AfterInitialQA.prototype.return = function _return(path, ends, jumps, scanner) {
    ends = [];

    // Thread consequences, including incrementing the option variable name
    var consequences = this.option.consequences;
    if (consequences.length) {
        this.option.node.answer.push(Path.toName(path));
    }
    for (var i = 0; i < consequences.length; i++) {
        var consequence = consequences[i];
        var node = this.story.create(path, 'move', null, scanner.position());
        node.source = consequence[1];
        node.target = consequence[0];
        tie(ends, path);
        path = Path.next(path);
        ends = [node];
    }

    this.option.next = path;
    return this.option.thread(scanner,
        new OptionThread(this.story, path, this.parent, ends, this.option, 'a', AfterFinalA));
};

// After capturing the first arc within brackets, which may either contribute
// to the question or the answer, we decide which based on whether there is a
// following bracket.
function DecideQorA(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    Object.freeze(this);
}

DecideQorA.prototype.next = function next(type, space, text, scanner) {
    if (type === 'token' && text === '[') { // A
        this.option.push(this.path, 'a');
        return this.option.thread(scanner,
            new OptionThread(this.story, this.path, this, this.ends, this.option, 'q', ExpectFinalBracket));
    // istanbul ignore else
    } else if (type === 'token' && text === ']') { // Q
        this.option.push(this.path, 'q');
        return this.parent.return(this.path, this.ends, [], scanner);
    } else {
        this.story.error('Expected a bracket, either [ or ], at ' + scanner.position());
        return this.parent.return(this.path, this.ends, [], scanner);
    }
};

// If the brackets contain a sequence of question thread like [A [Q] QA [Q]
// QA...], then after each [question], we return here for continuing QA arcs.
DecideQorA.prototype.return = function _return(path, ends, jumps, scanner) {
    return this.option.thread(scanner,
        new OptionThread(this.story, path, this.parent, ends, this.option, 'qa', AfterQA));
};

// After a Question/Answer thread, there can always be another [Q] thread
// ad nauseam. Here we check whether this is the end of the bracketed
// expression or continue after a [Question].
function AfterQA(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    Object.freeze(this);
}

AfterQA.prototype.next = function next(type, space, text, scanner) {
    if (type === 'token' && text === '[') {
        return this.option.thread(scanner,
            new OptionThread(this.story, this.path, this, this.ends, this.option, 'q', ExpectFinalBracket));
    // istanbul ignore else
    } else  if (type === 'token' && text === ']') {
        return this.parent.return(this.path, this.ends, [], scanner);
    } else {
        this.story.error('Expected either [ or ] bracket at ' + scanner.position());
        return this.parent.return(this.path, this.ends, [], scanner);
    }
};

AfterQA.prototype.return = function _return(path, ends, jumps, scanner) {
    return this.option.thread(scanner,
        new OptionThread(this.story, this.path, this.parent, ends, this.option, 'qa', ExpectFinalBracket));
};

// The bracketed terms may either take the form [Q] or [A, ([Q] QA)*].
// This captures the first arc without committing to either Q or A until we
// know whether it is followed by a bracketed term.
function AfterQorA(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    Object.freeze(this);
}

// Just capture the path and proceed.
AfterQorA.prototype.return = function _return(path, ends, jumps, scanner) {
    return new DecideQorA(this.story, path, this.parent, ends, this.option);
};

// After a [Q] or [A [Q] QA...] block, there must be a closing bracket and we
// return to the parent arc of the option.
function ExpectFinalBracket(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.option = option;
    Object.freeze(this);
}

ExpectFinalBracket.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore if
    if (type !== 'token' || text !== ']') {
        this.story.error('Expected close bracket in option at ' + scanner.position());
    }
    return this.parent.return(this.path, this.ends, [], scanner);
};

// After the closing bracket in an option], everything that remains is the last
// node of the answer. After that thread has been submitted, we expect the
// block to end.
function AfterFinalA(story, path, parent, ends, option) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    Object.freeze(this);
}

AfterFinalA.prototype.next = function next(type, space, text, scanner) {
    return this.parent.return(this.path, this.ends, [], scanner)
        .next(type, space, text, scanner);
};

// This concludes the portion dedicated to parsing options

function Branch(node) {
    this.node = node;
    Object.freeze(this);
}

Branch.prototype.tie = function tie(path) {
    this.node.branch = path;
};

function Label(story, path, parent, ends) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    Object.freeze(this);
}

Label.prototype.return = function _return(expression, scanner) {
    if (expression[0] === 'get') {
        var label = expression[1];
        var path = [label, 0];
        // place-holder goto thunk
        var node = this.story.create(path, 'goto', null, scanner.position());
        tie(this.ends, path);
        // ends also forwarded so they can be tied off if the goto is replaced.
        return this.parent.return(path, this.ends.concat([node]), [], scanner);
    // istanbul ignore else
    } else if (expression[0] === 'call') {
        var label = expression[1][1];
        var path = [label, 0];
        var node = this.story.create(path, 'args', null, scanner.position());
        var params = [];
        for (var i = 2; i < expression.length; i++) {
            var arg = expression[i];
            // istanbul ignore else
            if (arg[0] === 'get') {
                params.push(arg[1]);
            } else {
                this.story.error('Expected parameter name, not expression ' + JSON.stringify(arg) + ' at ' + scanner.position());
            }
        }
        node.locals = params;
        return new Thread(this.story, Path.next(path),
            new ConcludeProcedure(this.story, this.path, this.parent, this.ends),
            [node], []);
    } else {
        this.story.error('Expected label after @, got ' + JSON.stringify(expression) + ' at ' + scanner.position());
        return new Thread(this.story, this.path, this.parent, this.ends, []);
    }
};

function ConcludeProcedure(story, path, parent, ends) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    Object.freeze(this);
};

ConcludeProcedure.prototype.return = function _return(path, ends, jumps, scanner) {
    // After a procedure, connect prior ends.
    // Leave loose end of procedure dangling.
    return this.parent.return(this.path, this.ends, [], scanner);
};

function Goto(story, path, parent, ends, jumps) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
}

Goto.prototype.return = function _return(args, scanner) {
    // istanbul ignore else
    if (args[0] === 'get') {
        tieName(this.ends, args[1]);
        return this.parent.return(Path.next(this.path), [], [], scanner);
    } else if (args[0] === 'call') {
        var label = args[1][1];
        var node = this.story.create(this.path, 'call', label, scanner.position());
        node.args = args.slice(2);
        tie(this.ends, this.path);
        return this.parent.return(Path.next(this.path), [node], [], scanner);
    } else {
        this.story.error('Expected label after goto arrow, got expression ' + JSON.stringify(args) + ' at ' + scanner.position());
        return new Thread(this.story, this.path, this.parent, this.ends, []);
    }
};

function Block(story, path, parent, ends) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
}

var mutators = {
    '=': true,
    '+': true,
    '-': true,
    '*': true,
    '/': true,
};

var variables = {
    '@': 'loop',
    '#': 'hash',
    '^': 'pick'
};

var switches = {
    '&': 'loop',
    '~': 'rand'
};

Block.prototype.next = function next(type, space, text, scanner) {
    if (type === 'symbol' || type === 'alphanum' || type === 'token') {
        if (text === '(') {
            return expression(this.story, new ExpressionBlock(this.story, this.path, this.parent, this.ends, 'walk'))
                .next(type, space, text, scanner);
        } else if (mutators[text]) {
            return expression(this.story, new SetBlock(this.story, this.path, this.parent, this.ends, text));
        } else if (variables[text]) {
            return expression(this.story, new ExpressionBlock(this.story, this.path, this.parent, this.ends, variables[text]));
        } else if (text === '!') {
            return new Program(this.story, this.path, this.parent, this.ends, []);
        } else if (switches[text]) {
            return new SwitchBlock(this.story, this.path, this.parent, this.ends)
                .start(scanner, null, Path.toName(this.path), null, switches[text]);
        }
    }
    return new SwitchBlock(this.story, this.path, this.parent, this.ends)
        .start(scanner, null, Path.toName(this.path), 1, 'walk') // with variable and value, waiting for case to start
        .next(type, space, text, scanner);
};

function SetBlock(story, path, parent, ends, op) {
    this.op = op;
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
}

SetBlock.prototype.return = function _return(expression, scanner) {
    return new MaybeSetVariable(this.story, this.path, this.parent, this.ends, this.op, expression);
};

function MaybeSetVariable(story, path, parent, ends, op, expression) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.op = op;
    this.expression = expression;
}

MaybeSetVariable.prototype.next = function next(type, space, text, scanner) {
    if (type === 'token' && text === '}') {
        return this.set(['val', 1], this.expression, scanner)
            .next(type, space, text, scanner);
    }
    return expression(this.story, this)
        .next(type, space, text, scanner);
};

MaybeSetVariable.prototype.set = function set(source, target, scanner) {
    var node = this.story.create(this.path, 'move', null, scanner.position());
    if (this.op === '=') {
        node.source = source;
    } else {
        node.source = [this.op, target, source];
    }
    node.target = target;
    tie(this.ends, this.path);
    return this.parent.return(Path.next(this.path), [node], [], scanner);
};

MaybeSetVariable.prototype.return = function _return(target, scanner) {
    return this.set(this.expression, target, scanner);
};

function ExpressionBlock(story, path, parent, ends, mode) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.mode = mode;
}

ExpressionBlock.prototype.return = function _return(expression, scanner) {
    return new AfterExpressionBlock(this.story, this.path, this.parent, this.ends, this.mode, expression);
};

function AfterExpressionBlock(story, path, parent, ends, mode, expression) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.mode = mode;
    this.expression = expression;
    Object.freeze(this);
}

AfterExpressionBlock.prototype.next = function next(type, space, text, scanner) {
    if (text === '|') {
        return new SwitchBlock(this.story, this.path, this.parent, this.ends)
            .start(scanner, this.expression, null, 0, this.mode);
    } else if (text === '?') {
        return new SwitchBlock(this.story, this.path, this.parent, this.ends)
            .start(scanner, expression.invert(this.expression), null, 0, this.mode, 2);
    // istanbul ignore else
    } else if (text === '}') {
        var node = this.story.create(this.path, 'echo', this.expression, scanner.position());
        tie(this.ends, this.path);
        return this.parent.return(Path.next(this.path), [node], [], scanner)
            .next(type, space, text, scanner);
    } else {
        this.story.error('Expected |, ?, or } after expression, got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent.return(this.path, [], [], scanner)
            .next(type, space, text, scanner);
    }
};

function SwitchBlock(story, path, parent, ends) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.node = null;
    this.branches = [];
    this.weights = [];
}

SwitchBlock.prototype.start = function start(scanner, expression, variable, value, mode, min) {
    value = value || 0;
    if (mode === 'loop' && !expression) {
        value = 1;
    }
    expression = expression || ['get', Path.toName(this.path)];
    var node = this.story.create(this.path, 'switch', expression, scanner.position());
    this.node = node;
    node.variable = variable;
    node.value = value;
    node.mode = mode;
    tie(this.ends, this.path);
    node.branches = this.branches;
    node.weights = this.weights;
    return new MaybeWeightedCase(this.story, new Case(this.story, Path.firstChild(this.path), this, [], this.branches, min || 0));
};

SwitchBlock.prototype.return = function _return(path, ends, jumps, scanner) {
    if (this.node.mode === 'pick') {
        ends = [this.node];
        // TODO think about what to do with jumps.
    }
    return this.parent.return(Path.next(this.path), ends, jumps, scanner);
};

function Case(story, path, parent, ends, branches, min) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.branches = branches;
    this.min = min;
    Object.freeze(this);
}

Case.prototype.next = function next(type, space, text, scanner) {
    if (text === '|') {
        return new MaybeWeightedCase(this.story, this);
    } else {
        var path = this.path;
        while (this.branches.length < this.min) {
            var node = this.story.create(path, 'goto', null, scanner.position());
            this.ends.push(node);
            this.branches.push(Path.toName(path));
            path = Path.next(path);
        }
        return this.parent.return(path, this.ends, [], scanner)
            .next(type, space, text, scanner);
    }
};

Case.prototype.case = function _case(args, scanner) {
    this.parent.weights.push(args || ['val', 1]);
    var path = Path.zerothChild(this.path);
    var node = this.story.create(path, 'goto', null, scanner.position());
    this.branches.push(Path.toName(path));
    return new Thread(this.story, path, this, [node], []);
};

Case.prototype.return = function _return(path, ends, jumps, scanner) {
    return new Case(this.story, Path.next(this.path), this.parent, this.ends.concat(ends, jumps), this.branches, this.min);
};

function MaybeWeightedCase(story, parent) {
    this.story = story;
    this.parent = parent;
}

MaybeWeightedCase.prototype.next = function next(type, space, text, scanner) {
    if (text === '(') {
        return expression(this.story, this)
            .next(type, space, text, scanner);
    } else {
        return this.parent.case(null, scanner)
            .next(type, space, text, scanner);
    }
};

MaybeWeightedCase.prototype.return = function _return(args, scanner) {
    return this.parent.case(args, scanner);
};

function Program(story, path, parent, ends, jumps) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    Object.freeze(this);
}

Program.prototype.next = function next(type, space, text, scanner) {
    if (type === 'stop' || text === '}') {
        return this.parent.return(this.path, this.ends, this.jumps, scanner)
            .next(type, space, text, scanner);
    } else if (text === ',' || type === 'break') {
        return this;
    // istanbul ignore if
    } else if (type === 'error') {
        // Break out of recursive error loops
        return this.parent.return(this.path, this.ends, this.jumps, scanner);
    } else {
        return expression.variable(this.story, new Assignment(this.story, this.path, this, this.ends, this.jumps))
            .next(type, space, text, scanner);
    }
};

Program.prototype.return = function _return(path, ends, jumps, scanner) {
    return new Program(this.story, path, this.parent, ends, jumps);
};

function Assignment(story, path, parent, ends, jumps) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    Object.freeze(this);
}

Assignment.prototype.return = function _return(expression, scanner) {
    // istanbul ignore else
    if (expression[0] === 'get' || expression[0] === 'var') {
        return new ExpectOperator(this.story, this.path, this.parent, this.ends, this.jumps, expression);
    } else {
        this.story.error('Expected variable to assign, got: ' + JSON.stringify(expression) + ' at ' + scanner.position());
        return this.parent.return(this.path, this.ends, this.jumps, scanner)
            .next('error', '', '', scanner);
    }
};

function ExpectOperator(story, path, parent, ends, jumps, left) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.left = left;
    Object.freeze(this);
}

ExpectOperator.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore else
    if (text === '=') {
        return expression(this.story, new ExpectExpression(this.story, this.path, this.parent, this.ends, this.jumps, this.left, text));
    } else {
        this.story.error('Expected = operator, got ' + type + '/' + text + ' at ' + scanner.position());
        return this.parent.return(this.path, this.ends, this.jumps, scanner);
    }
};

function ExpectExpression(story, path, parent, ends, jumps, left, operator) {
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    this.left = left;
    this.operator = operator;
}

ExpectExpression.prototype.return = function _return(right, scanner) {
    var node;
    // TODO validate this.left as a valid move target
    tie(this.ends, this.path);
    node = this.story.create(this.path, 'move', null, scanner.position());
    node.target = this.left;
    node.source = right;
    return this.parent.return(Path.next(this.path), [node], this.jumps, scanner);
};

function ThenExpect(expect, text, story, parent) {
    this.expect = expect;
    this.text = text;
    this.story = story;
    this.parent = parent;
    Object.freeze(this);
}

ThenExpect.prototype.return = function _return(path, ends, jumps, scanner) {
    return new Expect(this.expect, this.text, this.story, path, this.parent, ends, jumps);
};

function Expect(expect, text, story, path, parent, ends, jumps) {
    this.expect = expect;
    this.text = text;
    this.story = story;
    this.path = path;
    this.parent = parent;
    this.ends = ends;
    this.jumps = jumps;
    Object.freeze(this);
}

Expect.prototype.next = function next(type, space, text, scanner) {
    // istanbul ignore if
    if (type !== this.expect || text !== this.text) {
        this.story.error('Expected ' + this.expect + '/' + this.text + ', got ' + type + '/' + text + ' at ' + scanner.position());
    }
    return this.parent.return(this.path, this.ends, this.jumps, scanner);
};

function tie(ends, next) {
    var name = Path.toName(next);
    tieName(ends, name);
}

function tieName(ends, name) {
    for (var i = 0; i < ends.length; i++) {
        var end = ends[i];
        end.tie(name);
    }
}

}],["inline-lexer.js","kni","inline-lexer.js",{},function (require, exports, module, __filename, __dirname){

// kni/inline-lexer.js
// -------------------

'use strict';

// Receives a stream of start, stop, and text tokens from an outline lexer and
// produces a more comprehensive stream of tokens by breaking text tokens into
// constituent text and operator tokens.
// For example, "= hi -> hi" would break into four tokens.
//
// The token stream ultimately drives a parser state machine.
// The `next` method of the parse state must return another parse state.
// Each parse state must capture the syntax tree and graph of incomplete parse
// states.
// The final parse state captures the entire syntax tree.

module.exports = InlineLexer;

var debug = typeof process === 'object' && process.env.DEBUG_INLINE_LEXER;

var L1 = '@[]{}|/<>';
var L2 = ['->', '<-', '==', '<>', '>=', '<=', '{"', '"}', '{\'', '\'}', '//', '**'];
var num = /\d/;
var space = /\s/;
// alphanumerics including non-english
var alpha = /[\w\u00C0-\u1FFF\u2C00-\uD7FF\d_]/;

function InlineLexer(generator) {
    this.generator = generator;
    this.space = '';
    this.accumulator = '';
    this.type = 'symbol';
    this.debug = debug;
    Object.seal(this);
}

InlineLexer.prototype.next = function next(type, text, scanner) {
    // istanbul ignore if
    if (this.debug) {
        console.log('ILL', type, JSON.stringify(text));
    }

    if (type !== 'text') {
        this.flush();
        this.generator.next(type, ' ', text, scanner);
        this.space = '';
        return this;
    }

    var wrap = false;
    for (var i = 0; i < text.length - 1; i++) {
        var c = text[i];
        var d = text[i + 1];
        var cd = c + d;
        var numeric = num.test(c);
        var alphanum = alpha.test(c);
        if (c === ' ' || c === '\t') {
            this.flush(scanner);
            this.space = ' ';
        } else if (cd === '\\ ') {
            // Scan forward to end of line until encountering a non-space
            // character.
            for (i = i + 2; i < text.length; i++) {
                c = text[i];
                if (c !== ' ' && c !== '\t') {
                    i--;
                    break;
                }
            }
            if (i === text.length) {
                // If everything after \ is whitespace, then treat it as if
                // there is no whitespace, meaning that the \ means continue
                // through next line.
                wrap = true;
            } else {
                // Otherwise, treat all following space as a single space.
                this.flush(scanner);
                this.generator.next('literal', '', ' ', scanner);
                this.space = '';
            }
        } else if (c === '\\') {
            // TODO account for escaped space through to the end of line
            this.flush(scanner);
            this.generator.next('literal', this.space, d, scanner);
            this.space = '';
            i++;
        } else if (L2.indexOf(cd) >= 0) {
            this.flush(scanner);
            this.generator.next('token', this.space, cd, scanner);
            this.space = '';
            i++;
        } else if (L1.indexOf(c) >= 0) {
            this.flush(scanner);
            this.generator.next('token', this.space, c, scanner);
            this.space = '';
        } else if (cd === '--') {
            this.flush(scanner);
            for (var j = i + 2; j < text.length; j++) {
                c = text[j];
                if (c !== '-') {
                    break;
                }
            }
            this.generator.next('dash', this.space, text.slice(i, j), scanner);
            i = j - 1;
        } else if (this.type !== 'alphanum' && numeric) {
            if (this.type != 'number') {
                this.flush(scanner);
            }
            this.accumulator += c;
            this.type = 'number';
        } else if (alphanum) {
            if (this.type != 'alphanum') {
                this.flush(scanner);
            }
            this.accumulator += c;
            this.type = 'alphanum';
        } else {
            this.flush(scanner);
            this.generator.next(this.type, this.space, c, scanner);
            this.space = '';
        }
    }

    if (i < text.length) {
        var c = text[i];
        var numeric = num.test(c);
        var alphanum = alpha.test(c);
        if (c === '\\') {
            wrap = true;
        } else if (c === ' ' || c === '\t') {
            // noop
        } else if (L1.indexOf(c) >= 0) {
            this.flush(scanner);
            this.generator.next('token', this.space, c, scanner);
        } else if (this.type !== 'alphanum' && numeric) {
            if (this.type !== 'number') {
                this.flush(scanner);
            }
            this.accumulator += c;
            this.type = 'number';
        } else if (!alphanum) {
            this.flush(scanner);
            this.generator.next(this.type, this.space, c, scanner);
        } else {
            this.type = 'alphanum';
            this.accumulator += c;
        }
    }

    if (!wrap) {
        this.flush(scanner);
        this.space = ' ';
    }
    return this;
};

InlineLexer.prototype.flush = function flush(scanner) {
    if (this.accumulator) {
        this.generator.next(this.type, this.space, this.accumulator, scanner);
        this.accumulator = '';
        this.space = '';
        this.type = 'symbol';
    }
};

}],["outline-lexer.js","kni","outline-lexer.js",{},function (require, exports, module, __filename, __dirname){

// kni/outline-lexer.js
// --------------------

'use strict';

// Transforms a stream of lines with known indentation levels and leaders like
// bullets, and transforms these into a stream of lines with start and stop
// tokens around changes in indentation depth.
//
// The outline lexer receives lines from a scanner and sends start, stop, and
// text lines to an inline lexer.

// TODO remove the break emission feature

module.exports = OutlineLexer;

var debug = typeof process === 'object' && process.env.DEBUG_OUTLINE_LEXER;

function OutlineLexer(generator) {
    this.generator = generator;
    this.top = 0;
    this.stack = [this.top];
    this.broken = false;
    this.debug = debug;
}

OutlineLexer.prototype.next = function next(line, scanner) {
    // istanbul ignore if
    if (this.debug) {
        console.error(
            'OLL', scanner.position(),
            JSON.stringify(line),
            'indent', scanner.indent,
            'leader', JSON.stringify(scanner.leader),
            'stack', this.stack,
            'top', this.top
        );
    }
    while (scanner.indent < this.top) {
        this.generator = this.generator.next('stop', '', scanner);
        this.stack.pop();
        this.top = this.stack[this.stack.length - 1];
    }
    if (scanner.leader.length !== 0 && scanner.indent > this.top) {
        this.generator = this.generator.next('start', scanner.leader, scanner);
        this.stack.push(scanner.indent);
        this.top = scanner.indent;
        this.broken = false;
    } else if (scanner.leader.length !== 0 && scanner.indent === this.top) {
        this.generator = this.generator.next('stop', '', scanner);
        this.generator = this.generator.next('start', scanner.leader, scanner);
        this.top = scanner.indent;
        this.broken = false;
    }
    if (line.length) {
        this.generator = this.generator.next('text', line, scanner);
    } else if (!this.broken) {
        this.broken = true;
        this.generator = this.generator.next('break', '', scanner);
    }
    return this;
};

OutlineLexer.prototype.return = function _return(scanner) {
    for (var i = 0; i < this.stack.length; i++) {
        this.generator = this.generator.next('stop', '', scanner);
    }
    this.stack.length = 0;
    return this;
};

}],["parser.js","kni","parser.js",{},function (require, exports, module, __filename, __dirname){

// kni/parser.js
// -------------

'use strict';

module.exports = Parser;

var debug = typeof process === 'object' && process.env.DEBUG_PARSER;

function Parser(generator) {
    this.generator = generator;
    this.debug = debug;
}

Parser.prototype.next = function next(type, space, text, scanner) {
    var prior = this.generator.constructor.name;
    this.generator = this.generator.next(type, space, text, scanner);
    // istanbul ignore if
    if (!this.generator) {
        throw new Error(prior + ' returned undefined next state given ' + type + '/' + text + ' at ' + scanner.position());
    }
    // istanbul ignore if
    if (this.debug) {
        console.error(
            'PAR',
            scanner.position(),
            type, JSON.stringify(text),
            prior + '->' + this.generator.constructor.name
        );
    }
    return this;
};

}],["path.js","kni","path.js",{},function (require, exports, module, __filename, __dirname){

// kni/path.js
// -----------

'use strict';

exports.start = start;

function start() {
    return ['start'];
}

exports.toName = pathToName;

function pathToName(path) {
    var name = path[0];
    var i;
    for (i = 1; i < path.length - 1; i++) {
        name += '.' + path[i];
    }
    var last = path[i];
    if (path.length > 1 && last !== 0) {
        name += '.' + last;
    }
    return name;
}

exports.next = nextPath;

function nextPath(path) {
    path = path.slice();
    path[path.length - 1]++;
    return path;
}

exports.firstChild = firstChildPath;

function firstChildPath(path) {
    path = path.slice();
    path.push(1);
    return path;
}

exports.zerothChild = zerothChildPath;

function zerothChildPath(path) {
    path = path.slice();
    path.push(0);
    return path;
}

}],["scanner.js","kni","scanner.js",{},function (require, exports, module, __filename, __dirname){

// kni/scanner.js
// --------------

'use strict';

// Transforms a stream of text into a sequence of 'lines', tracking each line's
// level of indentation.
// Trims lines.
// Stips comments.
//
// The scanner feeds into an outline lexer.

var tabWidth = 4;
var leaders = '-+*!>';
var debug = typeof process === 'object' && process.env.DEBUG_SCANNER;

module.exports = Scanner;

function Scanner(generator) {
    this.generator = generator;
    this.indent = 0;
    this.lineStart = 0;
    this.indentStart = 0;
    this.itemStart = 0;
    this.lineNo = 0;
    this.columnNo = 0;
    this.leading = true;
    this.leader = '';
    this.debug = debug;
}

Scanner.prototype.next = function next(text) {
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        var d = text[i + 1];
        // istanbul ignore if
        if (this.debug) {
            console.error('SCN', this.position() + ':' + i, JSON.stringify(c + (d || '')));
        }
        if (
            ((c === '\t' || c === ' ') && d === '#') ||
            (this.columnNo === 0 && c === '#')
        ) {
            this.newLine(text, i);
            for (i++; i < text.length; i++) {
                c = text[i];
                if (c === '\n') {
                    break;
                }
            }
        } else if (c === '\t') {
            this.columnNo = nextTabStop(this.columnNo);
        } else if (c === '\n') {
            this.newLine(text, i);
        } else if (c === ' ') {
            this.columnNo++;
        } else if (
            this.leading && leaders.indexOf(c) >= 0 &&
            (d === ' ' || d === '\t')
        ) {
            this.leader += c;
            this.columnNo++;
        } else if (this.leading && leaders.indexOf(c) >= 0 && d === '\n') {
            this.leader += c;
            this.indentStart = i;
            this.columnStart = this.columnNo;
            this.lineStart = this.lineNo;
            this.indent = this.columnNo + 2;
        } else if (this.leading) {
            this.indent = this.columnNo;
            this.indentStart = i;
            this.columnStart = this.columnNo;
            this.lineStart = this.lineNo;
            this.columnNo++;
            this.leading = false;
        }
    }

    if (!this.leading) {
        this.generator.next(text.slice(this.indentStart, i), this);
    }
};

Scanner.prototype.newLine = function newLine(text, i) {
    if (this.leading) {
        this.indentStart = i;
    }
    this.leading = true;
    this.generator.next(text.slice(this.indentStart, i), this);
    this.columnNo = 0;
    this.lineNo++;
    this.lineStart = i + 1;
    this.leader = '';
};

Scanner.prototype.return = function _return() {
    this.generator.return(this);
};

// istanbul ignore next
Scanner.prototype.position = function position() {
    return (this.lineStart + 1) + ':' + (this.columnStart + 1);
};

function nextTabStop(columnNo) {
    // TODO simplify with modulo arithmetic
    return Math.floor((columnNo + tabWidth) / tabWidth) * tabWidth;
}

}],["story.js","kni","story.js",{"./path":10},function (require, exports, module, __filename, __dirname){

// kni/story.js
// ------------

'use strict';

var Path = require('./path');

var constructors = {};

module.exports = Story;

function Story() {
    this.states = {};
    this.errors = [];
    Object.seal(this);
}

Story.constructors = constructors;

Story.prototype.create = function create(path, type, arg, position) {
    var name = Path.toName(path);
    var Node = constructors[type];
    // istanbul ignore if
    if (!Node) {
        throw new Error('No node constructor for type: ' + type);
    }
    var node = new Node(arg);
    node.position = position;
    this.states[name] = node;
    return node;
};

// istanbul ignore next
Story.prototype.error = function _error(error) {
    this.errors.push(error);
};

constructors.text = Text;
function Text(text) {
    this.type = 'text';
    this.text = text;
    this.lift = ' ';
    this.drop = ' ';
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Text.prototype.tie = tie;

constructors.echo = Echo;
function Echo(expression) {
    this.type = 'echo';
    this.expression = expression;
    this.lift = '';
    this.drop = '';
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Echo.prototype.tie = tie;

constructors.option = Option;
function Option(label) {
    this.type = 'opt';
    this.question = [];
    this.answer = [];
    this.keywords = null;
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Option.prototype.tie = tie;

constructors.goto = Goto;
function Goto(next) {
    this.type = 'goto';
    this.next = next || null;
    this.position = null;
    Object.seal(this);
}
Goto.prototype.tie = tie;

constructors.call = Call;
function Call(branch) {
    this.type = 'call';
    this.branch = branch;
    this.args = null;
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Call.prototype.tie = tie;

constructors.args = Args;
function Args(locals) {
    this.type = 'args';
    this.locals = locals;
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Args.prototype.tie = tie;

constructors.jump = Jump;
function Jump(condition) {
    this.type = 'jump';
    this.condition = condition;
    this.branch = null;
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Jump.prototype.tie = tie;

constructors.switch = Switch;
function Switch(expression) {
    this.type = 'switch';
    this.expression = expression;
    this.variable = null;
    this.value = 0;
    this.mode = null;
    this.branches = [];
    this.weights = [];
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Switch.prototype.tie = tie;

constructors.move = Move;
function Move() {
    this.type = 'move';
    this.source = null;
    this.target = null;
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Move.prototype.tie = tie;

constructors.break = Break;
function Break() {
    this.type = 'br';
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Break.prototype.tie = tie;

constructors.paragraph = Paragraph;
function Paragraph() {
    this.type = 'par';
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Paragraph.prototype.tie = tie;

constructors.rule = Rule;
function Rule() {
    this.type = 'rule';
    this.next = null;
    this.position = null;
    Object.seal(this);
}
Rule.prototype.tie = tie;

constructors.ask = Ask;
function Ask(variable) {
    this.type = 'ask';
    this.position = null;
    Object.seal(this);
}
Ask.prototype.tie = tie;

function tie(end) {
    this.next = end;
}

}],["try.js","kni","try.js",{"./console":0,"./engine":2,"./scanner":11,"./outline-lexer":8,"./inline-lexer":7,"./parser":9,"./story":12,"./grammar":6},function (require, exports, module, __filename, __dirname){

// kni/try.js
// ----------

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
});

cm.setSize("100%", "100%");

var preview = document.getElementById("preview");
var doc = new Document(preview);

var currentWaypoint = null;
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

document.getElementById("run_button").addEventListener("click", startGame);
document.getElementById("reset_button").addEventListener("click", function() {
    currentWaypoint = null;
    updateURL();
    startGame();
});
}],["wrapper.js","kni","wrapper.js",{},function (require, exports, module, __filename, __dirname){

// kni/wrapper.js
// --------------

// Wraps text at word boundaries for output to columnar displays.
// Manages levels of indentation, bullets, and margin text.
'use strict';

module.exports = Wrapper;

function Wrapper(target, width) {
    this.target = target;
    this.width = width || 60;
    this.indents = [''];
    this.leads = [''];
    this.index = 0;
    this.flush = false;
}

// istanbul ignore next
Wrapper.prototype.words = function words(words) {
    var array = words.split(' ');
    for (var i = 0; i < array.length; i++) {
        this.word(array[i]);
    }
};

Wrapper.prototype.push = function push(indent, lead) {
    var prefix = this.indents[this.indents.length - 1];
    this.indents.push(prefix + indent);
    this.leads.push(prefix + lead);
};

Wrapper.prototype.pop = function pop() {
    this.indents.pop();
    this.leads.pop();
};

Wrapper.prototype.word = function word(word) {
    var indent = this.indents[this.indents.length - 1];
    if (this.index === 0) {
        this.target.write(indent);
        this.index += indent.length;
        this.flush = true;
    }
    if (this.index + word.length + 1 > this.width) {
        this.break();
        this.target.write(indent + word);
		this.index += indent.length + word.length + 1;
        this.flush = false;
    } else if (this.flush) {
        this.target.write(word);
		this.index += word.length;
        this.flush = false;
    } else {
        this.target.write(' ' + word);
		this.index += word.length + 1;
        this.flush = false;
	}

};

Wrapper.prototype.break = function _break() {
    this.target.write('\n');
    this.index = 0;
    this.flush = true;
};

// Bring your own break, if you need it.
// istanbul ignore next
Wrapper.prototype.bullet = function bullet() {
    var lead = this.leads[this.leads.length - 1];
    this.target.write(lead);
    this.index = lead.length;
    this.flush = true;
};

}]])("kni/try.js")