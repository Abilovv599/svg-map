import { InteractiveMap } from "@/components/interactive-map";
import Map from "../assets/map-absheron-v2.svg";

export default function Home() {
  return (
    <div style={{ width: "100%", height: "calc(100vh)", overflow: "hidden" }}>
      <InteractiveMap>
        <Map />
      </InteractiveMap>
    </div>
  );
}
