import { useState } from "react";

const screenshots = [
  "/screenshots/screenshot-1.png",
  "/screenshots/screenshot-2.png",
  "/screenshots/screenshot-3.png",
  "/screenshots/screenshot-4.png",
  "/screenshots/screenshot-5.png",
  "/screenshots/screenshot-6.png",
  "/screenshots/screenshot-7.png",
  "/screenshots/screenshot-8.png",
  "/screenshots/screenshot-9.png",
  "/screenshots/screenshot-10.png",
];


export default function GlimpseSection() {
  const [expanded, setExpanded] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  return (
//     <section className="relative py-20">
//       <div className="max-w-4xl mx-auto px-4">

//         {/* Title */}
// <h2 className="text-center mt-4 mb-4 text-3xl md:text-4xl font-bold tracking-tight">
//   <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
//     Take a Glimpse
//   </span>
// </h2>

//         <p className="text-slate-200 text-center max-w-xl mx-auto mb-10">
//           Explore FinEdge's key screens — portfolio, predictions, insights and more.
//         </p>

//         {/* Container */}
//         <div
//           className={`relative transition-all duration-500 ${
//             expanded
//               ? "h-[650px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
//               : "h-[260px] overflow-hidden"
//           }`}
//         >
//           {/* Vertical List */}
//           <div className="flex flex-col gap-6">
//             {screenshots.map((src, index) => (
//               <div
//                 key={index}
//                 className="w-full h-[220px] bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
//                 onClick={() => setZoomImage(src)}
//               >
//                 <img
//                   src={src}
//                   alt={`Screenshot ${index + 1}`}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Fade overlay when collapsed */}
//           {!expanded && (
//             <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
//           )}
//         </div>

//         {/* Expand / Collapse Button */}
//         <div className="flex justify-center mt-6">
//           <button
//             onClick={() => setExpanded(!expanded)}
//             className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-teal-700 text-slate-300 hover:text-white rounded-xl transition-all"
//           >
//             <span>{expanded ? "Show Less" : "Expand"}</span>
//             <svg
//               className={`w-5 h-5 transition-transform ${
//                 expanded ? "rotate-180" : ""
//               }`}
//               fill="none"
//               stroke="currentColor"
//               strokeWidth={2}
//               viewBox="0 0 24 24"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Fullscreen Modal */}
//       {zoomImage && (
//         <div
//           className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
//           onClick={() => setZoomImage(null)}
//         >
//           <img
//             src={zoomImage}
//             className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
//           />
//         </div>
//       )}
//     </section>

<section className="relative pt-12 pb-20 bg-white dark:bg-slate-950">
  <div className="max-w-4xl mx-auto px-4">

    {/* Title */}
    <h2 className="text-center mt-4 mb-4 text-3xl md:text-4xl font-bold tracking-tight 
                   text-neutral-900 dark:text-white">
      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 
                       bg-clip-text text-transparent">
        Take a Glimpse
      </span>
    </h2>

    <p className="text-center max-w-xl mx-auto mb-10 
                  text-neutral-600 dark:text-slate-400">
      Explore FinEdge's key screens — portfolio, predictions, insights and more.
    </p>

    {/* Container */}
    <div
      className={`relative transition-all duration-500 ${
        expanded
          ? "h-[650px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
          : "h-[260px] overflow-hidden"
      }`}
    >
      {/* Vertical List */}
      <div className="flex flex-col gap-6">
        {screenshots.map((src, index) => (
          <div
            key={index}
            className="w-full h-[220px] 
                       bg-neutral-100 dark:bg-slate-800 
                       rounded-xl shadow-md 
                       overflow-hidden cursor-pointer 
                       hover:scale-[1.02] transition-all"
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

      {/* Fade overlay */}
      {!expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-36 
                        bg-gradient-to-t 
                        from-white dark:from-slate-950 
                        to-transparent pointer-events-none" />
      )}
    </div>

    {/* Expand Button */}
    <div className="flex justify-center mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-6 py-3 
                   bg-neutral-200 dark:bg-slate-800 
                   hover:bg-neutral-300 dark:hover:bg-teal-700 
                   text-neutral-800 dark:text-slate-300 hover:text-black dark:hover:text-white 
                   rounded-xl transition-all"
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
      className="fixed inset-0 
                 bg-black/80 dark:bg-black/80 
                 backdrop-blur-sm 
                 flex items-center justify-center 
                 z-50"
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
