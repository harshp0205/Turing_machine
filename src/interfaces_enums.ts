enum tokenType {
    NAME,
    INITIALSTATE,
    TRANSITIONFUNCTIONS,
    TAPE,
    ACCEPTINGSTATE,
}

interface from {
    currentState: string;
    currentSymbol: string;
}

interface to {
    nextState: string;
    updateSymbol: string;
    direction: "L" | "R" | "S";
}

interface transitionFunction {
    from: from;
    to: to;
}

interface token {
    type: tokenType;
    value: string | transitionFunction[];
}

export type { from, to, transitionFunction, token };
export { tokenType };
