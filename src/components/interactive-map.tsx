"use client";

import { ComponentPropsWithoutRef, useEffect, useRef } from "react";
import * as d3 from "d3";

type IInteractiveMapProps = ComponentPropsWithoutRef<"div">;

export function InteractiveMap({ children }: IInteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const imageRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  useEffect(() => {
    if (!svgRef.current || !imageRef.current) return;

    const svg = d3.select(svgRef.current);
    const imageSelection = svg.selectChild<SVGGElement>("#image");
    const imageNode = imageSelection.node();

    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }

    const { width, height } = imageNode.getBoundingClientRect();

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);
    zoomBehavior.current = zoom;

    function updateExtents() {
      const svgNode = svg.node();
      if (!svgNode) return;

      const { width: svgWidth, height: svgHeight } =
        svgNode.getBoundingClientRect();
      const minScale = Math.max(svgWidth / width, svgHeight / height);

      zoom
        .scaleExtent([minScale, 8])
        .extent([
          [0, 0],
          [svgWidth, svgHeight],
        ])
        .translateExtent([
          [0, 0],
          [width, height],
        ]);

      zoom.scaleTo(svg, minScale);
    }

    // Apply zoom behavior
    svg.call(zoom);
    updateExtents();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateExtents();
      }, 100);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const innerSvg = imageSelection.select("#map-absheron_svg__Layer_1");

    const clickableElements = innerSvg.selectChildren("[id]").nodes();

    console.log(clickableElements);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
    const { transform } = event;
    if (imageRef.current) {
      d3.select(imageRef.current).attr("transform", transform.toString());
    }
  }

  function handleZoomIn() {
    if (svgRef.current && zoomBehavior.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(200), 1.2);
    }
  }

  function handleZoomOut() {
    if (svgRef.current && zoomBehavior.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(200), 0.8);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Zoom Controls */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            background: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Zoom In
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            background: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Zoom Out
        </button>
      </div>

      {/* SVG Container */}
      <svg ref={svgRef} id="map" width="100%" height="100%">
        <g id="image">
          <g ref={imageRef}>{children}</g>
        </g>
      </svg>
    </div>
  );
}
