"use client";

import { ComponentPropsWithoutRef, useEffect } from "react";
import * as d3 from "d3";

interface IInteractiveMapProps extends ComponentPropsWithoutRef<"div"> {
  imageSrc: string;
}

export function InteractiveMap({ imageSrc }: IInteractiveMapProps) {
  useEffect(() => {
    // -----------------------------------------------------------------------------
    // 1) SELECT AND TYPECAST YOUR SVG ELEMENTS
    // -----------------------------------------------------------------------------

    const svg = d3.select<SVGSVGElement, unknown>("#map");
    const imageSelection = svg.selectChild<SVGImageElement>("#image");
    const imageNode = imageSelection.node();
    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }
    const { width, height } = imageNode.getBoundingClientRect();

    // -----------------------------------------------------------------------------
    // 2) SET UP THE ZOOM BEHAVIOR
    // -----------------------------------------------------------------------------

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

    // -----------------------------------------------------------------------------
    // 3) APPLY ZOOM, INITIALIZE VIEW, AND HANDLE RESIZING
    // -----------------------------------------------------------------------------

    svg.call(zoom);
    updateExtents();

    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          updateExtents();
        }, 100);
      },
      { passive: true },
    );

    // -----------------------------------------------------------------------------
    // 4) DEFINE THE ZOOM HANDLER
    // -----------------------------------------------------------------------------

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const { transform } = event;
      imageSelection.attr("transform", transform.toString());
    }
  });
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <svg id="map" width="100%" height="100%">
        <g id="image">
          <image href={imageSrc} />
        </g>
      </svg>
    </div>
  );
}
