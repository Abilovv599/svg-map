import { Suspense } from "react";

import { InteractiveMap } from "@/components/interactive-map";
import Map from "../assets/map-absheron.svg";

export default function Home() {
  return (
    <div style={{ width: "100%", height: "calc(100vh)", overflow: "hidden" }}>
      <Suspense fallback={<div>Loading...</div>}>
        <InteractiveMap>
          <Map />
        </InteractiveMap>
      </Suspense>
    </div>
  );
}
