import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { UserSwitcher } from "./components/UserSwitcher";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectLayout } from "./pages/ProjectLayout";
import { BoardPage } from "./pages/BoardPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TasklistPage } from "./pages/TasklistPage";
import { CalendarPage } from "./pages/CalendarPage";
import { MembersPage } from "./pages/MembersPage";

function Header() {
  return (
    <header className="app-header">
      <h1>
        <Link to="/" style={{ color: "inherit" }}>
          Planning &amp; Tracking
        </Link>
      </h1>
      <span className="spacer" />
      <UserSwitcher />
    </header>
  );
}

export default function App() {
  return (
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
  );
}
