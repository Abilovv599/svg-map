interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls = ({ onZoomIn, onZoomOut }: ZoomControlsProps) => (
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
      onClick={onZoomIn}
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
      onClick={onZoomOut}
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
);
