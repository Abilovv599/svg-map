import { RefObject, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as d3 from "d3";

// Define a proper interface for the zoom functions.
interface ZoomFunctions {
  zoomToPoint: (x: number, y: number, targetScale: number, duration?: number) => void;
  resetZoom: (duration?: number) => void;
}

export function useSelectElements(
  svgRef: RefObject<SVGSVGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>,
  zoomFunctions: ZoomFunctions
) {
  const { zoomToPoint, resetZoom } = zoomFunctions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useRef<Set<string>>(new Set());
  // Ref to track the currently focused element (by its id)
  const currentFocusedRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize selected IDs from URL
    const initialSelected = searchParams.get("ids")?.split(",") || [];
    selectedIds.current = new Set(initialSelected.filter(Boolean));
  }, [searchParams]);

  useEffect(() => {
    const clickableElementsSelect = d3.selectAll<SVGElement, unknown>("[id*='shop']");

    // Apply initial selection from URL
    clickableElementsSelect.each(function () {
      const element = d3.select(this);
      const id = this.id;
      element.classed("selected", selectedIds.current.has(id));
    });

    clickableElementsSelect.on("click", function (event) {
      event.stopPropagation();
      const element = d3.select(this);
      const id = this.id;
      const wasSelected = element.classed("selected");

      // Enforce maximum selection limit for selection (ignore unselects)
      if (selectedIds.current.size >= 100 && !wasSelected) {
        return alert("You can only select up to 100 items at a time.");
      }

      // Toggle selection state
      const willSelect = !wasSelected;
      element.classed("selected", willSelect);

      if (willSelect) {
        // Only zoom when selecting an element.
        selectedIds.current.add(id);
        if (svgRef.current) {
          // Get pointer coordinates relative to the SVG.
          const [x, y] = d3.pointer(event, svgRef.current);

          // If a different element is already focused, reset and then zoom in.
          if (currentFocusedRef.current && currentFocusedRef.current !== id) {
            resetZoom(300);
            setTimeout(() => {
              zoomToPoint(x, y, 3, 300);
            }, 300);
          } else {
            zoomToPoint(x, y, 3, 300);
          }
          currentFocusedRef.current = id;
        }
      } else {
        // If unselecting, simply update the selectedIds and clear the focused element if needed.
        selectedIds.current.delete(id);
        if (currentFocusedRef.current === id) {
          currentFocusedRef.current = null;
        }
        // No zoom action is performed when unselecting.
      }

      // Update the URL with the new selection.
      const params = new URLSearchParams(searchParams.toString());
      const selectedString = Array.from(selectedIds.current).join(",");
      if (selectedIds.current.size > 0) {
        params.set("ids", selectedString);
      } else {
        params.delete("ids");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams, svgRef, zoomBehavior, zoomToPoint, resetZoom]);

  return { selectedIds };
}
