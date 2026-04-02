import { Box, Button, Slider, Stack, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import { socket } from "../socket/socket";

type Props = {
  roomId: string;
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

const COLORS = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#f97316",
];

const LandingPage = ({ roomId }: Props) => {
  const { isMobile } = useResponsive();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  function initializeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const parentRect = parent.getBoundingClientRect();
    const canvasWidth = parentRect.width;
    const canvasHeight = isMobile ? 320 : 450;

    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(devicePixelRatio, devicePixelRatio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  function getPoint(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0];
      if (!touch) return null;

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function getStrokeStyle() {
    const isEraser = tool === "eraser";

    return {
      color: isEraser ? "#ffffff" : selectedColor,
      width: isEraser ? brushSize * 2 : brushSize,
    };
  }

  function drawStrokeOnCanvas(stroke: Stroke) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;

    context.beginPath();
    context.moveTo(stroke.from.x, stroke.from.y);
    context.lineTo(stroke.to.x, stroke.to.y);
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.stroke();
  }

  function drawDotOnCanvas(point: Point, color: string, width: number) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;

    context.beginPath();
    context.arc(point.x, point.y, width / 2, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }

  function clearCanvasLocally() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.width / devicePixelRatio;
    const height = canvas.height / devicePixelRatio;

    context.scale(devicePixelRatio, devicePixelRatio);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  useEffect(() => {
    initializeCanvas();
  }, [isMobile]);

  useEffect(() => {
    const handleRemoteDraw = (stroke: Stroke) => {
      drawStrokeOnCanvas(stroke);
    };

    const handleCanvasSync = (strokes: Stroke[]) => {
      setTimeout(() => {
        clearCanvasLocally();

        strokes.forEach((stroke) => {
          drawStrokeOnCanvas(stroke);
        });
      }, 100);
    };

    const handleCanvasClear = () => {
      clearCanvasLocally();
    };

    socket.on("canvas:draw", handleRemoteDraw);
    socket.on("canvas:sync", handleCanvasSync);
    socket.on("canvas:clear", handleCanvasClear);

    return () => {
      socket.off("canvas:draw", handleRemoteDraw);
      socket.off("canvas:sync", handleCanvasSync);
      socket.off("canvas:clear", handleCanvasClear);
    };
  }, [isMobile]);

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const point = getPoint(event);
    if (!point) return;

    const { color, width } = getStrokeStyle();

    isDrawingRef.current = true;
    lastPointRef.current = point;

    drawDotOnCanvas(point, color, width);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingRef.current) return;

    const point = getPoint(event);
    const lastPoint = lastPointRef.current;

    if (!point || !lastPoint) return;

    const { color, width } = getStrokeStyle();

    const stroke: Stroke = {
      from: lastPoint,
      to: point,
      color,
      width,
    };

    drawStrokeOnCanvas(stroke);
    socket.emit("canvas:draw", { roomId, stroke });

    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClearForRoom = () => {
    clearCanvasLocally();
    socket.emit("canvas:clear", { roomId });
  };

  return (
    <Stack py={isMobile ? 2 : 5} px={isMobile ? 2 : 4} spacing={3}>
      <Stack spacing={1} alignItems="center">
        <Typography variant={isMobile ? "h4" : "h3"} fontWeight={700}>
          Guess It Bro
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Room ID: {roomId}
        </Typography>
      </Stack>

      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        alignItems={isMobile ? "stretch" : "center"}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {COLORS.map((color) => (
            <Box
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setTool("pen");
              }}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: color,
                cursor: "pointer",
                border:
                  selectedColor === color && tool === "pen"
                    ? "3px solid #111827"
                    : "2px solid #e5e7eb",
                boxSizing: "border-box",
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant={tool === "pen" ? "contained" : "outlined"}
            onClick={() => setTool("pen")}
          >
            Pen
          </Button>
          <Button
            variant={tool === "eraser" ? "contained" : "outlined"}
            onClick={() => setTool("eraser")}
          >
            Eraser
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            minWidth: isMobile ? "100%" : 260,
            flex: 1,
          }}
        >
          <Typography minWidth={90}>
            {tool === "eraser" ? "Eraser" : "Brush"} Size
          </Typography>

          <Slider
            value={brushSize}
            onChange={(_, value) => setBrushSize(value as number)}
            min={2}
            max={20}
            valueLabelDisplay="auto"
            sx={{ width: "100%" }}
          />
        </Stack>

        <Button variant="contained" color="error" onClick={handleClearForRoom}>
          Clear
        </Button>
      </Stack>

      <Box
        sx={{
          width: "100%",
          border: "2px solid #d1d5db",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: "block",
            width: "100%",
            height: isMobile ? 320 : 450,
            backgroundColor: "#ffffff",
            cursor: tool === "eraser" ? "cell" : "crosshair",
            touchAction: "none",
          }}
        />
      </Box>
    </Stack>
  );
};

export default LandingPage;
