import { useCallback, useEffect, useRef } from "react";
import * as d3 from "d3";
import type { RefObject } from "react";

export function useSvgZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  imageRef: RefObject<SVGGElement | null>,
) {
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );

  const updateExtents = useCallback(() => {
    if (!svgRef.current || !imageRef.current) return;
    const svg = d3.select(svgRef.current);
    const imageSelection = svg.selectChild<SVGGElement>("#image");
    const imageNode = imageSelection.node();
    if (!imageNode) return;

    const { width, height } = imageNode.getBoundingClientRect();
    const svgNode = svg.node();
    if (!svgNode) return;
    const { width: svgWidth, height: svgHeight } =
      svgNode.getBoundingClientRect();
    const minScale = Math.max(svgWidth / width, svgHeight / height);

    zoomBehavior.current
      ?.scaleExtent([minScale, 8])
      .extent([
        [0, 0],
        [svgWidth, svgHeight],
      ])
      .translateExtent([
        [0, 0],
        [width, height],
      ]);

    zoomBehavior.current?.scaleTo(svg, minScale);
  }, [svgRef, imageRef]);

  useEffect(() => {
    if (!svgRef.current || !imageRef.current) return;
    const svg = d3.select(svgRef.current);
    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      if (imageRef.current) {
        d3.select(imageRef.current).attr(
          "transform",
          event.transform.toString(),
        );
      }
    });
    zoomBehavior.current = zoom;

    svg.call(zoom).on("dblclick.zoom", null); // Disable double-click zoom
    updateExtents();

    const handleResize = () => {
      updateExtents();
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [svgRef, imageRef, updateExtents]);

  function zoomIn() {
    if (svgRef.current && zoomBehavior.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(200), 1.2);
    }
  }

  function zoomOut() {
    if (svgRef.current && zoomBehavior.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(200), 0.8);
    }
  }

  return { zoomIn, zoomOut };
}
