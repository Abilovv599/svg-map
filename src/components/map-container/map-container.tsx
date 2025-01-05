"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapWithoutTextSvg } from "../svg/map-without-text/map-without-text";

const MapContainer: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  // Initialize state from the URL on load
  useEffect(() => {
    const elementsFromUrl = searchParams.get("selected");
    if (elementsFromUrl) {
      setSelectedElements(elementsFromUrl.split(","));
    }
  }, [searchParams]);

  // Update the URL whenever selectedElements changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedElements.length > 0) {
      params.set("selected", selectedElements.join(","));
    } else {
      params.delete("selected");
    }
    router.replace(`?${params.toString()}`);
  }, [selectedElements, router, searchParams]);

  // Handle clicks and toggle selection
  const handleElementClick = (id: string | null, className: string | null) => {
    const identifier = id || className;
    if (!identifier) return;

    setSelectedElements((prev) => {
      const isSelected = prev.includes(identifier);
      return isSelected
        ? prev.filter((item) => item !== identifier) // Deselect
        : [...prev, identifier]; // Select
    });
  };

  return (
    <div>
      <h1>Interactive Map</h1>
      <MapWithoutTextSvg onElementClick={handleElementClick} />
    </div>
  );
};

export default MapContainer;
