import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerProvider";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";

const App = () => {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </BrowserRouter>
    </PlayerProvider>
  );
};

export default App;
