import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RecoilRoot } from "recoil";
import { router } from "./router";
import { queryClient } from "./queryClient";
import "./styles/globals.css";

const rootElement = document.getElementById("app");

if (!rootElement) throw new Error("Missing #app root element");

router.subscribe("onResolved", ({ fromLocation }) => {
  if (fromLocation) {
    document
      .querySelectorAll("[data-server-head]")
      .forEach((tag) => tag.remove());
  }
});

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </RecoilRoot>
  </StrictMode>,
);
