import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as d3 from "d3";

export function useSvgZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  imageRef: RefObject<SVGGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
) {
  // Store image dimensions so they can be used for clamping
  const imageDimensionsRef = useRef<{ width: number; height: number } | null>(null);
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
   * This function first converts the pointer coordinates to the base coordinate system,
   * then computes a new transform and clamps its translation so the map does not show empty borders.
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

    // Get the current zoom transform.
    const currentTransform = d3.zoomTransform(svgRef.current);

    // Invert the pointer coordinates so we work in the base coordinate system.
    const [baseX, baseY] = currentTransform.invert([x, y]);

    // Compute the raw translation so that (baseX, baseY) would be centered.
    let tx = svgWidth / 2 - targetScale * baseX;
    let ty = svgHeight / 2 - targetScale * baseY;

    // Retrieve the image (map) dimensions.
    if (!imageDimensionsRef.current) {
      // If not already stored, grab dimensions from the image node.
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        imageDimensionsRef.current = { width, height };
      } else {
        // Fallback: assume the SVG dimensions if the image isn't available.
        imageDimensionsRef.current = { width: svgWidth, height: svgHeight };
      }
    }
    const { width: contentWidth, height: contentHeight } = imageDimensionsRef.current;

    // Calculate allowed translation limits.
    // Assuming the image's top-left is at (0,0), the allowed tx is between:
    //    tx_min = svgWidth - targetScale * contentWidth   and   tx_max = 0
    // Similar for ty.
    const txMin = svgWidth - targetScale * contentWidth;
    const txMax = 0;
    const tyMin = svgHeight - targetScale * contentHeight;
    const tyMax = 0;

    // Clamp the computed translation.
    tx = Math.max(txMin, Math.min(tx, txMax));
    ty = Math.max(tyMin, Math.min(ty, tyMax));

    const transform = d3.zoomIdentity.translate(tx, ty).scale(targetScale);
    svg.transition().duration(duration).call(zoomBehavior.current.transform, transform);
  }

  /**
   * Resets the zoom to the initial transform (i.e. “zoom out”).
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
    const imageSelection = svg.selectChild<SVGGElement>("#image");
    const imageNode = imageSelection.node();

    if (!imageNode) {
      throw new Error("Cannot find #image node in the SVG structure.");
    }

    // Get the dimensions of the image element.
    const { width, height } = imageNode.getBoundingClientRect();
    imageDimensionsRef.current = { width, height };

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const { transform } = event;
      if (imageRef.current) {
        d3.select(imageRef.current).attr("transform", transform.toString());
      }
    }

    // Set up zoom behavior.
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);
    zoomBehavior.current = zoom;

    function updateExtents() {
      const svgNode = svg.node();
      if (!svgNode) return;

      const { width: svgWidth, height: svgHeight } = svgNode.getBoundingClientRect();
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

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [imageRef, svgRef, zoomBehavior]);

  return { zoomIn, zoomOut, zoomToPoint, resetZoom };
}
