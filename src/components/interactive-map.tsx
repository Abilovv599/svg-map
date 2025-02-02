"use client";

import "./interactive-map.css";
import { ComponentPropsWithoutRef, useRef } from "react";
import { useSelectElements } from "@/hooks/use-select-elements";
import { ZoomControls } from "./map-controls";
import { useSvgZoom } from "@/hooks/use-svg-zoom";

type IInteractiveMapProps = ComponentPropsWithoutRef<"div">;

export function InteractiveMap({ children }: IInteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const imageRef = useRef<SVGGElement | null>(null);

  // Initialize zoom functionality via custom hook
  const { zoomIn, zoomOut } = useSvgZoom(svgRef, imageRef);

  const {} = useSelectElements();

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
      <svg ref={svgRef} id="map" width="100%" height="100%">
        <g id="image">
          <g ref={imageRef}>{children}</g>
        </g>
      </svg>
    </div>
  );
}
