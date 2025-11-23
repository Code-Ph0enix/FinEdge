// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// /* ---------------- ICON COMPONENTS ---------------- */

// const TrendingUp = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
//     />
//   </svg>
// );

// const Shield = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//     />
//   </svg>
// );

// const Brain = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
//     />
//   </svg>
// );

// const ChartBar = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
//     />
//   </svg>
// );

// const ArrowRight = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M14 5l7 7m0 0l-7 7m7-7H3"
//     />
//   </svg>
// );

// const Play = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
//     />
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );

// const Download = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
//     />
//   </svg>
// );

// const ExternalLink = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
//     />
//   </svg>
// );

// /* ---------------- TECH STACK WITH LINKS ---------------- */

// const techStackData = [
//   { name: "React", url: "https://react.dev/" },
//   { name: "TypeScript", url: "https://www.typescriptlang.org/" },
//   { name: "Python", url: "https://www.python.org/" },
//   { name: "FastAPI", url: "https://fastapi.tiangolo.com/" },
//   { name: "MongoDB", url: "https://www.mongodb.com/" },
//   { name: "Tailwind CSS", url: "https://tailwindcss.com/" },
//   { name: "scikit-learn", url: "https://scikit-learn.org/" },
//   { name: "Node.js", url: "https://nodejs.org/" },
// ];

// /* ---------------- MARKET INDICES (LIVE DATA PLACEHOLDERS) ---------------- */

// interface MarketIndex {
//   name: string;
//   value: string;
//   change: string;
//   changePercent: string;
//   positive: boolean;
// }

// /* ---------------- MAIN COMPONENT ---------------- */

// const Home = () => {
//   const navigate = useNavigate();
//   const [marketData, setMarketData] = useState<MarketIndex[]>([
//     { name: "NIFTY 50", value: "21,453.95", change: "+125.30", changePercent: "+0.59%", positive: true },
//     { name: "SENSEX", value: "70,842.34", change: "+389.70", changePercent: "+0.55%", positive: true },
//     { name: "NIFTY BANK", value: "45,612.80", change: "-112.45", changePercent: "-0.25%", positive: false },
//   ]);

//   // Check if user is authenticated
//   const checkAuth = () => {
//     const token = localStorage.getItem("authToken");
//     return !!token;
//   };

//   // Handle navigation with auth check
//   const handleAuthenticatedNav = (path: string) => {
//     if (checkAuth()) {
//       navigate(path);
//     } else {
//       alert("Please sign in or sign up to access this feature");
//       navigate("/sign-in");
//     }
//   };

//   // Simulate live market data updates (you can replace with actual API calls)
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setMarketData((prev) =>
//         prev.map((index) => {
//           const randomChange = (Math.random() - 0.5) * 100;
//           const newValue = parseFloat(index.value.replace(/,/g, "")) + randomChange;
//           const change = randomChange;
//           const changePercent = (randomChange / newValue) * 100;

//           return {
//             ...index,
//             value: newValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
//             change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
//             changePercent: change >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
//             positive: change >= 0,
//           };
//         })
//       );
//     }, 5000); // Update every 5 seconds

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">

//       {/* ================ HERO SECTION ================ */}
//       <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
//         {/* Animated Background */}
//         <div className="absolute inset-0">
//           <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-purple-950/20 to-pink-950/30" />
//           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
//           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
//           <div className="inline-flex items-center px-4 py-2 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
//             <span className="text-sm font-medium text-indigo-300">🚀 Student Project - Academic Showcase</span>
//           </div>

//           <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
//             <span className="block text-white">Your AI-Powered</span>
//             <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
//               Investment Partner
//             </span>
//             <span className="block text-white">for Indian Markets</span>
//           </h1>

//           <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
//             Make smarter investment decisions with AI-driven insights, personalized recommendations, and real-time analysis
//           </p>

//           {/* CTA Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
//             <button
//               onClick={() => navigate("/sign-in")}
//               className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-indigo-500/50 transition-all hover:scale-105 flex items-center gap-2"
//             >
//               Get Started
//               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </button>

//             <a
//               href="YOUR_YOUTUBE_LINK_HERE"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="group px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-2"
//             >
//               <Play className="w-5 h-5" />
//               Watch Demo
//             </a>
//           </div>

//           {/* Live Market Indices */}
//           <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
//             {marketData.map((index) => (
//               <div
//                 key={index.name}
//                 className="p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl hover:border-indigo-500/50 transition-all"
//               >
//                 <p className="text-sm text-gray-400 mb-2">{index.name}</p>
//                 <p className="text-2xl font-bold text-white mb-1">{index.value}</p>
//                 <p className={`text-sm font-medium ${index.positive ? "text-green-400" : "text-red-400"}`}>
//                   {index.change} ({index.changePercent})
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ================ FEATURES SECTION ================ */}
//       <section className="relative py-24 px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-bold mb-4">
//               Everything you need to make
//               <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//                 informed investment decisions
//               </span>
//             </h2>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {[
//               {
//                 icon: <TrendingUp className="w-8 h-8" />,
//                 title: "Real-Time Insights",
//                 description: "Live updates on NIFTY, SENSEX with AI-powered analysis",
//                 gradient: "from-cyan-500 to-blue-500",
//               },
//               {
//                 icon: <Shield className="w-8 h-8" />,
//                 title: "Smart Portfolio",
//                 description: "Personalized investment suggestions based on your goals",
//                 gradient: "from-emerald-500 to-green-500",
//               },
//               {
//                 icon: <Brain className="w-8 h-8" />,
//                 title: "Learn & Grow",
//                 description: "Educational resources about Indian markets",
//                 gradient: "from-violet-500 to-purple-500",
//               },
//               {
//                 icon: <ChartBar className="w-8 h-8" />,
//                 title: "Market Analysis",
//                 description: "AI-powered trend predictions and stock analysis",
//                 gradient: "from-amber-500 to-orange-500",
//               },
//             ].map((feature, idx) => (
//               <div
//                 key={idx}
//                 className="group p-8 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 hover:border-indigo-500/50 transition-all hover:scale-105"
//               >
//                 <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
//                   {feature.icon}
//                 </div>
//                 <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
//                 <p className="text-gray-400">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ================ TECH STACK SECTION ================ */}
//       <section className="relative py-24 px-4 bg-gradient-to-b from-gray-900/50 to-gray-950/50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-bold mb-4">
//               <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//                 Built with Modern Technology
//               </span>
//             </h2>
//             <p className="text-gray-400 text-lg">Click on any technology to learn more</p>
//           </div>

//           <div className="flex flex-wrap justify-center gap-4">
//             {techStackData.map((tech) => (
//               <a
//                 key={tech.name}
//                 href={tech.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="group px-6 py-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-indigo-500/50 transition-all hover:scale-110 flex items-center gap-2"
//               >
//                 <span className="font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors">
//                   {tech.name}
//                 </span>
//                 <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
//               </a>
//             ))}
//           </div>
//         </div>
//       </section>

      // {/* ================ SCREENSHOT/DEMO SECTION ================ */}
      // <section className="relative py-24 px-4">
      //   <div className="max-w-7xl mx-auto">
      //     <div className="text-center mb-16">
      //       <h2 className="text-4xl md:text-5xl font-bold mb-4">
      //         <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
      //           Experience the Platform
      //         </span>
      //       </h2>
      //       <p className="text-gray-400 text-lg">See our AI-powered features in action</p>
      //     </div>

      //     <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-8 text-center">
      //       <p className="text-gray-400 mb-4">
      //         📸 Add your application screenshots here to showcase the interface
      //       </p>
      //       <p className="text-sm text-gray-500">
      //         Tip: Include screenshots of dashboard, analysis, and portfolio features
      //       </p>
      //     </div>
      //   </div>
      // </section>

      // {/* ================ FOOTER WITH FUNCTIONAL LINKS ================ */}
      // <footer className="relative border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      //   <div className="max-w-7xl mx-auto px-4 py-16">
      //     <div className="grid md:grid-cols-4 gap-12">
      //       {/* Logo + About */}
      //       <div className="space-y-4">
      //         <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
      //           FinEdge
      //         </h3>
      //         <p className="text-gray-400">
      //           AI-powered investment partner for Indian markets. A student project showcasing modern web development and ML integration.
      //         </p>
      //       </div>

      //       {/* Quick Links */}
      //       <div>
      //         <h4 className="font-semibold text-white mb-4">Quick Links</h4>
      //         <ul className="space-y-3">
      //           <li>
      //             <button
      //               onClick={() => handleAuthenticatedNav("/dashboard")}
      //               className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
      //             >
      //               Dashboard
      //             </button>
      //           </li>
      //           <li>
      //             <button
      //               onClick={() => handleAuthenticatedNav("/portfolio")}
      //               className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
      //             >
      //               Portfolio
      //             </button>
      //           </li>
      //           <li>
      //             <button
      //               onClick={() => handleAuthenticatedNav("/portfolio/learn")}
      //               className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
      //             >
      //               Learn (Money Matters)
