import { useState } from "react";

const screenshots = [
  "src/assets/screenshots/screenshot-1.png",
  "src/assets/screenshots/screenshot-2.png",
  "src/assets/screenshots/screenshot-3.png",
  "src/assets/screenshots/screenshot-4.png",
  "src/assets/screenshots/screenshot-5.png",
  "src/assets/screenshots/screenshot-6.png",
  "src/assets/screenshots/screenshot-7.png",
  "src/assets/screenshots/screenshot-8.png",
];

export default function GlimpseSection() {
  const [expanded, setExpanded] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  return (
    <section className="relative py-20">
      <div className="max-w-4xl mx-auto px-4">

        {/* Title */}
        <h2 className="text-4xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          Get a Glimpse
        </h2>
        <p className="text-slate-400 text-center max-w-xl mx-auto mb-10">
          Explore FinEdge's key screens — portfolio, predictions, insights and more.
        </p>

        {/* Container */}
        <div
          className={`relative transition-all duration-500 ${
            expanded
              ? "h-[650px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
              : "h-[260px] overflow-hidden"
          }`}
        >
          {/* Vertical List */}
          <div className="flex flex-col gap-6">
            {screenshots.map((src, index) => (
              <div
                key={index}
                className="w-full h-[220px] bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
                onClick={() => setZoomImage(src)}
              >
                <img
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Fade overlay when collapsed */}
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand / Collapse Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-teal-700 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <span>{expanded ? "Show Less" : "Expand"}</span>
            <svg
              className={`w-5 h-5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
