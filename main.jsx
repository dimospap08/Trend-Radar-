import React from "react";
import ReactDOM from "react-dom/client";
import { inject } from "@vercel/analytics";
import TrendRadar from "./src/TrendRadar.jsx";
import "./index.css";

inject();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TrendRadar />
  </React.StrictMode>
);