//                   </button>
//                 </li>
//                 <li>
//                   <button
//                     onClick={() => handleAuthenticatedNav("/market-news")}
//                     className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
//                   >
//                     Market News (Money Pulse)
//                   </button>
//                 </li>
//               </ul>
//             </div>

//             {/* Resources */}
//             <div>
//               <h4 className="font-semibold text-white mb-4">Resources</h4>
//               <ul className="space-y-3">
//                 <li>
//                   <a
//                     href="/project-report.pdf"
//                     download
//                     className="text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
//                   >
//                     <Download className="w-4 h-4" />
//                     Documentation
//                   </a>
//                 </li>
//                 <li>
//                   <button
//                     onClick={() => navigate("/api-docs")}
//                     className="text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-2 text-left"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     API Reference
//                   </button>
//                 </li>
//                 <li>
//                   <a
//                     href="/.env.example"
//                     download
//                     className="text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
//                   >
//                     <Download className="w-4 h-4" />
//                     Environment Setup
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             {/* Contact & Support */}
//             <div>
//               <h4 className="font-semibold text-white mb-4">Contact & Support</h4>
//               <ul className="space-y-3">
//                 <li>
//                   <a
//                     href="mailto:eeshanyajoshi@gmail.com,rohitdeshpande@example.com,shubhjalui@example.com"
//                     className="text-gray-400 hover:text-indigo-400 transition-colors"
//                   >
//                     Email Team
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="tel:+91XXXXXXXXXX"
//                     className="text-gray-400 hover:text-indigo-400 transition-colors"
//                   >
//                     Call Us
//                   </a>
//                 </li>
//                 <li>
//                   <button
//                     onClick={() => navigate("/faq")}
//                     className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
//                   >
//                     FAQ
//                   </button>
//                 </li>
//                 <li>
//                   <button
//                     onClick={() => navigate("/help")}
//                     className="text-gray-400 hover:text-indigo-400 transition-colors text-left"
//                   >
//                     Help Center
//                   </button>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-500 text-sm">© 2024 FinEdge. Student Academic Project.</p>
//             <p className="text-gray-500 text-sm">Made with ❤️ by Eeshanya, Rohit & Shubh</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Home;




















































































































// import { Link } from 'react-router-dom';
// import { TrendingUp, Shield, Brain, BarChart as ChartBar, ArrowRight } from 'lucide-react';
// import { useTheme } from '../context/ThemeContext';

// const features = [
//   {
//     icon: <TrendingUp className="h-6 w-6 text-white" />,
//     title: 'Real-Time Indian Market Insights',
//     description: 'Get instant updates on NIFTY, SENSEX, and personalized insights powered by AI.'
//   },
//   {
//     icon: <Shield className="h-6 w-6 text-white" />,
//     title: 'Smart Portfolio Management',
//     description: 'Receive tailored investment suggestions for Indian markets based on your goals.'
//   },
//   {
//     icon: <Brain className="h-6 w-6 text-white" />,
//     title: 'Learn & Grow',
//     description: 'Access educational resources about Indian markets and improve your financial literacy.'
//   },
//   {
//     icon: <ChartBar className="h-6 w-6 text-white" />,
//     title: 'Market Analysis',
//     description: 'Stay ahead with AI-powered analysis of Indian stock market trends and predictions.'
//   }
// ];

// const Home = () => {
//   const { theme } = useTheme();
  
//   return (
//     <div className="min-h-screen ">
//       {/* Hero Section */}
//       <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
//         <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
//         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
//         <div className="max-w-7xl mx-auto">
//           <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
//             <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
//               <div className="sm:text-center lg:text-left">
//                 <div className="inline-flex items-center px-4 py-1.5 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
//                   <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">Powered by AI</span>
//                 </div>
//                 <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
//                   <span className="block">Your AI-Powered</span>
//                   <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600">Investment Partner for Indian Markets!</span>
//                 </h1>
//                 <p className="mt-3 text-base text-gray-600 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
//                   Make smarter investment decisions in Indian markets with AI-driven insights, personalized recommendations, and real-time analysis of NIFTY and SENSEX.
//                 </p>
//                 <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
//                   <Link to="/sign-up" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
//                     Get Started
//                     <ArrowRight className="ml-2 h-5 w-5" />
//                   </Link>
//                   <Link to="/portfolio/learn" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-indigo-200 dark:border-indigo-800 text-base font-medium rounded-lg text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
//                     Learn More
//                   </Link>
//                 </div>
                
//                 {/* Stats */}
//                 <div className="mt-10 pt-6 grid grid-cols-3 gap-6 border-t border-gray-200 dark:border-gray-700">
//                   <div>
//                     <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹10Cr+</p>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Assets Analyzed</p>
//                   </div>
//                   <div>
//                     <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">98%</p>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy Rate</p>
//                   </div>
//                   <div>
//                     <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">5000+</p>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
//                   </div>
//                 </div>
//               </div>
//             </main>
//           </div>
//         </div>
//         <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
//           <div className="relative h-56 w-full sm:h-72 md:h-80 lg:w-4/5 lg:h-4/5 lg:mx-auto lg:my-auto lg:mt-24">
//             <img
//               className="h-full w-full object-cover lg:rounded-xl shadow-2xl"
//               src="https://www.bibs.co.in/blog-image/1708945824.jpeg"
//               alt="Analytics Dashboard"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent rounded-xl"></div>
//           </div>
//         </div>
//       </div>

     

//       {/* Team Section */}
//       <div className="bg-white dark:bg-gray-900 py-16 sm:py-24">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center">
//               <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
//               Meet Our Team
//               </h2>
//               <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
//               The brilliant minds behind FinEdge's AI-powered financial solutions.
//               </p>
//             </div>
//           <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
//             {[
//               {
//                 name: 'Rohit Deshpande',
//                 role: 'Full Stack Developer',
//                 image: 'https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/rohitbhai.jpg?raw=true',  // Add your image to public/team folder
//                 description: 'I’m passionate about building robust, scalable software and applying data-driven approaches to solve real-world problems. I enjoy working across the stack and exploring modern tools and frameworks. Curiosity, consistency, and a drive for continuous improvement guide my work. I’m eager to contribute as a software engineer who not only writes clean, efficient code but also helps shape innovative, high-impact products.',
//                 highlight: '16010122041',
//                 github: 'https://github.com/irohitdeshpande',
//                 linkedin: 'https://linkedin.com/in/irohitdeshpande'
//               },
//               {
//                 name: 'Eeshanya Joshi',
//                 role: 'Fullstack Developer',
//                 image: 'https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/eeshanyabhai.jpg?raw=true',  // Add your image to public/team folder
//                 description: 'A Final-year Computer Engineering student with a strong foundation and hands-on experience in academic and personal projects spanning software development and AI/ML. Adaptable, collaborative, and eager to apply technology to real-world challenges. Driven by clarity, consistency, and continuous learning.',
//                 highlight: '16010122074',
//                 github: 'https://github.com/Code-Ph0enix',
//                 linkedin: 'https://www.linkedin.com/in/eeshanyajoshi/'
//               },
//               {
//                 name: 'Shubh Jalui',
//                 role: 'AI/ML Developer',
//                 image: '	https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/self.jpg?raw=true',  // Add your image to public/team folder
//                 description: 'A final year Engineering student with hands-on internship experience in Power BI and data science, and practical ML projects like a Spam Classifier and Face Mask Detector. Proficient in Python, SQL, TensorFlow and DAX, I build end-to-end analytics and ML solutions that turn raw data into actionable insights. Seeking a growth-oriented role to apply and expand my technical skills while delivering measurable impact',
//                 highlight: '16010122072',
//                 github: 'https://github.com/sJalui',
//                 linkedin: 'https://www.linkedin.com/in/shubh-jalui-1923b1259/'
//               }
//             ].map((member) => (
//               <div key={member.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg flex flex-col">
//                 {/* Image Container with fixed aspect ratio and highlight effect */}
//                 <div className="relative pt-[100%]">
//                   <div className="absolute inset-0 p-2">
//                     <div className="relative h-full w-full overflow-hidden rounded-lg group">
//                       <img
//                         className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
//                         src={member.image}
//                         alt={member.name}
//                       />
//                       {/* Highlight overlay */}
//                       <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="p-6 flex-1 flex flex-col">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
//                       <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{member.role}</p>
//                     </div>
//                     <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
//                       {member.highlight}
//                     </span>
//                   </div>
//                   <p className="text-base text-gray-500 dark:text-gray-400 flex-1">
//                     {member.description}
//                   </p>
                  
