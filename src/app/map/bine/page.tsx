import { Suspense } from "react";

import { InteractiveMap } from "@/components/interactive-map/interactive-map";
import Map from "@/assets/maps/map-bine.svg";

export default function BineMapPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh)",
        overflow: "hidden",
      }}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <InteractiveMap>
          <Map />
        </InteractiveMap>
      </Suspense>
    </div>
  );
}
