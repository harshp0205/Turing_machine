import "./style.css";
import { init } from "./tape";
import "./input";

const textPlaceholder = "";

document
    .getElementById("textarea")!
    .setAttribute("placeholder", textPlaceholder);

init();
