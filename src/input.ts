import { tokenType, transitionFunction } from "./interfaces_enums";
import { tokenize } from "./lexer";
import { setInitialSymbols, startScript } from "./tape";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

const textareas = document.getElementById("textarea") as HTMLTextAreaElement;
const runBtn = document.getElementById("run") as HTMLButtonElement;
const error = document.getElementById("error") as HTMLDivElement;
const exampleBtn = document.getElementById(
    "exampleScript"
) as HTMLButtonElement;

exampleBtn.addEventListener("click", () => {
    textareas.value = `name: check even length
initialState: oddPosition
acceptingState: even
tape: 1201309124
transitionFunctions: {
(evenPosition, *): (oddPosition, *, R)
(oddPosition, *): (evenPosition, *, R)
(evenPosition, _): (odd, _, S)
(oddPosition, _): (even, _, S)
}
`;
});

runBtn.addEventListener("click", () => {
    error.innerHTML = "";
    let input = textareas.value;
    setInitialSymbols("");
    try {
        let currentState: string = "";
        let transitionFunctions: transitionFunction[] = [];
        let acceptingState: string = "";
        const tokens = tokenize(input);
        // console.log(tokens);
        tokens.forEach((token) => {
            if (token.type === tokenType.NAME) {
                document.getElementById("name")!.innerHTML = `MACHINE NAME: ${
                    token.value as string
                }`;
            } else if (token.type === tokenType.INITIALSTATE) {
                document.getElementById(
                    "currentState"
                )!.innerHTML = `CURRENT STATE: ${token.value as string}`;
                currentState = token.value as string;
            } else if (token.type === tokenType.TRANSITIONFUNCTIONS) {
                transitionFunctions = token.value as transitionFunction[];
            } else if (token.type === tokenType.TAPE) {
                setInitialSymbols(token.value as string);
            } else if (token.type === tokenType.ACCEPTINGSTATE) {
                acceptingState = token.value as string;
                document.getElementById(
                    "acceptingState"
                )!.innerHTML = `ACCEPTING STATE: ${token.value as string}`;
            }
        });
        if (
            currentState === "" ||
            acceptingState === "" ||
            transitionFunctions.length === 0
        ) {
            throw new Error("Missing required fields check below for syntax");
        }
        window.scrollTo(0, 0);
        startScript(transitionFunctions, currentState, acceptingState);
    } catch (e: any) {
        const errorLine = e.message.split(":")[0];
        Toastify({
            text: errorLine as string,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "red",
        }).showToast();
        error.innerHTML = e.message;
    }
});
