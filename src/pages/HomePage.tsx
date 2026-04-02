import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/usePlayer";
import { socket } from "../socket/socket";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  from: Point;
  to: Point;
  color: string;
  width: number;
};

type Player = {
  userId: string;
  socketId: string | null;
  nickname: string;
};

type Room = {
  roomId: string;
  hostUserId: string | null;
  players: Player[];
  strokes: Stroke[];
};

type RoomResponse = {
  success: boolean;
  roomId?: string;
  userId?: string;
  room?: Room;
  message?: string;
  shareUrl?: string;
};

const HomePage = () => {
  const navigate = useNavigate();
  const { nickname, setNickname, userId, setUserId } = usePlayer();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState("");

  const ensureConnected = () => {
    if (!socket.connected) {
      socket.connect();
    }
  };

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setError("Please enter your nickname");
      return;
    }

    setError("");
    ensureConnected();

    socket.emit(
      "room:create",
      { nickname: nickname.trim(), userId },
      (response: RoomResponse) => {
        if (!response.success || !response.roomId || !response.userId) {
          setError(response.message || "Could not create room");
          return;
        }

        localStorage.setItem("nickname", nickname.trim());
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("roomId", response.roomId);

        setUserId(response.userId);
        navigate(`/room/${response.roomId}`);
      },
    );
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      setError("Please enter your nickname");
      return;
    }

    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    setError("");
    ensureConnected();

    socket.emit(
      "room:join",
      {
        roomId: joinRoomId.trim().toUpperCase(),
        nickname: nickname.trim(),
        userId,
      },
      (response: RoomResponse) => {
        if (!response.success || !response.roomId || !response.userId) {
          setError(response.message || "Could not join room");
          return;
        }

        localStorage.setItem("nickname", nickname.trim());
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("roomId", response.roomId);

        setUserId(response.userId);
        navigate(`/room/${response.roomId}`);
      },
    );
  };

  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" p={2}>
      <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 480 }}>
        <Stack spacing={3}>
          <Typography variant="h4" fontWeight={700}>
            Guess It Bro
          </Typography>

          <Typography color="text.secondary">
            Enter your nickname and create or join a game room.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            fullWidth
          />

          <Button variant="contained" size="large" onClick={handleCreateRoom}>
            Create Game Room
          </Button>

          <Box>
            <Typography mb={1}>or join existing room</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                fullWidth
              />
              <Button variant="outlined" onClick={handleJoinRoom}>
                Join
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default HomePage;
