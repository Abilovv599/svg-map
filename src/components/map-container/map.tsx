"use client";

import { useState } from "react";
import type { FC, MouseEvent } from "react";
import { useSearchParamState } from "@/hooks/useSearchParamState";
import { MapWithoutTextSvg } from "@/components/svg/map-without-text/map-without-text";

interface MapProps {
  width?: number;
  height?: number;
  initialZoom?: number;
}

export const Map: FC<MapProps> = ({
  width = 800,
  height = 600,
  initialZoom = 1,
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [, setSelectedElements] = useSearchParamState("selected", []);

  const handleClick = (event: MouseEvent<SVGElement>) => {
    const target = event.target as SVGElement;

    // Toggle data-selected attribute
    const isSelected = target.getAttribute("data-selected") === "true";
    target.setAttribute("data-selected", isSelected ? "false" : "true");

    // Pass the element's id and className to the parent
    const id = target.getAttribute("id");
    const className = target.getAttribute("class");

    handleElementClick(className, id);
  };

  const handleElementClick = (className: string | null, id: string | null) => {
    const identifier = className || id;
    if (!identifier) return;

    setSelectedElements((prev) => {
      const isSelected = prev.includes(identifier);
      return isSelected
        ? prev.filter((item) => item !== identifier)
        : [...prev, identifier];
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const resetView = () => {
    setZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          aria-label="Reset view"
        >
          reset
        </button>
      </div>
      <MapWithoutTextSvg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded-lg bg-white"
        transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}
        style={{ cursor: isDragging ? "grabbing" : "default" }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};
