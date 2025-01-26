"use client";

import React, { useState, useRef, MouseEvent, WheelEvent, ReactNode } from "react";

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InteractiveMapProps {
  children: ReactNode; // Accept any JSX, including an SVG
  svgWidth: number; // Width of the SVG content
  svgHeight: number; // Height of the SVG content
  minZoom?: number; // Minimum zoom factor (default: 0.5)
  maxZoom?: number; // Maximum zoom factor (default: 4)
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  children,
  svgWidth,
  svgHeight,
  minZoom = 0.5, // Default minimum zoom level
  maxZoom = 4,   // Default maximum zoom level
}) => {
  const [viewBox, setViewBox] = useState<ViewBox>({
    x: 0,
    y: 0,
    width: svgWidth,
    height: svgHeight,
  });

  const isPanning = useRef(false);
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);

  // Handle zooming (scroll wheel or buttons)
  const zoomHandler = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const zoomFactor = 1.2;
    const { clientX, clientY, deltaY } = event;

    const svgElement = event.currentTarget.getBoundingClientRect();
    const mouseX = ((clientX - svgElement.left) / svgElement.width) * viewBox.width;
    const mouseY = ((clientY - svgElement.top) / svgElement.height) * viewBox.height;

    const zoomDirection = deltaY < 0 ? 1 / zoomFactor : zoomFactor;

    setViewBox((prev) => {
      const newWidth = Math.max(
        Math.min(prev.width * zoomDirection, svgWidth * maxZoom),
        svgWidth * minZoom
      );
      const newHeight = Math.max(
        Math.min(prev.height * zoomDirection, svgHeight * maxZoom),
        svgHeight * minZoom
      );

      const newX = mouseX - (mouseX - prev.x) * (newWidth / prev.width);
      const newY = mouseY - (mouseY - prev.y) * (newHeight / prev.height);

      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  // Handle panning (drag with the mouse)
  const startPan = (event: MouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return; // Only start panning for the left mouse button
    isPanning.current = true;
    lastMousePosition.current = { x: event.clientX, y: event.clientY };
  };

  const panHandler = (event: MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current || !lastMousePosition.current) return;

    const deltaX =
      (lastMousePosition.current.x - event.clientX) *
      (viewBox.width / event.currentTarget.clientWidth);
    const deltaY =
      (lastMousePosition.current.y - event.clientY) *
      (viewBox.height / event.currentTarget.clientHeight);

    setViewBox((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastMousePosition.current = { x: event.clientX, y: event.clientY };
  };

  const endPan = () => {
    isPanning.current = false;
    lastMousePosition.current = null;
  };

  // Zoom with buttons
  const zoomWithButtons = (direction: "in" | "out") => {
    const zoomFactor = 1.2;
    const zoomDirection = direction === "in" ? 1 / zoomFactor : zoomFactor;

    setViewBox((prev) => {
      const newWidth = Math.max(
        Math.min(prev.width * zoomDirection, svgWidth * maxZoom),
        svgWidth * minZoom
      );
      const newHeight = Math.max(
        Math.min(prev.height * zoomDirection, svgHeight * maxZoom),
        svgHeight * minZoom
      );

      const newX = prev.x + (prev.width * (1 - newWidth / prev.width)) / 2;
      const newY = prev.y + (prev.height * (1 - newHeight / prev.height)) / 2;

      return {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        border: "1px solid #ccc",
      }}
    >
      {/* Zoom Control Buttons */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={() => zoomWithButtons("in")}
          style={{
            padding: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Zoom In (+)
        </button>
        <button
          onClick={() => zoomWithButtons("out")}
          style={{
            padding: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Zoom Out (-)
        </button>
      </div>

      {/* SVG Map */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onWheel={zoomHandler}
        onMouseDown={startPan}
        onMouseMove={panHandler}
        onMouseUp={endPan}
        onMouseLeave={endPan} // Stops panning if the mouse leaves the SVG area
        style={{
          width: "100%",
          height: "100%",
          cursor: isPanning.current ? "grabbing" : "grab",
        }}
      >
        {children}
      </svg>
    </div>
  );
};
