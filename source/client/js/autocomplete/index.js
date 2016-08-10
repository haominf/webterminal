import {
    TYPE_WHITESPACE,
    TYPE_ID,
    TYPE_STRING,
    TYPE_CONSTANT,
    TYPE_CHAR
} from "./pushdownAutomaton";

const LEXEMES_SPLIT =
    /([\s\t]+)|([a-z]+[a-z0-9]*)|("(?:"(?=")"|[^"])*")|([0-9]*\.[0-9]+|[0-9]+)|([^])/gi;

let wrap = (a) => a,
    automaton = wrap(/* @echo autocompleteAutomaton */);

// printAutomaton(automaton);

function printAutomaton (oa) {
    if (!oa)
        return;
    let table = [];
    console.log(oa);
    for (let i in oa) {
        if (!oa[i])
            continue;
        for (let r of oa[i]) {
            table.push([+i].concat(r[0] ? (r[0].type + (r[0].value ? ` (${r[0].value})` : ""))
                : r[0]).concat(r.slice(1)));
        }
    }
    if (console.table)
        console.table(table);
}

/**
 * Split the string to the lexical parts. There are five: whitespace, id, string, constant and char.
 * @param {string} string
 * @returns {{ type: number, value: * }[]}
 */
function splitString (string) {
    let matches,
        result = [];
    while ((matches = LEXEMES_SPLIT.exec(string)) !== null) {
        for (let i = 1; i < matches.length; i++) {
            if (matches[i]) {
                result.push({ type: i, value: matches[i] });
                break;
            }
        }
    }
    LEXEMES_SPLIT.lastIndex = 0;
    return result;
}

function process (string) {
    let tape = splitString(string),
        stack = [], // holds state numbers
        tryStack = [],
        state = 1,
        pos = 0,
        maxPos = 0,
        ruleIndex = 0,
        whiteSpaceMatched = false,
        lastSucceededState = state,
        count = 0,
        MAX_LOOP = 100;
    function error () {
        if (!tryStack.length) {
            return true;
        }
        console.log(`${ state } | [${ (tape[pos] || {}).value }] Popping tryStack with`, tryStack[tryStack.length - 1]);
        let letsTry = tryStack.pop();
        state = letsTry[0];
        ruleIndex = letsTry[1] + 1;
        if (stack.length > letsTry[2]) {
            stack = stack.slice(0, letsTry[2]);
        }
        console.log(`${ state } | [${ (tape[pos] || {}).value }] Now stack is`, stack.slice());
        return false;
    }
    while (pos < tape.length && count++ < MAX_LOOP) {
        if (typeof automaton[state] === "undefined") {
            console.warn("No state", automaton[state]);
        }
        if (pos > maxPos) { // apply restriction to avoid freezing terminal in case of wrong grammar
            maxPos = pos;
            count = 0;
        }
        let ok = false;
        console.log(`${ state } | [${ tape[pos].value
            }] Begin look through the rule. [ruleIndex = ${ ruleIndex }] Stack`, stack.slice());
        for (; ruleIndex < automaton[state].length; ruleIndex++) {
            let rule = automaton[state][ruleIndex],
                lexeme = tape[pos];
            console.log(
                `${ state } | Rule [${ rule[0] }, ${ typeof rule[1] !== "undefined" ? rule[1] : "_"
                }, ${ typeof rule[2] !== "undefined" ? rule[2] : "_" }], lex =`,
                `${ lexeme.value } [ruleIndex = ${ ruleIndex }]`
            );
            if (rule[0] === null) {
                pos--;
            } else if (rule[0] === true) {
                // match all
                if (lexeme.type === TYPE_WHITESPACE)
                    whiteSpaceMatched = true;
            } else if (rule[0] === 0) { // try call
                tryStack.push([state, ruleIndex, stack.length]);
                pos--;
            } else if (rule[0].type === TYPE_WHITESPACE) {
                if (whiteSpaceMatched) {
                    pos--;
                } else {
                    if (rule[0].type !== lexeme.type)
                        continue;
                }
                whiteSpaceMatched = true;
            } else if (rule[0].type === TYPE_ID) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (typeof rule[0].value === "string") {
                    if (lexeme.value !== rule[0].value)
                        continue;
                } // when rule[0].value is object, we match any ID
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_STRING) {
                if (rule[0].type !== lexeme.type)
                    continue;
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_CONSTANT) {
                if (rule[0].type !== lexeme.type)
                    continue;
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_CHAR) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (typeof rule[0].value === "string") {
                    if (lexeme.value !== rule[0].value)
                        continue;
                } // when rule[0].value is object, we match any CHAR
                whiteSpaceMatched = false;
            }
            // ...
            console.log(`${ state } | [${ lexeme.value }] Match found [ruleIndex = ${ ruleIndex }]`);
            if (typeof rule[2] !== "undefined") {
                console.log(`${ state } | [${ lexeme.value }] Pushing ${ rule[2] } to stack [ruleIndex = ${ ruleIndex }]`);
                stack.push(rule[2]);
            }
            if (rule[1] === 0) {
                console.log(`${ state } | [${ lexeme.value }] Popping stack...`, stack.slice());
                while ((state = stack.pop()) === 0) {
                    console.log(`${ state } | [${ lexeme.value }] Still popping stack...`, stack.slice());
                }
                console.log(`${ state } | [${ lexeme.value }] Now stack is`, stack.slice());
            } else {
                state = rule[1];
                console.log(`${ state } | [${ lexeme.value }] Moving to state ${ state }`);
            }
            pos++;
            ok = true;
            break;
        }
        if (!ok) {
            console.log(
                `${ state } | [${ (tape[pos] || {}).value || "" }] Finalized, not OK; pos = ${ pos + 1 }/${ tape.length
                } [ruleIndex = ${ ruleIndex }]`
            );
            if (error()) { // not the last - predict
                if (pos + 1 < tape.length) {
                    ruleIndex = 0;
                    state = 1;
                    console.error(`No rule for`, (tape[pos] || {}).value || "", `at state ${ state }`);
                }
                pos++; // finalize to suggest
            }
        } else {
            lastSucceededState = state;
            ruleIndex = 0;
            console.log(`${ state } | [${ (tape[pos] || {}).value || "" }] Finalized, OK! [ruleIndex = ${ ruleIndex }]`);
        }
    }
    if (count >= MAX_LOOP) {
        console.error(`Statement`, tape, `looped more than ${ MAX_LOOP } times without a progress, exiting.`);
    }
    console.log(
        `Complete! My state is ${ state }. Last succeeded state is ${ lastSucceededState
        }. Stack:`, stack, `Try Stack:`, tryStack);
}

if (typeof window !== "undefined") // todo: debug
    window.process = process;