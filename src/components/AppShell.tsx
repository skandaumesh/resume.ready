import AppHeader, { APP_SIDEBAR_WIDTH_CLASS } from "@/components/AppHeader";

// Wraps every signed-in dashboard page: the icon-rail sidebar plus a
// floating, bordered content card offset from it — instead of the page
// content sitting directly on plain white, matching the reference's
// "#main-content" treatment.
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-white ${APP_SIDEBAR_WIDTH_CLASS}`}>
      <AppHeader />
      <div className="md:m-2 md:min-h-[calc(100vh-4.5rem)] md:rounded-2xl md:border md:border-[#f3f3f3] md:bg-[#fbfbfb]">
        {children}
      </div>
    </div>
  );
}
