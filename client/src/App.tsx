import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";


function Router() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <WouterRouter base={base}>
      <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AccessibilityLayer() {
  useEffect(() => {
    const syncViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--visual-vh", `${height}px`);
    };
    const decorateDialogs = () => {
      const dialogs = document.querySelectorAll<HTMLElement>(".modal-backdrop .action-modal, .modal-backdrop .payer-modal, .modal-backdrop .duplicate-modal, .payment-drawer, .receipt-form");
      dialogs.forEach((dialog, index) => {
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        const heading = dialog.querySelector<HTMLElement>("h2, h3");
        if (heading) {
          const id = heading.id || `dialog-title-${index}`;
          heading.id = id;
          dialog.setAttribute("aria-labelledby", id);
        }
      });
    };
    const handleKeydown = (event: KeyboardEvent) => {
      const dialog = document.querySelector<HTMLElement>(".modal-backdrop .action-modal, .modal-backdrop .payer-modal, .modal-backdrop .duplicate-modal, .payment-drawer, .receipt-form");
      if (!dialog) return;
      if (event.key === "Escape") {
        const close = dialog.querySelector<HTMLButtonElement>(".modal-close, .form-close");
        if (close) { event.preventDefault(); close.click(); }
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter(node => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    syncViewport();
    decorateDialogs();
    const observer = new MutationObserver(decorateDialogs);
    observer.observe(document.body, { childList: true, subtree: true });
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityLayer />
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
