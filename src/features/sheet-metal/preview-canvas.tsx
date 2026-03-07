import { useEffect, useRef } from "react";

import type { GeometryResult } from "@/features/sheet-metal/types";

type PreviewCanvasProps = {
  geometry: GeometryResult;
};

export function PreviewCanvas({ geometry }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const { width, height } = canvas;
    const { totalWidth, totalHeight, shapes, baseRect } = geometry;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0b0f18";
    context.fillRect(0, 0, width, height);

    if (totalWidth <= 0 || totalHeight <= 0) {
      return;
    }

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

    const ordered = [...shapes].sort((left, right) =>
      left.layer === right.layer ? 0 : left.layer === "CUT" ? 1 : -1,
    );

    for (const shape of ordered) {
      context.beginPath();
      context.moveTo(translateX(shape.x1), translateY(shape.y1));
      context.lineTo(translateX(shape.x2), translateY(shape.y2));
      context.strokeStyle = shape.layer === "CUT" ? "#4ef08b" : "#dd4af5";
      context.lineWidth = shape.layer === "CUT" ? 2.4 : 1.45;
      context.stroke();
    }
  }, [geometry]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={760}
      className="h-full w-full rounded-[1.25rem] border border-white/5 bg-[#090d16]"
    />
  );
}
