import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HackathonDemo from "./hackathon-demo";
import "./styles.css";

document.documentElement.dataset.siaocutSurface = "hackathon";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element.");
}

createRoot(root).render(
  <StrictMode>
    <HackathonDemo />
  </StrictMode>,
);
