"use client";

import { useSearchParamState } from "@/hooks/useSearchParamState";
import { MapWithoutTextSvg } from "../svg/map-without-text/map-without-text";

const MapContainer: React.FC = () => {
  const [, setSelectedElements] = useSearchParamState("selected", []);

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
