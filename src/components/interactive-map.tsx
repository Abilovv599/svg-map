"use client";

import { ComponentPropsWithoutRef, useEffect, useRef } from "react";
import * as d3 from "d3";

interface IInteractiveMapProps extends ComponentPropsWithoutRef<"div"> {
  imageSrc: string;
}

export function InteractiveMap({ imageSrc }: IInteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const imageRef = useRef<SVGImageElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !imageRef.current) return;

    const svg = d3.select(svgRef.current);
    const imageSelection = svg.selectChild<SVGImageElement>("#image");
    const imageNode = imageSelection.node();

    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }

    const { width, height } = imageNode.getBoundingClientRect();

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);

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

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [imageSrc]);

  function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
    const { transform } = event;
    if (imageRef.current) {
      d3.select(imageRef.current).attr("transform", transform.toString());
    }
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} id="map" width="100%" height="100%">
        <g id="image">
          <image ref={imageRef} href={imageSrc} />
        </g>
      </svg>
    </div>
  );
}
