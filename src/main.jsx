import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if (typeof navigator !== "undefined") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("serviceWorker.js")
      .then((registration) => {
        console.log(registration);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

createRoot(document.getElementById("root")).render(<App />);
