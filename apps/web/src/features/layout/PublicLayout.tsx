import { PublicCampusSelector } from "@/features/campus/PublicCampusSelector";
import { AuthModalProvider } from "@/features/auth/AuthModal";
import { Outlet } from "react-router-dom";
import { PublicFooter, PublicHeader } from "./PublicHeader";

export function PublicLayout() {
  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col bg-paper">
        <PublicHeader
          campusSelector={<PublicCampusSelector id="public-campus-header" />}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-6 sm:px-6 sm:pt-8"
        >
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </AuthModalProvider>
  );
}