//                   {/* Social Links - Fixed at bottom */}
//                   <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center space-x-6">
//                     <a 
//                       href={member.github}
//                       target="_blank"
//                       rel="noopener noreferrer" 
//                       className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
//                     >
//                       <span className="sr-only">GitHub</span>
//                       <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
//                         <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
//                       </svg>
//                     </a>
//                     <a 
//                       href={member.linkedin}
//                       target="_blank"
//                       rel="noopener noreferrer" 
//                       className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
//                     >
//                       <span className="sr-only">LinkedIn</span>
//                       <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
//                       </svg>
//                     </a>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//        {/* Features Section */}
//        <div className="py-12 bg-gray-50 dark:bg-gray-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center">
//             <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
//               Powerful Features for Smart Investing
//             </h2>
//             <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
//               Everything you need to make informed investment decisions and grow your wealth.
//             </p>
//           </div>

//           <div className="mt-10">
//             <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
//               {features.map((feature, index) => (
//                 <div key={index} className="pt-6">
//                   <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <div className="-mt-6">
//                       <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md shadow-lg">
//                         {feature.icon}
//                       </div>
//                       <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
//                         {feature.title}
//                       </h3>
//                       <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
//                         {feature.description}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;














import { useState, useEffect } from "react";

/* ---------------- ICON COMPONENTS ---------------- */

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const ChartBar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/* ---------------- DATA ARRAYS ---------------- */

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Indian Market Insights",
    description: "Get instant updates on NIFTY, SENSEX, and personalized insights powered by AI.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Shield,
    title: "Smart Portfolio Management",
    description: "Receive tailored investment suggestions for Indian markets based on your goals.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Brain,
    title: "Learn & Grow",
    description: "Access educational resources about Indian markets and improve financial literacy.",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: ChartBar,
    title: "Market Analysis",
    description: "Stay ahead with AI-powered analysis of Indian stock market trends and predictions.",
    color: "from-orange-500 to-amber-400",
  },
];

const team = [
  {
    name: "Rohit Deshpande",
    role: "Full Stack Developer",
    image:
      "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/rohitbhai.jpg?raw=true",
    description:
      "Passionate about building robust, scalable software and applying data-driven approaches.",
    highlight: "16010122041",
    github: "https://github.com/irohitdeshpande",
    linkedin: "https://linkedin.com/in/irohitdeshpande",
  },
  {
    name: "Eeshanya Joshi",
    role: "Fullstack Developer",
    image:
      "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/eeshanyabhai.jpg?raw=true",
    description:
      "Final-year Computer Engineering student with strong foundation in software development and AI/ML.",
    highlight: "16010122074",
    github: "https://github.com/Code-Ph0enix",
    linkedin: "https://www.linkedin.com/in/eeshanyajoshi/",
  },
  {
    name: "Shubh Jalui",
    role: "AI/ML Developer",
    image: "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/self.jpg?raw=true",
    description: "Final year Engineering student with hands-on experience in Power BI and data science.",
    highlight: "16010122072",
    github: "https://github.com/sJalui",
    linkedin: "https://www.linkedin.com/in/shubh-jalui-1923b1259/",
  },
];

const stats = [
  { value: "₹10Cr+", label: "Assets Analyzed", suffix: "" },
  { value: "98", label: "Accuracy Rate", suffix: "%" },
  { value: "5000", label: "Active Users", suffix: "+" },
];

/* ---------------- ANIMATED COUNTER ---------------- */

const AnimatedCounter = ({ end, suffix }: { end: string; suffix: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const num = parseInt(end.replace(/[^0-9]/g, ""));
    const duration = 2000;
    const steps = 60;
    const increment = num / steps;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else setCount(Math.floor(current));
    }, interval);

    return () => clearInterval(timer);
  }, [end]);

  const prefix = end.includes("₹") ? "₹" : "";

  return <span>{prefix + count.toLocaleString() + suffix}</span>;
};

/* ---------------- FLOATING PARTICLE ---------------- */

const FloatingParticle = ({ delay, x }: { delay: number; x: number }) => (
  <div
    className="absolute w-2 h-2 bg-indigo-400/30 rounded-full animate-pulse"
    style={{
      left: `${x}%`,
      top: "20%",
      animationDelay: `${delay}s`,
      animationDuration: "3s",
    }}
  />
);

/* ---------------- TEAM CARD ---------------- */

