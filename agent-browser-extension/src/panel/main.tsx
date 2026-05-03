import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Panel } from "./Panel";
import "../styles/variables.css";
import "../styles/base.css";
import "highlight.js/styles/atom-one-dark.min.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Panel />
  </StrictMode>,
);
