import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { transitionFunction } from "./interfaces_enums";
import { get } from "./lexer";
const canvas = document.getElementById("tape") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
canvas.width = window.innerWidth - 60;

let head = 500;
let animateTimeout: number | null = null;
const tapeSpeed = 7;
const tapeLength = 1000;
const tapeNodeLength = 100;
const tape: string[] = new Array(tapeLength);
// let bufferFull = false;
const buffer: Array<"L" | "R"> = [];
let acceptingState = "";
let runTimeout: number | null = null;
for (let i = 0; i < tapeLength; i++) {
    tape[i] = "-1";
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - 60;
    while (buffer.length) buffer.pop();
    if (animateTimeout) {
        clearTimeout(animateTimeout);
    }
    drawTape();
});

function setInitialSymbols(symbol: string) {
    symbol = symbol.trim();
    for (let i = 0; i < tapeLength; i++) {
        tape[i] = "-1";
    }
    head = tapeLength / 2;
    if (symbol.length != 0) {
        for (let i = 0; i < symbol.length; i++) {
            tape[i + head] = symbol[i];
        }
    } else {
        for (let i = 0; i < tapeLength; i++) {
            tape[i] = "-1";
        }
    }
    drawTape();
}

// function checkBuffer() {
//     if (buffer.length && !animateTimeout) {
//         const dir = buffer[0];
//         if (dir === "L") {
//             // animateMovement(10, 0); // 0 is left
//         } else {
//             // animateMovement(10, 1); // 1 is right
//         }
//     } else {
//         drawTape();
//         drawHeadPointer();
//     }
// }

function drawHeadPointer() {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2 + 30);
    ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2 + 70);
    ctx.lineTo(canvas.width / 2 - 20, canvas.height / 2 + 70);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function animateMovement(
    i = 10,
    direction: number,
    state: string,
    transitionFunctions: transitionFunction[]
) {
    if (
        (i > tapeNodeLength + 20 && direction == 0) ||
        (i < -tapeNodeLength && direction == 1)
    ) {
        direction == 0 ? head-- : head++;
        animateTimeout = null;
        // buffer.shift();
        // if (buffer.length == 0) bufferFull = false;
        // checkBuffer();
        // return;
        drawTape();
        drawHeadPointer();
        document.getElementById("currentState")!.innerHTML = `CURRENT STATE: ${
            state as string
        }`;
        run(transitionFunctions, state);
        return;
    }
    if (direction == 0 && head == 0) {
        // buffer.shift();
        // if (buffer.length == 0) bufferFull = false;
        Toastify({
            text: "End of tape",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
        }).showToast();
        // checkBuffer();
        return;
    }
    if (direction == 1 && head == tape.length - 1) {
        // buffer.shift();
        // if (buffer.length == 0) bufferFull = false;
        Toastify({
            text: "End of tape",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
        }).showToast();
        // checkBuffer();
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let x = i;
    for (let i = 0; i < tapeLength; i++) {
        drawTapeNode(
            i,
            x -
                (head * (tapeNodeLength + 10) -
                    canvas.width / 2 +
                    (tapeNodeLength / 2 + 10))
        );
        x += tapeNodeLength + 10;
    }
    drawHeadPointer();
    animateTimeout = setTimeout(() => {
        requestAnimationFrame(() =>
            animateMovement(
                i + (direction === 1 ? -tapeSpeed : tapeSpeed),
                direction,
                state,
                transitionFunctions
            )
        );
    }, 10);
}

function run(transitionFunctions: transitionFunction[], currentState: string) {
    if (acceptingState == currentState) {
        Toastify({
            text: "Accepting State reached",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
        }).showToast();
        return;
    }
    let to = get(transitionFunctions, {
        currentState,
        currentSymbol: tape[head] != "-1" ? tape[head] : "_",
    });
    if (to == null) {
        to = get(transitionFunctions, {
            currentState,
            currentSymbol: "*",
        });
        if (to == null) {
            Toastify({
                text: "No transition function found Machine halts",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
            }).showToast();
            return;
        }
    }
    if (to.updateSymbol != "*") {
        tape[head] = to.updateSymbol != "_" ? to.updateSymbol : "-1";
    }
    runTimeout = setTimeout(() => {
        drawTape();
        if (to.direction == "L") {
            animateMovement(10, 0, to.nextState, transitionFunctions);
        } else if (to.direction == "R") {
            animateMovement(10, 1, to.nextState, transitionFunctions);
        } else {
            currentState = to.nextState as string;
            document.getElementById(
                "currentState"
            )!.innerHTML = `CURRENT STATE: ${currentState as string}`;
            run(transitionFunctions, to.nextState);
        }
    }, 500);
    return;
}

function startScript(
    transitionFunctions: transitionFunction[],
    currentState: string,
    accepting: string
) {
    acceptingState = accepting;
    drawTape();
    clearTimeout(runTimeout as number);
    clearTimeout(animateTimeout as number);
    run(transitionFunctions, currentState);
}

// function moveHeadRight() {
//     if (head === tape.length - 1) return;
//     if (buffer.length > 2) {
//         Toastify({
//             text: "Please slow down",
//             duration: 3000,
//             close: true,
//             gravity: "top",
//             position: "right",
//         }).showToast();
//         bufferFull = true;
//         return;
//     }
//     buffer.push("R");
//     checkBuffer();
// }

// function moveHeadLeft() {
//     if (head === 0) return;
//     if (buffer.length > 2) {
//         Toastify({
//             text: "Please slow down",
//             duration: 3000,
//             close: true,
//             gravity: "top",
//             position: "right",
//         }).showToast();
//         bufferFull = true;
//         return;
//     }
//     buffer.push("L");
//     checkBuffer();
// }

function drawTape() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let x = 10;
    for (let i = 0; i < tapeLength; i++) {
        drawTapeNode(
            i,
            x -
                (head * (tapeNodeLength + 10) -
                    canvas.width / 2 +
                    (tapeNodeLength / 2 + 10))
        );
        x += tapeNodeLength + 10;
    }
    drawHeadPointer();
}

function drawTapeNode(i: number, x: number) {
    if (i !== head) ctx.strokeStyle = "black";
    else ctx.strokeStyle = "red";
    ctx.strokeRect(x, canvas.height / 2 - 50, 100, 100);
    if (tape[i] != "-1") {
        ctx.font = "30px Arial";
        ctx.fillText(tape[i].toString(), x + 44, canvas.height / 2 + 10);
    }
}

function init() {
    drawTape();
}

// window.addEventListener("keydown", (e) => {
//     if (e.key === "ArrowRight") {
//         moveHeadRight();
//     }
// });

// window.addEventListener("keydown", (e) => {
//     if (e.key === "ArrowLeft") {
//         moveHeadLeft();
//     }
// });

export { init, setInitialSymbols, startScript };
