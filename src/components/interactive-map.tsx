"use client";

import "./interactive-map.css";
import { ComponentPropsWithoutRef, useEffect, useRef } from "react";
import * as d3 from "d3";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type IInteractiveMapProps = ComponentPropsWithoutRef<"div">;

export function InteractiveMap({ children }: IInteractiveMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const imageRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );
  const selectedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize selected IDs from URL
    const initialSelected = searchParams.get("selected")?.split(",") || [];
    selectedIds.current = new Set(initialSelected.filter(Boolean));
  }, [searchParams]);

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
  }, []);

  useEffect(() => {
    // Selection and click handler setup
    const clickableElementsSelect = d3.selectAll<SVGElement, unknown>(
      "[id*='click']",
    );

    // Apply initial selection from URL
    clickableElementsSelect.each(function () {
      const element = d3.select(this);
      const id = this.id;
      element.classed("selected", selectedIds.current.has(id));
    });

    // Click handler for selectable elements
    clickableElementsSelect.on("click", function (event) {
      event.stopPropagation(); // Prevent zoom behavior on element click
      const element = d3.select(this);
      const id = this.id;
      const isSelected = element.classed("selected");

      // Selected items at a time validation
      if (selectedIds.current.size >= 30 && !isSelected) {
        return alert("You can only select up to 30 items at a time.");
      }

      // Toggle selection state
      element.classed("selected", !isSelected);

      // Update selected IDs
      if (!isSelected) {
        selectedIds.current.add(id);
      } else {
        selectedIds.current.delete(id);
      }

      // Update URL with new selection
      const params = new URLSearchParams(searchParams.toString());
      const selectedString = Array.from(selectedIds.current).join(",");

      if (selectedIds.current.size > 0) {
        params.set("selected", selectedString);
      } else {
        params.delete("selected");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

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
