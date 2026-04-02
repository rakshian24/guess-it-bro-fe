import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LandingPage from "../components/LandingPage";
import { socket } from "../socket/socket";

type Player = {
  userId: string;
  socketId: string | null;
  nickname: string;
};

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

type Room = {
  roomId: string;
  hostUserId: string | null;
  players: Player[];
  strokes: Stroke[];
};

type JoinResponse = {
  success: boolean;
  roomId?: string;
  userId?: string;
  room?: Room;
  message?: string;
};

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const nickname = localStorage.getItem("nickname");
    const userId = localStorage.getItem("userId");

    if (!nickname) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    socket.on("room:updated", handleRoomUpdated);

    socket.emit(
      "room:join",
      {
        roomId,
        nickname,
        userId,
      },
      (response: JoinResponse) => {
        if (response.success && response.room) {
          setRoom(response.room);

          if (response.userId) {
            localStorage.setItem("userId", response.userId);
          }

          if (response.roomId) {
            localStorage.setItem("roomId", response.roomId);
          }
        }
      },
    );

    return () => {
      socket.off("room:updated", handleRoomUpdated);
    };
  }, [roomId]);

  if (!roomId) return null;

  const shareUrl = `${window.location.origin}/room/${roomId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Stack p={2} spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={700}>
            Room: {roomId}
          </Typography>

          <Typography color="text.secondary">
            Share this link with your team:
          </Typography>

          <Stack direction="row" spacing={1}>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                border: "1px solid #ddd",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {shareUrl}
            </Box>

            <Button variant="contained" onClick={copyLink}>
              Copy Link
            </Button>
          </Stack>

          {copied && <Alert severity="success">Link copied</Alert>}

          <Typography fontWeight={600}>Players</Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {room?.players?.map((player) => (
              <Paper key={player.userId} sx={{ px: 2, py: 1 }}>
                {player.nickname}
                {player.userId === room.hostUserId ? " (Host)" : ""}
                {player.socketId === null ? " (Disconnected)" : ""}
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <LandingPage roomId={roomId} />
    </Stack>
  );
};

export default RoomPage;
