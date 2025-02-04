import { RefObject, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as d3 from "d3";

export function useSelectElements(
  svgRef: RefObject<SVGSVGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize selected IDs from URL
    const initialSelected = searchParams.get("ids")?.split(",") || [];
    selectedIds.current = new Set(initialSelected.filter(Boolean));
  }, [searchParams]);

  useEffect(() => {
    // Selection and click handler setup
    const clickableElementsSelect = d3.selectAll<SVGElement, unknown>(
      "[id*='shop']",
    );

    // Apply initial selection from URL
    clickableElementsSelect.each(function () {
      const element = d3.select(this);
      const id = this.id
      element.classed("selected", selectedIds.current.has(id));
    });

    // Click handler for selectable elements
    clickableElementsSelect.on("click", function (event) {
      event.stopPropagation(); // Prevent zoom behavior on element click
      const element = d3.select(this);
      const id = this.id
      const isSelected = element.classed("selected");

      // Selected items at a time validation
      if (selectedIds.current.size >= 100 && !isSelected) {
        return alert("You can only select up to 100 items at a time.");
      }

      if (!svgRef?.current || !zoomBehavior?.current) return;

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
        params.set("ids", selectedString);
      } else {
        params.delete("ids");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams, svgRef, zoomBehavior]);

  return { selectedIds };
}
