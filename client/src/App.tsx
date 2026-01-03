import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import Suppliers from "./pages/Suppliers";
import Analytics from "./pages/Analytics";
import Item from "./pages/Item";
import { Items } from "./pages/Items";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects/new" component={NewProject} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/items" component={Items} />
      <Route path="/item/:id" component={Item} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <I18nProvider>
          <BreadcrumbProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </BreadcrumbProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
