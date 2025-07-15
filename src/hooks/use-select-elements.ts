import { RefObject, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as d3 from "d3";

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSelectElements(
  svgRef: RefObject<SVGSVGElement | null>,
  zoomBehavior: RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useRef<Set<string>>(new Set());
  const isTransitioning = useRef(false);
  const clickHandlersAttached = useRef(false);
  const elementsCache = useRef<NodeListOf<Element> | null>(null);
  const svgBoundsCache = useRef<Bounds | null>(null);

  // Memoize search params to prevent unnecessary re-renders
  const currentIds = useMemo(() => {
    return searchParams.get("ids")?.split(",").filter(Boolean) || [];
  }, [searchParams]);

  // Cache shop elements to avoid repeated DOM queries
  const getShopElements = useCallback((): NodeListOf<Element> => {
    if (!svgRef.current) return document.querySelectorAll('[id*="shop"]');

    if (!elementsCache.current) {
      elementsCache.current = svgRef.current.querySelectorAll('[id*="shop"]');
    }
    return elementsCache.current;
  }, [svgRef]);

  // Memoized bounds calculation
  const calculateSVGBounds = useCallback((): Bounds | null => {
    const shopElements = getShopElements();

    if (shopElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of shopElements) {
      const bbox = (element as SVGGraphicsElement).getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [getShopElements]);

  // Optimized zoom function
  const zoomToSelectedElements = useCallback(() => {
    if (
      !svgRef.current ||
      !zoomBehavior.current ||
      selectedIds.current.size === 0
    ) {
      return;
    }

    isTransitioning.current = true;

    const selectedElements: SVGGraphicsElement[] = [];
    for (const id of selectedIds.current) {
      const element = document.getElementById(id) as SVGGraphicsElement | null;
      if (element) selectedElements.push(element);
    }

    if (selectedElements.length === 0) {
      isTransitioning.current = false;
      return;
    }

    const svgBounds = calculateSVGBounds();
    if (!svgBounds) {
      isTransitioning.current = false;
      return;
    }

    // Optimized bounds calculation for selected elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of selectedElements) {
      const bbox = element.getBBox();
      const ctm = element.getCTM();
      if (!ctm) continue;

      // Only calculate corner points we need
      const corners: Array<[number, number]> = [
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y + bbox.height],
      ];

      for (const [x, y] of corners) {
        const transformed = svgRef.current.createSVGPoint();
        transformed.x = x;
        transformed.y = y;
        const point = transformed.matrixTransform(ctm);

        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    const selectedBounds: Bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;

    const padding = Math.min(svgWidth, svgHeight) * 0.05;
    const paddedBounds: Bounds = {
      x: selectedBounds.x - padding,
      y: selectedBounds.y - padding + 30,
      width: selectedBounds.width + padding * 2,
      height: selectedBounds.height + padding * 2,
    };

    const scaleX = svgWidth / paddedBounds.width;
    const scaleY = svgHeight / paddedBounds.height;
    const scale = Math.min(Math.min(scaleX, scaleY), 4);

    const centerX = paddedBounds.x + paddedBounds.width / 2;
    const centerY = paddedBounds.y + paddedBounds.height / 2;

    const transform = d3.zoomIdentity
      .translate(svgWidth / 2, svgHeight / 2)
      .scale(scale)
      .translate(-centerX, -centerY);

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .call(zoomBehavior.current.transform, transform)
      .on("end", () => {
        isTransitioning.current = false;
      })
      .on("interrupt", () => {
        isTransitioning.current = false;
      });
  }, [svgRef, zoomBehavior, calculateSVGBounds]);

  // Memoized click handler
  const handleElementClick = useCallback(
    (event: Event) => {
      if (isTransitioning.current) {
        event.stopPropagation();
        return;
      }

      event.stopPropagation();
      const target = event.currentTarget as SVGElement;
      const element = d3.select(target);
      const id = target.id;
      const isSelected = element.classed("selected");

      if (!svgRef?.current || !zoomBehavior?.current) {
        return;
      }

      // Clear all selections efficiently
      const shopElements = getShopElements();
      for (const el of shopElements) {
        d3.select(el).classed("selected", false);
      }
      selectedIds.current.clear();

      // Set new selection if element wasn't previously selected
      if (!isSelected) {
        element.classed("selected", true);
        selectedIds.current.add(id);
      }

      // Update URL with batched operation
      const params = new URLSearchParams(searchParams.toString());
      const selectedString = Array.from(selectedIds.current).join(",");

      if (selectedIds.current.size > 0) {
        params.set("ids", selectedString);
        zoomToSelectedElements();
      } else {
        params.delete("ids");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [
      svgRef,
      zoomBehavior,
      getShopElements,
      searchParams,
      pathname,
      router,
      zoomToSelectedElements,
    ],
  );

  // Initialize selections from URL (only runs when currentIds changes)
  useEffect(() => {
    selectedIds.current = new Set(currentIds);

    if (
      selectedIds.current.size > 0 &&
      svgRef.current &&
      zoomBehavior.current
    ) {
      // Update visual selection state
      const shopElements = getShopElements();
      for (const element of shopElements) {
        const isSelected = selectedIds.current.has(element.id);
        d3.select(element).classed("selected", isSelected);
      }

      zoomToSelectedElements();
    }
  }, [
    currentIds,
    svgRef,
    zoomBehavior,
    getShopElements,
    zoomToSelectedElements,
  ]);

  // Attach click handlers only once
  useEffect(() => {
    if (!svgRef.current || clickHandlersAttached.current) return;

    const shopElements = getShopElements();

    for (const element of shopElements) {
      element.addEventListener("click", handleElementClick);
    }

    clickHandlersAttached.current = true;

    // Cleanup function
    return () => {
      if (clickHandlersAttached.current) {
        for (const element of shopElements) {
          element.removeEventListener("click", handleElementClick);
        }
        clickHandlersAttached.current = false;
        elementsCache.current = null;
        svgBoundsCache.current = null; // Clear bounds cache on cleanup
      }
    };
  }, [svgRef, handleElementClick, getShopElements]);

  return { selectedIds, zoomToSelectedElements };
}
