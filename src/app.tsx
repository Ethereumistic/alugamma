import { Route, Routes } from "react-router-dom";

import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider as UI_SidebarProvider } from "@/components/ui/sidebar";
import { SheetMetalProvider } from "@/features/sheet-metal/context";
import { WorkspaceProvider } from "@/features/workspace/context";
import AuthPage from "@/routes/auth";
import LandingPage from "@/routes/landing";
import SheetMetalApp from "@/routes/sheet-metal";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <UI_SidebarProvider>
      <WorkspaceProvider>
        <SheetMetalProvider>
          <div className="flex min-h-screen w-full bg-background text-foreground">
            <AppSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AppNavbar />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/sheet-metal" element={<SheetMetalApp />} />
                  <Route path="/sheet-metal/:designId" element={<SheetMetalApp />} />
                </Routes>
              </main>
            </div>
          </div>
          <Toaster theme="dark" position="bottom-left" richColors />
        </SheetMetalProvider>
      </WorkspaceProvider>
    </UI_SidebarProvider>
  );
}
