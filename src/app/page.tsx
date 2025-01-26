import { InteractiveMap } from "@/components/interactive-map";

export default function Home() {
  return (
    <div style={{ width: "100%", height: "calc(100vh)", overflow: "hidden" }}>
      <InteractiveMap imageSrc="map-absheron.svg" />
    </div>
  );
}
