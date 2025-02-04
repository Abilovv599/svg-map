import "./map-controls.css";
import type { FC } from "react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
}) => (
  <div className={"map-controls"}>
    <button onClick={onZoomIn} className={"zoom-btn"}>
      Zoom In
    </button>
    <button onClick={onZoomOut} className={"zoom-btn"}>
      Zoom Out
    </button>
  </div>
);
