import React, { useRef, useEffect, useState } from 'react';

// Define the data shape for drawing lines
interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

const App: React.FC = () => {
  // Use useRef to get a reference to the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // useRef to store the previous drawing position, avoiding re-renders
  const lastPosition = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Establish the WebSocket connection
    const websocket = new WebSocket('ws://localhost:8080');
    setWs(websocket);

    // Handle incoming drawing data from other users
    websocket.onmessage = (event) => {
      const lineData: LineData = JSON.parse(event.data);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.strokeStyle = lineData.color;
          // Set line width for better visibility
          ctx.lineWidth = 2;
          ctx.moveTo(lineData.x1, lineData.y1);
          ctx.lineTo(lineData.x2, lineData.y2);
          ctx.stroke();
        }
      }
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      websocket.close();
    };
  }, []);

  // Event handler for mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Start a new path and set drawing properties
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        // Store the starting position for the next line segment
        lastPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
      }
    }
  };

  // Event handler for mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const x2 = e.nativeEvent.offsetX;
        const y2 = e.nativeEvent.offsetY;
        const x1 = lastPosition.current.x;
        const y1 = lastPosition.current.y;

        // Draw the line segment on the canvas
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Send the line data to the server via WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
          const lineData: LineData = { x1, y1, x2, y2, color };
          ws.send(JSON.stringify(lineData));
        }

        // Update the last position to the current one
        lastPosition.current = { x: x2, y: y2 };
      }
    }
  };

  // Event handler for mouse up
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">即時協作畫布</h1>
      <div className="mb-4">
        <label className="mr-2 text-gray-700">選擇顏色:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 p-1 border-2 border-gray-300 rounded-md cursor-pointer"
        />
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="bg-white border-2 border-gray-400 rounded-lg shadow-lg"
      />
    </div>
  );
};

export default App;
