import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as d3 from "d3";

export function useSvgZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  imageRef: RefObject<SVGGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
) {
  // Store the minimum scale computed from the image dimensions.
  const minScaleRef = useRef<number>(1);
  // Store the initial transform so we can “reset” the zoom.
  const initialTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

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

  /**
   * Zooms to a point (x, y) in the SVG coordinate system.
   * The view will transition so that (x, y) is centered at the given targetScale.
   */
  function zoomToPoint(
    x: number,
    y: number,
    targetScale: number,
    duration: number = 300
  ) {
    if (!svgRef.current || !zoomBehavior.current) return;
    const svg = d3.select(svgRef.current);
    const { width: svgWidth, height: svgHeight } =
      svgRef.current.getBoundingClientRect();

    // Get the current zoom transform from the SVG.
    const currentTransform = d3.zoomTransform(svgRef.current);

    // Invert the pointer coordinates to obtain the "base" coordinates.
    const [baseX, baseY] = currentTransform.invert([x, y]);

    // Compute a new transform so that (baseX, baseY) is centered in the viewport.
    const transform = d3.zoomIdentity
      .translate(svgWidth / 2 - targetScale * baseX, svgHeight / 2 - targetScale * baseY)
      .scale(targetScale);

    svg.transition().duration(duration).call(zoomBehavior.current.transform, transform);
  }

  /**
   * Resets the zoom to the initial transform (i.e. “zoom out”)
   */
  function resetZoom(duration: number = 300) {
    if (!svgRef.current || !zoomBehavior.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(duration)
      .call(zoomBehavior.current.transform, initialTransformRef.current);
  }

  useEffect(() => {
    if (!svgRef.current || !imageRef.current || !zoomBehavior) return;

    const svg = d3.select(svgRef.current);
    // Assumes your image group has id="image"
    const imageSelection = svg.selectChild<SVGGElement>("#image");
    const imageNode = imageSelection.node();

    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }

    // Get the dimensions of your image element.
    const { width, height } = imageNode.getBoundingClientRect();

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const { transform } = event;
      if (imageRef.current) {
        d3.select(imageRef.current).attr("transform", transform.toString());
      }
    }

    // Set up the zoom behavior.
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);
    zoomBehavior.current = zoom;

    function updateExtents() {
      const svgNode = svg.node();
      if (!svgNode) return;

      const { width: svgWidth, height: svgHeight } =
        svgNode.getBoundingClientRect();
      // Compute the minimum scale so that the image fits the viewport.
      const minScale = Math.max(svgWidth / width, svgHeight / height);
      minScaleRef.current = minScale;

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

      // Set the initial transform (zoomed-out view) and apply it.
      initialTransformRef.current = d3.zoomIdentity.scale(minScale);
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

  return { zoomIn, zoomOut, zoomToPoint, resetZoom };
}
