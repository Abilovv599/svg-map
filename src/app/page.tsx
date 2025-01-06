import { Map } from "@/components/map-container/map";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Interactive SVG Map
        </h1>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <Map />
        </div>
      </div>
    </div>
  );
}
