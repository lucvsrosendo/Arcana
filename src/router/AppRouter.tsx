import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import App from "@/App";
import { PwaReloadPrompt } from "@/components/PwaReloadPrompt";

export function AppRouter() {
  return (
    <BrowserRouter>
      <NuqsAdapter>
        <App />
        <PwaReloadPrompt />
      </NuqsAdapter>
    </BrowserRouter>
  );
}

type AppRoutesProps = {
  renderHome: () => ReactNode;
  renderNewsDetail: (newsId: string) => ReactNode;
  renderLegal: (kind: "privacy" | "terms" | "cookies") => ReactNode;
  renderReading: () => ReactNode;
  renderHistory: () => ReactNode;
  renderJournal: () => ReactNode;
  renderArcana: () => ReactNode;
  renderLearn: () => ReactNode;
  renderSettings: () => ReactNode;
  renderNewsAdmin: () => ReactNode;
};

function NewsDetailRoute({
  renderNewsDetail,
}: {
  renderNewsDetail: (newsId: string) => ReactNode;
}) {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/home" replace />;
  }

  return <>{renderNewsDetail(id)}</>;
}

export function AppRoutes({
  renderHome,
  renderNewsDetail,
  renderLegal,
  renderReading,
  renderHistory,
  renderJournal,
  renderArcana,
  renderLearn,
  renderSettings,
  renderNewsAdmin,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="/home" element={renderHome()} />
      <Route path="/reading" element={renderReading()} />
      <Route path="/history" element={renderHistory()} />
      <Route path="/journal" element={renderJournal()} />
      <Route path="/arcana" element={renderArcana()} />
      <Route path="/learn" element={renderLearn()} />
      <Route path="/settings" element={renderSettings()} />
      <Route path="/news-admin" element={renderNewsAdmin()} />
      <Route
        path="/news/:id"
        element={<NewsDetailRoute renderNewsDetail={renderNewsDetail} />}
      />
      <Route path="/privacy" element={renderLegal("privacy")} />
      <Route path="/terms" element={renderLegal("terms")} />
      <Route path="/cookies" element={renderLegal("cookies")} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
