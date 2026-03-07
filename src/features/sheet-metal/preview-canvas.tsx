import { useEffect, useRef, useState } from "react";

import type { GeometryResult, LineShape } from "@/features/sheet-metal/types";

function getLineLength(shape: LineShape) {
  return Math.round(Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1));
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const pProjX = x1 + t * (x2 - x1);
  const pProjY = y1 + t * (y2 - y1);
  return Math.hypot(px - pProjX, py - pProjY);
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 760;

type PreviewCanvasProps = {
  geometry: GeometryResult;
};

export function PreviewCanvas({ geometry }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLine, setHoveredLine] = useState<LineShape | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height } = canvas;
    const { totalWidth, totalHeight, shapes, baseRect } = geometry;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0b0f18";
    context.fillRect(0, 0, width, height);

    if (totalWidth <= 0 || totalHeight <= 0) return;

    const padding = 48;
    const scale = Math.min((width - padding * 2) / totalWidth, (height - padding * 2) / totalHeight);
    const offsetX = (width - totalWidth * scale) / 2;
    const offsetY = (height - totalHeight * scale) / 2;
    const translateX = (value: number) => offsetX + value * scale;
    const translateY = (value: number) => height - offsetY - value * scale;

    context.save();
    context.strokeStyle = "rgba(180, 197, 220, 0.08)";
    context.lineWidth = 1;

    const gridStep = Math.max(20, Math.round(Math.max(totalWidth, totalHeight) / 16));

    for (let x = 0; x <= totalWidth; x += gridStep) {
      context.beginPath();
      context.moveTo(translateX(x), 0);
      context.lineTo(translateX(x), height);
      context.stroke();
    }

    for (let y = 0; y <= totalHeight; y += gridStep) {
      context.beginPath();
      context.moveTo(0, translateY(y));
      context.lineTo(width, translateY(y));
      context.stroke();
    }
    context.restore();

    context.save();
    context.fillStyle = "rgba(218, 70, 239, 0.08)";
    context.fillRect(
      translateX(baseRect.x0),
      translateY(baseRect.y1),
      (baseRect.x1 - baseRect.x0) * scale,
      (baseRect.y1 - baseRect.y0) * scale,
    );
    context.restore();

    const ordered = [...shapes].sort((left, right) => {
      if (left === hoveredLine) return 1;
      if (right === hoveredLine) return -1;
      return left.layer === right.layer ? 0 : left.layer === "CUT" ? 1 : -1;
    });

    for (const shape of ordered) {
      const isHovered = shape === hoveredLine;
      context.beginPath();
      context.moveTo(translateX(shape.x1), translateY(shape.y1));
      context.lineTo(translateX(shape.x2), translateY(shape.y2));
      
      if (isHovered) {
        context.strokeStyle = "#ffffff";
        context.lineWidth = 4.5;
      } else {
        context.strokeStyle = shape.layer === "CUT" ? "#4ef08b" : "#dd4af5";
        context.lineWidth = shape.layer === "CUT" ? 2.4 : 1.45;
      }
      
      context.stroke();
    }
  }, [geometry, hoveredLine]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${cssX + 16}px`;
      tooltipRef.current.style.top = `${cssY + 16}px`;
    }

    if (geometry.totalWidth <= 0 || geometry.totalHeight <= 0) return;

    const canvasX = (cssX / rect.width) * CANVAS_WIDTH;
    const canvasY = (cssY / rect.height) * CANVAS_HEIGHT;

    const padding = 48;
    const scale = Math.min(
      (CANVAS_WIDTH - padding * 2) / geometry.totalWidth,
      (CANVAS_HEIGHT - padding * 2) / geometry.totalHeight,
    );
    const offsetX = (CANVAS_WIDTH - geometry.totalWidth * scale) / 2;
    const offsetY = (CANVAS_HEIGHT - geometry.totalHeight * scale) / 2;

    const translateX = (val: number) => offsetX + val * scale;
    const translateY = (val: number) => CANVAS_HEIGHT - offsetY - val * scale;

    let closest: LineShape | null = null;
    let minDist = 18; // hover collision distance threshold in canvas pixels

    for (const shape of geometry.shapes) {
      const x1 = translateX(shape.x1);
      const y1 = translateY(shape.y1);
      const x2 = translateX(shape.x2);
      const y2 = translateY(shape.y2);
      const dist = distanceToSegment(canvasX, canvasY, x1, y1, x2, y2);
      if (dist < minDist) {
        minDist = dist;
        closest = shape;
      }
    }

    if (closest !== hoveredLine) {
      setHoveredLine(closest);
    }
  };

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredLine(null)}
        className="h-full w-full rounded-[1.25rem] outline-none"
      />
      <div 
         ref={tooltipRef} 
         className={`pointer-events-none absolute z-50 rounded-lg bg-emerald-950/90 shadow-[0_0_15px_rgba(20,180,100,0.2)] border border-emerald-500/30 backdrop-blur-md px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 transition-opacity duration-200 ${hoveredLine ? 'opacity-100' : 'opacity-0'}`}
      >
        {hoveredLine ? `${getLineLength(hoveredLine)} mm` : ""}
      </div>
    </div>
  );
}
