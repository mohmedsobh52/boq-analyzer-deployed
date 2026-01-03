import { useLocation } from "wouter";
import { useEffect } from "react";

export function useNavigation() {
  const [location, setLocation] = useLocation();

  // Handle keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to go back
      if (e.key === "Escape") {
        // Go back to previous page or home
        if (location !== "/") {
          window.history.back();
        } else {
          setLocation("/");
        }
      }

      // Alt+Home to go to home
      if (e.altKey && e.key === "Home") {
        setLocation("/");
      }

      // Alt+Left Arrow to go back
      if (e.altKey && e.key === "ArrowLeft") {
        window.history.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location, setLocation]);

  return {
    goHome: () => setLocation("/"),
    goBack: () => window.history.back(),
    currentPath: location,
  };
}
