import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as d3 from "d3";

export function useSelectElements() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize selected IDs from URL
    const initialSelected = searchParams.get("selected")?.split(",") || [];
    selectedIds.current = new Set(initialSelected.filter(Boolean));
  }, [searchParams]);

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

  return { selectedIds };
}