const TeamCard = ({ member }: { member: any }) => {
  const [showLinks, setShowLinks] = useState(false);

  return (
    <div
      className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2"
      onMouseEnter={() => setShowLinks(true)}
      onMouseLeave={() => setShowLinks(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-pulse opacity-50" />

          <img
            src={member.image}
            alt={member.name}
            className="relative w-full h-full object-cover rounded-full border-4 border-gray-700 group-hover:border-indigo-500 transition-all duration-500"
          />

          <div
            className={`absolute inset-0 rounded-full bg-black/60 flex items-center justify-center gap-4 transition-opacity duration-300 ${
              showLinks ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* LinkedIn */}
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>

            {/* GitHub */}
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.13-1.703C6.61 19.44 6 17.48 6 17.48c-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="text-center">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full mb-2">
            {member.highlight}
          </span>

          <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
          <p className="text-indigo-400 font-medium text-sm mb-3">{member.role}</p>
          <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- HOME PAGE ---------------- */

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* ---------------- Animated Background ---------------- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-gray-950 to-purple-950/50" />

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        {[10, 25, 40, 55, 70, 85].map((x, i) => (
          <FloatingParticle key={i} x={x} delay={i * 0.5} />
        ))}
      </div>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-indigo-300">
                  AI-Powered • Live Markets
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-white">Your Smart</span>
                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Investment Partner
                </span>
                <span className="block text-white text-3xl lg:text-4xl mt-2 font-normal">
                  for Indian Markets
                </span>
              </h1>

              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Make smarter investment decisions with AI-driven insights, personalized
                recommendations, and real-time analysis of NIFTY and SENSEX.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="group px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all hover:bg-indigo-500/10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Play className="w-4 h-4 text-indigo-400" />
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Market Box */}
            <div className="relative hidden lg:block">
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 border border-gray-700/50 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">Live Market</span>
                  </div>
                  <span className="text-xs text-gray-500">Updated just now</span>
                </div>

                <div className="space-y-4">
                  {[
                    { name: "NIFTY 50", value: "24,834.85", change: "+1.23%", up: true },
                    { name: "SENSEX", value: "81,765.42", change: "+0.98%", up: true },
                    { name: "BANKNIFTY", value: "52,341.20", change: "-0.45%", up: false },
                  ].map((idx, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">{idx.name}</p>
                        <p className="text-2xl font-bold text-white mt-1">{idx.value}</p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-lg ${
                          idx.up
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {idx.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar Graph */}
                <div className="mt-6 h-32 bg-gradient-to-t from-indigo-600/20 to-transparent rounded-xl flex items-end justify-around px-4 pb-4">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                    <div
                      key={i}
                      className="w-4 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-sm hover:from-indigo-400 hover:to-purple-400 transition-all"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------- FEATURES SECTION -------------- */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              Powerful Tools for{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Smart Investing
              </span>
            </h2>
            <p className="text-xl text-gray-400 mt-4 max-w-2xl mx-auto">
              Everything you need to make informed investment decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-gray-900/50 rounded-2xl p-8 border border-gray-800 hover:border-indigo-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.description}</p>

                <div className="mt-6 flex items-center text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more{" "}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------- TEAM SECTION -------------- */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">
              Our Team
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              Meet the{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Creators
              </span>
            </h2>
            <p className="text-xl text-gray-400 mt-4 max-w-2xl mx-auto">
              The brilliant minds behind FinEdge's AI-powered financial solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((m, i) => (
              <TeamCard key={i} member={m} />
            ))}
          </div>
        </div>
      </section>

      {/* -------------- CTA SECTION -------------- */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-center overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Start Investing Smarter?
              </h2>

              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of investors who trust FinEdge.
              </p>

              <button className="px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all hover:-translate-y-1">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------- FOOTER -------------- */}
      <footer className="relative border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Logo + About */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                FinEdge
              </h3>
              <p className="text-gray-400">
                AI-powered investment partner for Indian markets.
              </p>
            </div>

            {/* Footer Links */}
            {[
              { title: "Product", links: ["Features", "Pricing", "API", "Integrations"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© 2024 FinEdge. All rights reserved.</p>
            <p className="text-gray-500 text-sm">Made with ❤ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}







































































// // src/pages/Home.tsx
// import { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { useUser } from "@clerk/clerk-react";
// import { useTheme } from "../context/ThemeContext";
// import { useMarketSummary } from "../hooks/useStockData";

// type MarketItem = {
//   name: string;
//   symbol: string;
//   value: number | string;
//   change: string;
//   up: boolean;
// };

// const PlayIcon = ({ className = "w-4 h-4" }) => (
//   <svg className={className} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M8 5v14l11-7z" />
//   </svg>
// );

// export default function Home() {
//   const navigate = useNavigate();
//   const { isSignedIn } = useUser();
//   const { theme, toggleTheme } = useTheme();

//   // -------------------- MARKET DATA --------------------
//   const { summary, loading, error, refetch } = useMarketSummary(30000);

//   const [market, setMarket] = useState<MarketItem[]>([
//     { name: "NIFTY 50", symbol: "NIFTY", value: "—", change: "—", up: true },
//     { name: "SENSEX", symbol: "SENSEX", value: "—", change: "—", up: true },
//     { name: "BANKNIFTY", symbol: "BANKNIFTY", value: "—", change: "—", up: true },
//   ]);

//   useEffect(() => {
//     if (!loading && summary) {
//       setMarket([
//         {
//           name: "NIFTY 50",
//           symbol: "NIFTY",
//           value: summary.NIFTY.value,
//           change: `${summary.NIFTY.perChange}%`,
//           up: summary.NIFTY.perChange >= 0,
//         },
//         {
//           name: "SENSEX",
//           symbol: "SENSEX",
//           value: summary.SENSEX.value,
//           change: `${summary.SENSEX.perChange}%`,
//           up: summary.SENSEX.perChange >= 0,
//         },
//         {
//           name: "BANKNIFTY",
//           symbol: "BANKNIFTY",
//           value: summary.BANKNIFTY.value,
//           change: `${summary.BANKNIFTY.perChange}%`,
//           up: summary.BANKNIFTY.perChange >= 0,
//         },
//       ]);
//     }
//   }, [summary, loading]);

//   // -------------------- ROUTE PROTECTION --------------------
//   const go = (route: string) => {
//     if (!isSignedIn) {
//       navigate("/sign-in");
//       return;
//     }
//     navigate(route);
//   };

//   // -------------------- FEATURES --------------------
//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   const features = useMemo(
//     () => [
//       {
//         id: "market",
//         title: "Real-Time Market Insights",
//         short: "Live updates for NIFTY, SENSEX, BANKNIFTY.",
//         long: "Detailed explanation of how market data is fetched and processed.",
//         color: "from-indigo-500 to-purple-400",
//       },
//       {
//         id: "portfolio",
//         title: "Smart Portfolio Management",
//         short: "AI-driven insights for your investments.",
//         long: "Extended description placeholder for portfolio logic.",
//         color: "from-emerald-500 to-teal-400",
//       },
//       {
//         id: "learning",
//         title: "Interactive Learning",
//         short: "Money Matters modules and financial education.",
//         long: "Longer educational info placeholder.",
//         color: "from-purple-500 to-pink-400",
//       },
//     ],
//     []
//   );

//   const demoItems = [
//     { id: "d1", src: "/assets/demo-1.gif" },
//     { id: "d2", src: "/assets/screenshot-1.png" },
//     { id: "d3", src: "/assets/screenshot-2.png" },
//   ];
//   const [demoIndex, setDemoIndex] = useState(0);

//   useEffect(() => {
//     const id = setInterval(
//       () => setDemoIndex((i) => (i + 1) % demoItems.length),
//       4000
//     );
//     return () => clearInterval(id);
//   }, [demoItems.length]);

//   const stats = [
//     { value: "Prototype", label: "Stage" },
//     { value: "Academic", label: "Purpose" },
//     { value: "Team", label: "Type" },
//     { value: "Final Year", label: "Year" },
//   ];

//   return (
//     <div className="min-h-screen">
//       {/* HERO SECTION */}
//       <section className="relative bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
//         <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
//                 Your Smart{" "}
//                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-400">
//                   Investment Partner
//                 </span>
//               </h1>

//               <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-xl">
//                 Make smarter investment decisions with AI-driven insights.
//               </p>

//               <div className="mt-8 flex flex-wrap gap-4">
//                 <button
//                   onClick={() => navigate("/sign-up")}
//                   className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
//                 >
//                   Get Started
//                 </button>

//                 <button
//                   onClick={() =>
//                     window.open("https://www.youtube.com/watch?v=YOUR_LINK", "_blank")
//                   }
//                   className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center gap-2"
//                 >
//                   <span className="w-8 h-8 bg-white/10 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
//                     <PlayIcon />
//                   </span>
//                   Watch Demo
//                 </button>

//                 <button
//                   onClick={toggleTheme}
//                   className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700"
//                 >
//                   {theme === "dark" ? "Light" : "Dark"}
//                 </button>
//               </div>

//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
//                 {stats.map((s) => (
//                   <div
//                     key={s.label}
//                     className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border dark:border-gray-700 text-center"
//                   >
//                     <div className="text-lg font-bold">{s.value}</div>
//                     <div className="text-xs text-gray-500 mt-1">{s.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* MARKET WIDGET */}
//             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-lg">
//               <h3 className="font-semibold mb-4 flex items-center gap-2">
//                 <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
//                 Live Market (30s refresh)
//               </h3>

//               {loading ? (
//                 <div className="space-y-3 animate-pulse">
//                   <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
//                   <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
//                   <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {market.map((m, i) => (
//                     <div
//                       key={i}
//                       className="p-3 flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-800"
//                     >
//                       <div>
//                         <p className="font-medium">{m.name}</p>
//                         <p className="text-xs text-gray-500">{m.symbol}</p>
//                       </div>

//                       <div className="text-right">
//                         <p className="text-xl font-bold">
//                           {typeof m.value === "number"
//                             ? m.value.toLocaleString()
//                             : m.value}
//                         </p>
//                         <p className={m.up ? "text-green-400" : "text-red-400"}>
//                           {m.change}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {error && (
//                 <p className="text-xs text-red-400 mt-3">
//                   Failed to fetch data.{" "}
//                   <button className="underline" onClick={refetch}>
//                     Retry
//                   </button>
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="py-20 bg-gray-50 dark:bg-gray-950">
//         <div className="max-w-7xl mx-auto px-4">
//           <h2 className="text-center text-3xl font-bold mb-12">
//             Powerful Tools for{" "}
//             <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-400">
//               Smart Investing
//             </span>
//           </h2>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((f) => (
//               <div
//                 key={f.id}
//                 className="p-6 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl hover:shadow-xl transition"
//               >
//                 <div
//                   className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}
//                 >
//                   <span className="text-xl">★</span>
//                 </div>

//                 <h3 className="font-semibold text-lg">{f.title}</h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                   {f.short}
//                 </p>

//                 <button
//                   className="text-indigo-500 mt-3"
//                   onClick={() =>
//                     setExpandedId(expandedId === f.id ? null : f.id)
//                   }
//                 >
//                   {expandedId === f.id ? "Show less" : "Learn more"}
//                 </button>

//                 {expandedId === f.id && (
//                   <p className="mt-3 text-sm text-gray-300">{f.long}</p>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* COMMENT: To add more features → push more objects into the `features` array above. */}
//         </div>
//       </section>

//       {/* DEMO SECTION */}
//       <section className="py-20">
//         <div className="max-w-7xl mx-auto px-4">
//           <h2 className="text-center text-3xl font-bold mb-8">
//             Experience the Platform
//           </h2>

//           <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-2xl">
//             <div className="grid lg:grid-cols-2 gap-6 items-center">
//               <img
//                 src={demoItems[demoIndex].src}
//                 className="rounded-xl w-full h-72 object-cover"
//               />

//               <div>
//                 <h3 className="text-xl font-bold">NOTICE</h3>
//                 <p className="mt-2 text-gray-600 dark:text-gray-300">
//                   Replace screenshots with GIFs for a more lively experience.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="bg-gray-50 dark:bg-gray-950 py-12 border-t dark:border-gray-800">
//         <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-10">
//           <div>
//             <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-400 bg-clip-text text-transparent">
//               FinEdge
//             </h3>
//             <p className="mt-3 text-gray-600 dark:text-gray-400">
//               AI-powered investment partner.
//             </p>
//           </div>

//           <div>
//             <h4 className="font-semibold mb-3">Quick Links</h4>
//             <ul className="space-y-2">
//               <li>
//                 <button onClick={() => go("/portfolio")}>Dashboard</button>
//               </li>
//               <li>
//                 <button onClick={() => go("/portfolio")}>Portfolio</button>
//               </li>
//               <li>
//                 <button onClick={() => go("/portfolio/financial-path")}>
//                   Financial Path Journey
//                 </button>
//               </li>
//               <li>
//                 <button onClick={() => go("/portfolio/recommendations")}>
//                   AI Advisor
//                 </button>
//               </li>
//               <li>
//                 <button onClick={() => go("/portfolio/learn")}>Learn</button>
//               </li>
//               <li>
//                 <button onClick={() => go("/portfolio/money-pulse")}>
//                   Market News
//                 </button>
//               </li>
//             </ul>
//           </div>

//           <div>
//             <h4 className="font-semibold mb-3">Resources</h4>
//             <ul className="space-y-2">
//               <li>
//                 <a href="/assets/FinEdge_Report.pdf" download>
//                   Documentation (PDF)
//                 </a>
//               </li>
//               <li>
//                 <a href="/api-docs.html" target="_blank">
//                   API Reference (HTML)
//                 </a>
//               </li>
//               <li>
//                 <a href="mailto:team@finedge.local">Support</a>
//               </li>
//               <li>
//                 <a href="tel:+911234567890">Contact</a>
//               </li>
//             </ul>
//           </div>

//           <div>
//             <h4 className="font-semibold mb-3">Built With</h4>
//             <div className="flex flex-col gap-3">
//               <a href="https://react.dev" target="_blank">
//                 React Docs
//               </a>
//               <a href="https://tailwindcss.com/docs" target="_blank">
//                 Tailwind Docs
//               </a>
//               <a href="https://www.python.org" target="_blank">
//                 Python ML Docs
//               </a>
//             </div>
//           </div>
//         </div>

//         <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-sm">
//           © {new Date().getFullYear()} FinEdge — Student Project
//         </p>
//       </footer>
//     </div>
//   );
// }


// // src/pages/Home.tsx
// /**
//  * FINAL Home.tsx — updated per user's spec
//  *
//  * Notes:
//  * - Auth: uses Clerk useUser() (isSignedIn). See App.tsx for route names. :contentReference[oaicite:6]{index=6}
//  * - Theme: uses your ThemeContext useTheme() (light/dark). :contentReference[oaicite:7]{index=7}
//  * - Market data: uses your useStockData hook if available. If your hook file is in a different path,
//  *   change the import below: import useStockData from 'path/to/useStockData';
//  * - Place FinEdge_Report.pdf in public/assets/FinEdge_Report.pdf
//  * - Place api-docs.html in public/api-docs.html (or use PDF version)
//  */

// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useUser } from "@clerk/clerk-react";
// import { useTheme } from "../context/ThemeContext"; // adjust path if needed. :contentReference[oaicite:8]{index=8}

// // Try to import your hook. If path differs, update this import.
// import {useMarketSummary} from "../hooks/useStockData"; // <-- If your hook is located elsewhere, change this path.

// type MarketItem = {
//   name: string;
//   symbol?: string;
//   value: string | number;
//   change?: string;
//   up?: boolean;
// };

// const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
//   <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
// );

// export default function Home() {
//   const navigate = useNavigate();
//   const { isSignedIn } = useUser(); // Clerk auth. Redirect to /sign-in if not signed in. :contentReference[oaicite:9]{index=9}
//   const { theme, toggleTheme } = useTheme(); // theme toggler (light/dark). :contentReference[oaicite:10]{index=10}

//   // ---------------------
//   // Market data logic
//   // ---------------------
//   // Try to use your hook if available. Hook should preferably return:
//   // { data: MarketItem[], loading: boolean, error: any, refresh: () => void }
//   // If hook not available or returns undefined, we fallback to fetch.
//   const maybeHook = (useStockData as any) || null;
//   const hookResult = maybeHook ? maybeHook(["NIFTY", "SENSEX", "BANKNIFTY"]) : null;

//   const [market, setMarket] = useState<MarketItem[]>([
//     // fallback placeholders (only used while loading/fetch fails)
//     { name: "NIFTY 50", symbol: "NIFTY", value: "—", change: "—", up: true },
//     { name: "SENSEX", symbol: "SENSEX", value: "—", change: "—", up: true },
//     { name: "BANKNIFTY", symbol: "BANKNIFTY", value: "—", change: "—", up: false },
//   ]);
//   const [loadingMarket, setLoadingMarket] = useState<boolean>(true);
//   const [marketError, setMarketError] = useState<any>(null);

//   // helper: fetch fallback
//   async function fetchMarketFallback() {
//     setLoadingMarket(true);
//     setMarketError(null);
//     try {
//       const res = await fetch("/api/market/quote?symbols=NIFTY,SENSEX,BANKNIFTY");
//       if (!res.ok) throw new Error("network");
//       const data = await res.json();
//       if (Array.isArray(data) && data.length > 0) {
//         setMarket(data.slice(0, 3));
//       }
//     } catch (err) {
//       // keep fallback placeholders (UI will show graceful message)
//       setMarketError(err);
//     } finally {
//       setLoadingMarket(false);
//     }
//   }

//   // wire hook if available
//   useEffect(() => {
//     let unsub: any = null;
//     if (hookResult && typeof hookResult === "object") {
//       // assume hookResult has data/loading/error and maybe auto-refresh
//       const setter = () => {
//         try {
//           if (hookResult.data && Array.isArray(hookResult.data) && hookResult.data.length > 0) {
//             setMarket(hookResult.data.slice(0, 3));
//           }
//           setLoadingMarket(!!hookResult.loading);
//           setMarketError(hookResult.error || null);
//         } catch (e) {
//           // ignore
//         }
//       };
//       // initial
//       setter();
//       // If hook provides subscribe/refresh mechanism, attempt to use it (best-effort).
//       if (typeof hookResult.subscribe === "function") {
//         unsub = hookResult.subscribe(setter);
//       } else {
//         // fallback: poll every 30s if hook exists but doesn't auto-update
//         if (typeof hookResult.refresh === "function") {
//           const id = setInterval(() => {
//             try { hookResult.refresh(); } catch (e) { /* noop */ }
//           }, 30000);
//           unsub = () => clearInterval(id);
//         }
//       }
//     } else {
//       // no hook: use fallback fetch + polling
//       fetchMarketFallback();
//       const id = setInterval(fetchMarketFallback, 30000);
//       unsub = () => clearInterval(id);
//     }
//     return () => { if (typeof unsub === "function") unsub(); };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // run once

//   // ---------------------
//   // CTA / Protected navigation handlers
//   // ---------------------
//   const handleProtectedRoute = (route: string) => {
//     if (!isSignedIn) {
//       // consistent with your app: redirect to Clerk sign-in route
//       // Your AuthComponent handles Clerk sign-in. Use `/sign-in`.
//       navigate("/sign-in");
//       return;
//     }
//     navigate(route);
//   };

//   const goToSignIn = () => navigate("/sign-in");

//   // ---------------------
//   // Features: expandable
//   // ---------------------
//   type Feature = {
//     id: string;
//     title: string;
//     short: string;
//     long: string;
//     icon?: React.ReactNode;
//     color?: string; // tailwind gradient
//   };

//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   const features: Feature[] = useMemo(() => ([
//     {
//       id: "market-insights",
//       title: "Real-Time Market Insights",
//       short: "Live updates & quick glance on major indices (NIFTY / SENSEX / BANKNIFTY).",
//       long: "Full explanation, placeholders and extended descriptions go here. Replace this text with deeper explanation about how the data is fetched, smoothing, alerts and how to interpret changes. You can include links to official NSE docs or a methodology section.",
//       icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18" strokeWidth="1.5"/></svg>,
//       color: "from-blue-500 to-cyan-400",
//     },
//     {
//       id: "portfolio",
//       title: "Smart Portfolio Management",
//       short: "Personalized suggestions and risk analysis for your holdings.",
//       long: "Detailed algorithms & assumptions for portfolio recommendations should go here. Add examples of how to add assets, rebalance, and the risk band calculation. This placeholder is intentionally long for the 'Learn more' expansion.",
//       icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M4 12h16M4 17h10" strokeWidth="1.5"/></svg>,
//       color: "from-emerald-500 to-teal-400",
//     },
//     {
//       id: "learning",
//       title: "Learn & Resources",
//       short: "Guides, explainers, and interactive lessons (Money Matters).",
//       long: "This section will include learning modules, videos, and quizzes. In future, link to /portfolio/learn or embed the learning pages inline. Replace content as you wish.",
//       icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l7 4v6c0 5-3 9-7 9s-7-4-7-9V6l7-4z" strokeWidth="1.5"/></svg>,
//       color: "from-purple-500 to-pink-400",
//     },
//     // -------------------------
//     // >>> To add new feature cards:
//     // Add another object here with id/title/short/long/icon/color.
//     // The color string should be a tailwind gradient classes like "from-indigo-500 to-purple-400".
//     // -------------------------
//   ]), []);

//   // ---------------------
//   // Demo carousel (GIF + screenshots)
//   // ---------------------
//   const demoItems = [
//     { id: "scr1", type: "gif", src: "/assets/demo-1.gif", alt: "Dashboard Demo GIF" },
//     { id: "scr2", type: "img", src: "/assets/screenshot-1.png", alt: "Portfolio Screenshot" },
//     { id: "scr3", type: "img", src: "/assets/screenshot-2.png", alt: "Analysis Screenshot" },
//     // Add more demo images/GIFs to public/assets/ and push here.
//   ];
//   const [demoIndex, setDemoIndex] = useState(0);
//   useEffect(() => {
//     const id = setInterval(() => {
//       setDemoIndex((i) => (i + 1) % demoItems.length);
//     }, 4000);
//     return () => clearInterval(id);
//   }, [demoItems.length]);

//   // ---------------------
//   // Stats (project stage)
//   // ---------------------
//   const stats = [
//     { value: "Prototype", label: "Project Stage" },
//     { value: "Academic", label: "Purpose" },
//     { value: "Team", label: "Student Project" },
//     { value: "Final Year", label: "Year" },
//   ];

//   return (
//     <div className="min-h-screen">
//       {/* HERO */}
//       <section className="relative bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
//         {/* background shapes */}
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute -left-32 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-500/10 blur-3xl" />
//           <div className="absolute -right-32 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500/10 to-amber-400/10 blur-3xl" />
//         </div>

//         <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <div className="inline-flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 mb-6">
//                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//                 <span className="text-sm font-medium text-indigo-500">AI • Live Markets</span>
//               </div>

//               <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
//                 Your Smart <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-400">Investment Partner</span>
//               </h1>
//               <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-xl">
//                 Make smarter investment decisions with AI-driven insights for Indian markets.
//               </p>

//               <div className="flex flex-wrap gap-4 mt-8">
//                 <button
//                   onClick={() => navigate("/sign-up")}
//                   className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-transform transform hover:-translate-y-1"
//                 >
//                   Get Started
//                 </button>

//                 <button
//                   onClick={() => window.open("https://www.youtube.com/watch?v=YOUR_LINK_HERE", "_blank")}
//                   className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3"
//                 >
//                   <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
//                     <PlayIcon />
//                   </span>
//                   Watch Demo
//                 </button>

//                 <button
//                   onClick={() => toggleTheme()}
//                   className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700"
//                   title={`Toggle theme (current: ${theme})`}
//                 >
//                   {theme === "dark" ? "Light" : "Dark"}
//                 </button>
//               </div>

//               {/* Project Stats */}
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
//                 {stats.map((s) => (
//                   <div key={s.label} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
//                     <div className="text-lg font-bold">{s.value}</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Market Widget */}
//             <div className="relative">
//               <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-lg">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
//                     <div className="text-sm font-medium">Live Market</div>
//                   </div>
//                   <div className="text-xs text-gray-500 dark:text-gray-400">Updates every 30s</div>
//                 </div>

//                 {/* loading skeleton */}
//                 {loadingMarket ? (
//                   <div className="space-y-3 animate-pulse">
//                     <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
//                     <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
//                     <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {market.map((m, i) => (
//                       <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-850 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
//                         <div>
//                           <div className="text-sm font-medium">{m.name}</div>
//                           <div className="text-sm text-gray-500 dark:text-gray-400">{m.symbol ?? ""}</div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-xl font-bold">{typeof m.value === "number" ? Number(m.value).toLocaleString() : m.value}</div>
//                           <div className={`text-sm ${m.up ? "text-emerald-400" : "text-rose-400"}`}>{m.change ?? ""}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {marketError && (
//                   <div className="mt-4 text-xs text-rose-400">
//                     Could not fetch live data — showing placeholders.
//                     <button className="ml-3 underline" onClick={fetchMarketFallback}>Retry</button>
//                   </div>
//                 )}
//               </div>

//               {/* mini sparkline placeholder */}
//               <div className="hidden lg:block mt-4">
//                 <div className="w-full h-28 bg-gradient-to-t from-indigo-500/10 to-transparent rounded-lg" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="py-20 bg-gray-50 dark:bg-gray-950">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-12">
//             <span className="text-indigo-500 font-semibold">Features</span>
//             <h2 className="text-3xl lg:text-4xl font-bold mt-4">Powerful Tools for <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-400">Smart Investing</span></h2>
//             <p className="mt-3 text-gray-600 dark:text-gray-300">Click <strong>Learn more</strong> to expand each feature and read a longer description.</p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((f) => (
//               <article key={f.id} className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
//                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${f.color}`}>
//                   {f.icon}
//                 </div>
//                 <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">{f.short}</p>

//                 <div className="mt-4 flex items-center justify-between">
//                   <button
//                     onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
//                     className="text-indigo-600 dark:text-indigo-400 font-medium"
//                   >
//                     {expandedId === f.id ? "Show less" : "Learn more"}
//                   </button>
//                   <button
//                     onClick={() => { /* optionally navigate to documentation for each feature */ }}
//                     className="text-sm text-gray-500 dark:text-gray-400"
//                   >
//                     Docs
//                   </button>
//                 </div>

//                 {/* Expanded content */}
//                 {expandedId === f.id && (
//                   <div className="mt-4 border-t pt-4 text-sm text-gray-700 dark:text-gray-300">
//                     <p>{f.long}</p>
//                     <p className="mt-3 text-xs text-gray-500">Replace this placeholder with the full documentation or detailed breakdown of the feature.</p>
//                   </div>
//                 )}
//               </article>
//             ))}
//           </div>

//           {/* comment for devs: where to add more feature cards */}
//           {/* 
//             To add more features: add objects in the `features` array above.
//             Each object should include: id, title, short, long, icon, color (tailwind gradient string).
//           */}
//         </div>
//       </section>

//       {/* DEMO / SCREENSHOTS */}
//       <section className="py-20">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-bold">Experience the Platform</h2>
//             <p className="text-gray-600 dark:text-gray-400 mt-2">See our AI-powered features in action — use GIFs for animated presence.</p>
//           </div>

//           <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
//             <div className="flex flex-col lg:flex-row items-center gap-6">
//               <div className="w-full lg:w-2/3">
//                 <div className="relative rounded-lg overflow-hidden h-72">
//                   {demoItems[demoIndex] ? (
//                     demoItems[demoIndex].type === "gif" ? (
//                       <img src={demoItems[demoIndex].src} alt={demoItems[demoIndex].alt} className="object-cover w-full h-full" />
//                     ) : (
//                       <img src={demoItems[demoIndex].src} alt={demoItems[demoIndex].alt} className="object-cover w-full h-full" />
//                     )
//                   ) : (
//                     <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Add screenshots to public/assets/ and update demoItems in code</div>
//                   )}

//                   {/* carousel controls */}
//                   <div className="absolute bottom-4 left-4 flex gap-2">
//                     {demoItems.map((d, idx) => (
//                       <button key={d.id} onClick={() => setDemoIndex(idx)} className={`w-2 h-2 rounded-full ${idx === demoIndex ? "bg-white" : "bg-white/30"}`} />
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="w-full lg:w-1/3">
//                 <h3 className="text-xl font-bold">NOTICE</h3>
//                 <p className="mt-2 text-gray-600 dark:text-gray-300">
//                   The GIF/screenshot demo above shows the actual app flows — not the other placeholder marketing content. Replace static screenshots with GIFs for a better live feel.
//                 </p>

//                 <div className="mt-4">
//                   <p className="text-sm text-gray-500">Tip: Save GIFs in <code>/public/assets</code> and reference them in demoItems array.</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="py-12 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div>
//               <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-400">FinEdge</h4>
//               <p className="mt-3 text-gray-600 dark:text-gray-400">AI-powered investment partner for Indian markets — student project.</p>
//             </div>

//             <div>
//               <h5 className="font-semibold mb-3">Quick Links</h5>
//               <ul className="space-y-2">
//                 <li><button onClick={() => handleProtectedRoute("/portfolio")} className="text-gray-600 dark:text-gray-300">Dashboard</button></li>
//                 <li><button onClick={() => handleProtectedRoute("/portfolio")} className="text-gray-600 dark:text-gray-300">Portfolio</button></li>
//                 <li><button onClick={() => handleProtectedRoute("/portfolio/financial-path")} className="text-gray-600 dark:text-gray-300">Financial Path Journey</button></li>
//                 <li><button onClick={() => handleProtectedRoute("/portfolio/recommendations")} className="text-gray-600 dark:text-gray-300">AI Advisor</button></li>
//                 <li><button onClick={() => handleProtectedRoute("/portfolio/learn")} className="text-gray-600 dark:text-gray-300">Learn</button></li>
//                 <li><button onClick={() => handleProtectedRoute("/portfolio/money-pulse")} className="text-gray-600 dark:text-gray-300">Market News</button></li>
//               </ul>
//             </div>

//             <div>
//               <h5 className="font-semibold mb-3">Resources</h5>
//               <ul className="space-y-2">
//                 <li><a href="/assets/FinEdge_Report.pdf" download className="text-gray-600 dark:text-gray-300">Documentation (PDF)</a></li>
//                 <li><a href="/api-docs.html" className="text-gray-600 dark:text-gray-300" target="_blank" rel="noreferrer">API Reference (HTML)</a></li>
//                 {/* Removed .env.example as requested */}
//                 <li><a href="mailto:team@finedge.local" className="text-gray-600 dark:text-gray-300">Support</a></li>
//                 <li><a href="tel:+911234567890" className="text-gray-600 dark:text-gray-300">Contact</a></li>
//               </ul>
//             </div>

//             <div>
//               <h5 className="font-semibold mb-3">Built with</h5>
//               <div className="flex flex-col gap-3">
//                 <a href="https://react.dev" target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">React — Docs</a>
//                 <a href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">Tailwind CSS — Docs</a>
//                 <a href="https://www.python.org" target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">Python / ML — Docs</a>
//               </div>
//             </div>
//           </div>

//           <div className="mt-8 border-t pt-6 text-sm text-gray-500 dark:text-gray-400 flex flex-col md:flex-row justify-between items-center">
//             <div>© {new Date().getFullYear()} FinEdge • Final-year project</div>
//             <div>Built with ♥ using modern web tools</div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }






























// // Path: /mnt/data/Home.tsx
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// /* ---------------- ICON COMPONENTS ---------------- */
// const TrendingUp = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//   </svg>
// );
// const Shield = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//   </svg>
// );
// const Brain = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
//   </svg>
// );
// const ChartBar = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//   </svg>
// );
// const ArrowRight = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//   </svg>
// );
// const Play = ({ className }: { className?: string }) => (
//   <svg className={className} fill="currentColor" viewBox="0 0 24 24">
//     <path d="M8 5v14l11-7z" />
//   </svg>
// );

// /* ---------------- DATA / HELPERS ---------------- */

// const features = [
//   {
//     icon: TrendingUp,
//     title: "Real-Time Indian Market Insights",
//     description: "Get instant updates on NIFTY, SENSEX, and personalized insights powered by AI.",
//     color: "from-blue-500 to-cyan-400",
//   },
//   {
//     icon: Shield,
//     title: "Smart Portfolio Management",
//     description: "Receive tailored investment suggestions for Indian markets based on your goals.",
//     color: "from-emerald-500 to-teal-400",
//   },
//   {
//     icon: Brain,
//     title: "Learn & Grow",
//     description: "Access educational resources about Indian markets and improve financial literacy.",
//     color: "from-purple-500 to-pink-400",
//   },
//   {
//     icon: ChartBar,
//     title: "Market Analysis",
//     description: "Stay ahead with AI-powered analysis of Indian stock market trends and predictions.",
//     color: "from-orange-500 to-amber-400",
//   },
// ];

// /* ---------------- Counter (handles non-numeric gracefully) ---------------- */

// const AnimatedCounter = ({ end, suffix }: { end: string; suffix?: string }) => {
//   // If end contains digits, animate them. Otherwise render as-is.
//   const [count, setCount] = useState<number | null>(null);

//   useEffect(() => {
//     const num = parseInt(end.replace(/[^0-9]/g, ""));
//     if (isNaN(num) || num === 0) {
//       setCount(null);
//       return;
//     }
//     const duration = 1200;
//     const steps = 40;
//     const increment = num / steps;
//     const interval = duration / steps;
//     let current = 0;
//     const t = setInterval(() => {
//       current += increment;
//       if (current >= num) {
//         setCount(num);
//         clearInterval(t);
//       } else setCount(Math.floor(current));
//     }, interval);
//     return () => clearInterval(t);
//   }, [end]);

//   if (count === null) return <span>{end}{suffix ?? ""}</span>;
//   const prefix = end.includes("₹") ? "₹" : "";
//   return <span>{prefix + count.toLocaleString() + (suffix ?? "")}</span>;
// };

// /* ---------------- Floating Particle (visual) ---------------- */

// const FloatingParticle = ({ delay, x }: { delay: number; x: number }) => (
//   <div className="absolute w-2 h-2 bg-indigo-400/30 rounded-full animate-pulse"
//        style={{ left: `${x}%`, top: "20%", animationDelay: `${delay}s`, animationDuration: "3s" }} />
// );

// /* ---------------- TeamCard (kept as-is visual) ---------------- */

// const TeamCard = ({ member }: { member: any }) => {
//   const [showLinks, setShowLinks] = useState(false);

//   return (
//     <div
//       className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2"
//       onMouseEnter={() => setShowLinks(true)}
//       onMouseLeave={() => setShowLinks(false)}
//     >
//       <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//       <div className="relative p-6">
//         <div className="relative w-32 h-32 mx-auto mb-4">
//           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-pulse opacity-50" />
//           <img src={member.image} alt={member.name} className="relative w-full h-full object-cover rounded-full border-4 border-gray-700 group-hover:border-indigo-500 transition-all duration-500" />
//           <div className={`absolute inset-0 rounded-full bg-black/60 flex items-center justify-center gap-4 transition-opacity duration-300 ${showLinks ? "opacity-100" : "opacity-0"}`}>
//             <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-110">
//               {/* LinkedIn svg */}
//               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
//             </a>
//             <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all hover:scale-110">
//               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.13-1.703C6.61 19.44 6 17.48 6 17.48c-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
//             </a>
//           </div>
//         </div>

//         <div className="text-center">
//           <span className="inline-block px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full mb-2">{member.highlight}</span>
//           <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
//           <p className="text-indigo-400 font-medium text-sm mb-3">{member.role}</p>
//           <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ---------------- HOME PAGE ---------------- */

// export default function Home() {
//   const navigate = useNavigate();

//   // Simple auth check helper — adapt to your real auth
//   const isAuthenticated = () => {
//     // Example: token stored in localStorage under 'authToken' — change as per your app
//     return !!localStorage.getItem("authToken");
//   };

//   const handleProtectedRoute = (route: string) => {
//     if (!isAuthenticated()) {
//       // Prompt user and send to sign-in
//       alert("Please sign in / sign up to access this page.");
//       navigate("/sign-in");
//       return;
//     }
//     navigate(route);
//   };

//   const goToSignIn = () => navigate("/sign-in");

//   // Market state: try fetch -> fallback to defaults
//   const [market, setMarket] = useState([
//     { name: "NIFTY 50", value: "24,834.85", change: "+1.23%", up: true },
//     { name: "SENSEX", value: "81,765.42", change: "+0.98%", up: true },
//     { name: "BANKNIFTY", value: "52,341.20", change: "-0.45%", up: false },
//   ]);
//   useEffect(() => {
//     let mounted = true;
//     // try to fetch from your backend (you need to implement the backend endpoint)
//     fetch("/api/market/quote?symbols=NIFTY,SENSEX,BANKNIFTY")
//       .then((r) => r.json())
//       .then((data) => {
//         if (!mounted) return;
//         // expect data like [{name, value, change, up}, ...]
//         if (Array.isArray(data) && data.length >= 3) setMarket(data.slice(0, 3));
//       })
//       .catch(() => {
//         // silently fallback to the default hard-coded values
//       });
//     return () => { mounted = false; };
//   }, []);

//   // Neutral project stats (no startup marketing claims)
//   const stats = [
//     { value: "Prototype", label: "Project Stage" },
//     { value: "Academic", label: "Purpose" },
//     { value: "Team", label: "Student Project" },
//   ];

//   // Footer quick links (use handleProtectedRoute)
//   const quickLinks = [
//     { label: "Dashboard", route: "/dashboard" },
//     { label: "Portfolio", route: "/portfolio" },
//     { label: "Learn", route: "/learn" }, // money matters -> learn mapping
//     { label: "Market News", route: "/market-news" }, // money pulse -> market-news mapping
//   ];

//   return (
//     <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
//       {/* Animated background */}
//       <div className="fixed inset-0 pointer-events-none">
//         <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-gray-950 to-purple-950/50" />
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
//         {[10, 25, 40, 55, 70, 85].map((x, i) => <FloatingParticle key={i} x={x} delay={i * 0.5} />)}
//       </div>

//       {/* HERO */}
//       <section className="relative min-h-screen flex items-center">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             {/* Left */}
//             <div className="space-y-8">
//               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30">
//                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
//                 <span className="text-sm font-medium text-indigo-300">AI-Powered • Live Markets</span>
//               </div>

//               <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
//                 <span className="block text-white">Your Smart</span>
//                 <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Investment Partner</span>
//                 <span className="block text-white text-3xl lg:text-4xl mt-2 font-normal text-gray-400">for Indian Markets</span>
//               </h1>

//               <p className="text-xl text-gray-400 max-w-xl leading-relaxed">Make smarter investment decisions with AI-driven insights and personalized recommendations.</p>

//               {/* CTA Buttons */}
//               <div className="flex flex-wrap gap-4">
//                 <button onClick={goToSignIn} className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1">
//                   <span className="relative z-10 flex items-center gap-2">Get Started (Sign-in)</span>
//                 </button>

//                 <button
//                   onClick={() => window.open("https://www.youtube.com/watch?v=YOUR_LINK_HERE", "_blank")}
//                   className="group px-8 py-4 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all hover:bg-indigo-500/10"
//                 >
//                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
//                     <Play className="w-4 h-4 text-indigo-400" />
//                   </div>
//                   Watch Demo
//                 </button>
//               </div>

//               {/* Stats (neutral) */}
//               <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-800">
//                 {stats.map((stat, i) => (
//                   <div key={i} className="text-center">
//                     <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//                       <AnimatedCounter end={stat.value} />
//                     </p>
//                     <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Right: Market Box */}
//             <div className="relative hidden lg:block">
//               <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 border border-gray-700/50 shadow-2xl backdrop-blur-xl">
//                 <div className="flex items-center justify-between mb-6">
//                   <div className="flex items-center gap-3">
//                     <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
//                     <span className="text-sm text-gray-400">Live Market</span>
//                   </div>
//                   <span className="text-xs text-gray-500">Updated just now</span>
//                 </div>

//                 <div className="space-y-4">
//                   {market.map((m, i) => (
//                     <div key={i} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
//                       <div>
//                         <p className="font-semibold text-white">{m.name}</p>
//                         <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
//                       </div>
//                       <div className={`px-3 py-1 rounded-lg ${m.up ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
//                         {m.change}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-6 h-32 bg-gradient-to-t from-indigo-600/20 to-transparent rounded-xl flex items-end justify-around px-4 pb-4">
//                   {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
//                     <div key={i} className="w-4 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-sm transition-all" style={{ height: `${h}%` }} />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="relative py-24">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-16">
//             <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">Features</span>
//             <h2 className="text-4xl lg:text-5xl font-bold mt-4">
//               Powerful Tools for <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Smart Investing</span>
//             </h2>
//             <p className="text-xl text-gray-400 mt-4 max-w-2xl mx-auto">Everything you need to make informed investment decisions.</p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {features.map((f, i) => (
//               <div key={i} className="group relative bg-gray-900/50 rounded-2xl p-8 border border-gray-800 hover:border-indigo-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl">
//                 <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6`}>
//                   <f.icon className="w-7 h-7 text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
//                 <p className="text-gray-400 leading-relaxed">{f.description}</p>
//                 <div className="mt-6 flex items-center text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
//                   Learn more <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Team */}
//       <section className="relative py-24 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-16">
//             <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">Our Team</span>
//             <h2 className="text-4xl lg:text-5xl font-bold mt-4">Meet the <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Creators</span></h2>
//             <p className="text-xl text-gray-400 mt-4 max-w-2xl mx-auto">The minds behind this final-year engineering project.</p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {[
//               {
//                 name: "Rohit Deshpande",
//                 role: "Full Stack Developer",
//                 image: "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/rohitbhai.jpg?raw=true",
//                 description: "Passionate about building robust, scalable software and applying data-driven approaches.",
//                 highlight: "16010122041",
//                 github: "https://github.com/irohitdeshpande",
//                 linkedin: "https://linkedin.com/in/irohitdeshpande",
//               },
//               {
//                 name: "Eeshanya Joshi",
//                 role: "Fullstack Developer",
//                 image: "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/eeshanyabhai.jpg?raw=true",
//                 description: "Final-year Computer Engineering student with hands-on experience in software and AI/ML.",
//                 highlight: "16010122074",
//                 github: "https://github.com/Code-Ph0enix",
//                 linkedin: "https://www.linkedin.com/in/eeshanyajoshi/",
//               },
//               {
//                 name: "Shubh Jalui",
//                 role: "AI/ML Developer",
//                 image: "https://github.com/sJalui/LuxuryHaven/blob/main/Site%20Images/self.jpg?raw=true",
//                 description: "Final year Engineering student with experience in data science and Power BI.",
//                 highlight: "16010122072",
//                 github: "https://github.com/sJalui",
//                 linkedin: "https://www.linkedin.com/in/shubh-jalui-1923b1259/",
//               },
//             ].map((m, i) => <TeamCard key={i} member={m} />)}
//           </div>
//         </div>
//       </section>

//       {/* CTA (kept but toned-down: project note + demo) */}
//       <section className="relative py-24">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-center overflow-hidden">
//             <div className="relative z-10">
//               <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Academic Project — Demo Available</h2>
//               <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">This is a final-year project prototype. For full demo, click Watch Demo or launch the app locally.</p>
//               <button onClick={() => window.open("https://www.youtube.com/watch?v=YOUR_LINK_HERE", "_blank")} className="px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all hover:shadow-2xl hover:-translate-y-1">Watch Demo</button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer (kept; you can comment-out if you prefer) */}
//       <footer className="relative border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl">
//         <div className="max-w-7xl mx-auto px-4 py-16">
//           <div className="grid md:grid-cols-4 gap-12">
//             <div className="space-y-4">
//               <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FinEdge</h3>
//               <p className="text-gray-400">AI-powered investment partner for Indian markets — final-year project.</p>
//               <div className="flex gap-4 pt-4">
//                 <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-slate-400 hover:text-white">
//                   {/* GitHub icon */}
//                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
//                 </a>
//                 <a href="mailto:contact@finedge.com" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-slate-400 hover:text-white">
//                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
//                 </a>
//               </div>
//             </div>

//             {/* Quick Links */}
//             <div>
//               <h4 className="font-semibold text-white mb-4">Quick Links</h4>
//               <ul className="space-y-3">
//                 {quickLinks.map((q) => (
//                   <li key={q.label}>
//                     <button onClick={() => handleProtectedRoute(q.route)} className="text-slate-400 hover:text-indigo-400 transition-colors">
//                       {q.label}
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Resources */}
//             <div>
//               <h4 className="font-semibold text-white mb-4">Resources</h4>
//               <ul className="space-y-3">
//                 <li>
//                   {/* Documentation download — replace path when final PDF is ready */}
//                   <a href="/assets/FinEdge_Report.pdf" download className="text-slate-400 hover:text-indigo-400 transition-colors">Documentation (Download)</a>
//                 </li>
//                 <li>
//                   <a href="/api-docs" className="text-slate-400 hover:text-indigo-400 transition-colors">API Reference</a>
//                 </li>
//                 <li>
//                   <a href="/.env.example" download className="text-slate-400 hover:text-indigo-400 transition-colors">.env.example (Download)</a>
//                 </li>
//                 <li>
//                   <a href="mailto:support@finedge.com" className="text-slate-400 hover:text-indigo-400 transition-colors">Support</a>
//                 </li>
//                 <li>
//                   <a href="tel:+911234567890" className="text-slate-400 hover:text-indigo-400 transition-colors">Contact</a>
//                 </li>
//               </ul>
//             </div>

//             {/* Spacer: legal/company columns could go here */}
//             <div>
//               <h4 className="font-semibold text-white mb-4">About</h4>
//               <p className="text-slate-400">Final-year project for demonstration and learning purposes.</p>
//             </div>
//           </div>

//           <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
//             <p className="text-slate-500 text-sm">© {new Date().getFullYear()} FinEdge. Final Year Engineering Project.</p>
//             <p className="text-slate-500 text-sm flex items-center gap-2">Built with <span className="text-red-500">❤️</span> in India</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
