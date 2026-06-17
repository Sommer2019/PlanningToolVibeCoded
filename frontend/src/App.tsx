import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { UserSwitcher } from "./components/UserSwitcher";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectLayout } from "./pages/ProjectLayout";
import { BoardPage } from "./pages/BoardPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TasklistPage } from "./pages/TasklistPage";
import { CalendarPage } from "./pages/CalendarPage";
import { MembersPage } from "./pages/MembersPage";

function Header() {
  const { t } = useI18n();
  return (
    <header className="app-header">
      <h1>
        <Link to="/" style={{ color: "inherit" }}>
          {t("app.title")}
        </Link>
      </h1>
      <span className="spacer" />
      <LanguageSwitcher />
      <ThemeToggle />
      <UserSwitcher />
    </header>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Header />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectLayout />}>
                  <Route index element={<Navigate to="board" replace />} />
                  <Route path="board" element={<BoardPage />} />
                  <Route path="roadmap" element={<RoadmapPage />} />
                  <Route path="tasklist" element={<TasklistPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="members" element={<MembersPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
