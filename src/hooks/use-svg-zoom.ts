import { useEffect } from "react";
import type { RefObject } from "react";
import * as d3 from "d3";

export function useSvgZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  imageRef: RefObject<SVGGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>,
) {
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

  useEffect(() => {
    if (!svgRef.current || !imageRef.current || !zoomBehavior) return;

    const svg = d3.select(svgRef.current);
    const imageSelection = svg.selectChild<SVGGElement>("#image");
    const imageNode = imageSelection.node();

    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }

    const { width, height } = imageNode.getBoundingClientRect();

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const { transform } = event;
      if (imageRef.current) {
        d3.select(imageRef.current).attr("transform", transform.toString());
      }
    }

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
    svg.call(zoom).on("dblclick.zoom", null);
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
  }, [imageRef, svgRef, zoomBehavior]);

  return { zoomIn, zoomOut };
}
