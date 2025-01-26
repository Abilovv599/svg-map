import { InteractiveMap } from "@/components/interactive-map";

export default function Home() {
  return <InteractiveMap svgWidth={100} svgHeight={100}>
         <rect x="0" y="0" width="100" height="100" fill="#f3f3f3" />
      <rect x="10" y="10" width="30" height="30" fill="lightblue" />
      <circle cx="50" cy="50" r="20" fill="orange" />
      <text x="20" y="90" fontSize="10" fill="black">
        Zoom and Pan me!
      </text>
  </InteractiveMap>
}
