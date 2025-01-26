import { InteractiveMap } from "@/components/interactive-map";

export default function Home() {
  return (
    <div style={{ width: "100%", height: "calc(100vh)", overflow: "hidden" }}>
      <InteractiveMap imageSrc="Alexander_III_conquest_from_Issos_to_Babylon-fr.svg" />
    </div>
  );
}
