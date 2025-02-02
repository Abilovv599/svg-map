import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as d3 from "d3";

export function useSelectableElements() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useRef<Set<string>>(new Set());

  // Initialize selected IDs from URL on mount or param change
  useEffect(() => {
    const initialSelected = searchParams.get("selected")?.split(",") || [];
    selectedIds.current = new Set(initialSelected.filter(Boolean));
  }, [searchParams]);

  // Handler for updating selection and URL params
  const handleElementClick = useCallback(
    (event: MouseEvent, element: SVGElement) => {
      event.stopPropagation();
      const d3Element = d3.select(element);
      const id = element.id;
      const isSelected = d3Element.classed("selected");

      // Validate maximum selected items
      if (selectedIds.current.size >= 30 && !isSelected) {
        alert("You can only select up to 30 items at a time.");
        return;
      }

      // Toggle selection state
      d3Element.classed("selected", !isSelected);
      if (!isSelected) {
        selectedIds.current.add(id);
      } else {
        selectedIds.current.delete(id);
      }

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      const selectedString = Array.from(selectedIds.current).join(",");
      if (selectedIds.current.size > 0) {
        params.set("selected", selectedString);
      } else {
        params.delete("selected");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const clickableElements = d3.selectAll<SVGElement, unknown>(
      "[id*='click']",
    );
    // Apply initial selection state
    clickableElements.each(function () {
      const element = d3.select(this);
      element.classed("selected", selectedIds.current.has(this.id));
    });
    // Attach click handler
    clickableElements.on("click", function (event) {
      handleElementClick(event as MouseEvent, this as SVGElement);
    });
    // Cleanup if needed (d3 usually cleans up automatically on re-selection)
  }, [handleElementClick]);

  return { selectedIds: selectedIds.current };
}
