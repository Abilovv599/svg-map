"use client";

import "./interactive-map.css";
import { useRef } from "react";
import { useSelectElements } from "@/hooks/use-select-elements";
import { ZoomControls } from "../map-controls/map-controls";
import { useSvgZoom } from "@/hooks/use-svg-zoom";

import type { ComponentPropsWithoutRef } from "react";
import type { ZoomBehavior } from "d3";

type InteractiveMapProps = ComponentPropsWithoutRef<"div">;

export function InteractiveMap({ children }: InteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const imageRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  // Initialize zoom functionality via custom hook
  const { zoomIn, zoomOut } = useSvgZoom(svgRef, imageRef, zoomBehavior);

  const {} = useSelectElements(svgRef, zoomBehavior);

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
