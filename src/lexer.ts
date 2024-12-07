import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import {
    tokenType,
    from,
    to,
    token,
    transitionFunction,
} from "./interfaces_enums";

function compareObjects(
    obj1: { [key: string]: any },
    obj2: { [key: string]: any }
) {
    if (
        obj1 === null ||
        obj2 === null ||
        obj1 === undefined ||
        obj2 === undefined
    ) {
        return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

function get(transitionFunctions: transitionFunction[], obj: from) {
    for (const transition of transitionFunctions) {
        if (compareObjects(transition.from, obj)) {
            return transition.to;
        }
    }
    return null;
}

function updateTo(
    transitionFunctions: transitionFunction[],
    key: from,
    newValue: to
) {
    for (const transition of transitionFunctions) {
        if (compareObjects(transition.from, key)) {
            transition.to = newValue;
            return true;
        }
    }
    return false;
}

function tokenize(input: string): token[] {
    const tokens: token[] = [];
    const lines = input.split("\n");
    let isTransitionFunction = false;
    let transitionFunctions: transitionFunction[] = [];
    for (let lineNo in lines) {
        const line = lines[lineNo].trim();
        if (line === "") continue;
        if (countChar(line, ":") > 1) {
            throw new Error("Error in line " + lineNo + ": Invalid Syntax");
        }
        if (countChar(line, ":") < 1) {
            if (!isTransitionFunction)
                throw new Error("Error in line " + lineNo + ": Invalid Syntax");
        }
        const [key, value] = line.split(":");
        if (isTransitionFunction) {
            if (line === "}") {
                isTransitionFunction = false;
                tokens.push({
                    type: tokenType.TRANSITIONFUNCTIONS,
                    value: transitionFunctions,
                });
                continue;
            } else {
                if (line === "") continue;
                try {
                    const transition = getTransitionFunction(line);
                    const hasTransition = get(
                        transitionFunctions,
                        transition?.from as from
                    );
                    if (hasTransition) {
                        if (
                            !compareObjects(hasTransition, transition?.to as to)
                        ) {
                            Toastify({
                                text: "Overwriting transition function",
                                duration: 3000,
                                close: true,
                                gravity: "top",
                                position: "right",
                            }).showToast();
                            updateTo(
                                transitionFunctions,
                                transition?.from as from,
                                transition?.to as to
                            );
                        }
                    } else {
                        transitionFunctions.push(
                            transition as transitionFunction
                        );
                    }
                } catch (e) {
                    throw new Error(
                        "Error in line " + lineNo + ": " + (e as Error)?.message
                    );
                }
            }
        } else {
            if (key.trim() === "name") {
                if (value.trim() === "") {
                    throw new Error("Name not defined");
                }
                tokens.push({ type: tokenType.NAME, value: value.trim() });
            } else if (key.trim() === "initialState") {
                if (value.trim() === "") {
                    throw new Error("Initial State not defined");
                }
                tokens.push({
                    type: tokenType.INITIALSTATE,
                    value: value.trim(),
                });
            } else if (
                key.trim() === "transitionFunctions" &&
                value.trim() === "{"
            ) {
                isTransitionFunction = true;
                continue;
            } else if (key.trim() === "tape") {
                if (value.trim() === "") {
                    throw new Error("Tape not defined");
                }
                if (countChar(value.trim(), " ") != 0) {
                    throw new Error("Invalid Tape");
                }
                tokens.push({
                    type: tokenType.TAPE,
                    value: value.trim(),
                });
            } else if (key.trim() === "acceptingState") {
                if (value.trim() === "") {
                    throw new Error("Accepting States not defined");
                }
                if (value.trim().length === 0) {
                    throw new Error("Accepting States not defined");
                }
                if (value.trim() == "*") {
                    throw new Error("Accepting States cannot be *");
                }
                tokens.push({
                    type: tokenType.ACCEPTINGSTATE,
                    value: value.trim(),
                });
            } else {
                if (line.trim() !== "") {
                    throw new Error(
                        `Error in line ${lineNo}: ${key.trim()} not recognized`
                    );
                }
            }
        }
    }
    if (isTransitionFunction && transitionFunctions.length !== 0) {
        throw new Error(
            `Error in line ${lines.length} : Transition function not closed`
        );
    }
    return tokens;
}

function getFrom(line: string) {
    if (countChar(line, ",") !== 1)
        throw new Error("Invalid transition function Syntax");
    let str = "";
    let currentState = "";
    let currentSymbol = "";
    let space = false;
    let start = false;
    let end = false;
    while (line.length) {
        if (line[0] === "(") {
            if (start) throw new Error("Invalid transition function Syntax");
            start = true;
            line = line.slice(1);
            continue;
        }
        if (line[0] === ")") {
            if (!start) throw new Error("Invalid transition function Syntax");
            if (end) throw new Error("Invalid transition function");
            if (currentState === "" || str === "")
                throw new Error("Invalid transition function Syntax");
            end = true;
            line = line.slice(1);
            if (line.trim() !== "") {
                throw new Error("Invalid transition function Syntax");
            }
            if (str.length !== 1) {
                throw new Error("Symbol must be single character");
            }
            currentSymbol = str;
            break;
        }
        if (line[0] === ",") {
            if (!start) throw new Error("Invalid transition function Syntax");
            if (str === "") {
                throw new Error("Invalid transition function");
            }
            if (currentState !== "")
                throw new Error("Invalid transition function");
            line = line.slice(1);
            currentState = str;
            space = false;
            str = "";
            continue;
        }
        if (start) {
            if (line[0] === " ") {
                if (str !== "") space = true;
                line = line.slice(1);
                continue;
            }
            if (space) throw new Error("Invalid transition function");
            str += line[0];
            line = line.slice(1);
        } else if (line[0] === " ") {
            line = line.slice(1);
        } else {
            throw new Error("Invalid transition function");
        }
    }
    if (!start || !end || !currentState || !currentSymbol) {
        throw new Error("Invalid transition function");
    }
    return { currentState, currentSymbol };
}

function getTo(line: string) {
    if (countChar(line, ",") !== 2)
        throw new Error("Invalid transition function");
    let str = "";
    let nextState = "";
    let updateSymbol = "";
    let direction = "";
    let space = false;
    let start = false;
    let end = false;
    while (line.length) {
        if (line[0] === "(") {
            if (start) throw new Error("Invalid transition function");
            start = true;
            line = line.slice(1);
            continue;
        }
        if (line[0] === ")") {
            if (!start) throw new Error("Invalid transition function");
            if (end) throw new Error("Invalid transition function");
            if (nextState === "" || updateSymbol === "" || str === "")
                throw new Error("Invalid transition function");
            end = true;
            line = line.slice(1);
            if (line.trim() !== "") {
                throw new Error("Invalid transition function");
            }
            direction = str;
            break;
        }
        if (line[0] === ",") {
            if (!start) throw new Error("Invalid transition function");
            if (str === "") {
                throw new Error("Invalid transition function");
            }
            if (nextState !== "" && updateSymbol !== "")
                throw new Error("Invalid transition function");
            line = line.slice(1);
            if (nextState === "") {
                nextState = str;
            } else {
                if (str.length !== 1) {
                    throw new Error("Symbol must be single character");
                }
                updateSymbol = str;
            }
            space = false;
            str = "";
            continue;
        }
        if (start) {
            if (line[0] === " ") {
                if (str !== "") space = true;
                line = line.slice(1);
                continue;
            }
            if (space) throw new Error("Invalid transition function");
            str += line[0];
            line = line.slice(1);
        } else if (line[0] === " ") {
            line = line.slice(1);
        } else {
            throw new Error("Invalid transition function");
        }
    }
    if (!start || !end || !nextState || !updateSymbol || !direction) {
        throw new Error("Invalid transition function");
    }
    if (direction != "L" && direction != "R" && direction != "S") {
        throw new Error("Invalid transition function");
    }
    return { nextState, updateSymbol, direction };
}

function getTransitionFunction(line: string) {
    if (line.trim() === "") return null;
    if (countChar(line, ":") !== 1)
        throw new Error("Invalid transition function");
    let [current, next] = line.split(":");
    current = current.trim();
    next = next.trim();
    if (!current || !next) {
        throw new Error("Invalid transition function");
    }
    const from = getFrom(current);
    const to = getTo(next);
    return {
        from,
        to,
    };
}

function countChar(str: string, char: string) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === char) count++;
    }
    return count;
}

export { tokenize, get };
