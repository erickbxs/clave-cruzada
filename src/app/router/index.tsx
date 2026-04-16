import { HashRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import RoomPage from "@/pages/RoomPage";
import LocalPlayPage from "@/pages/LocalPlayPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
        <Route path="/local" element={<LocalPlayPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
