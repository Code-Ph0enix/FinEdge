// src/pages/Home.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
// import { useTheme } from "../context/ThemeContext";
import { useMarketSummary } from "../hooks/useStockData";
import GlimpseSection from "../components/GlimpseSection";


type MarketItem = {
  name: string;
  symbol: string;
  value: number | string;
  change: string;
  up: boolean;
};

const PlayIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ArrowRight = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ChevronDown = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const TrendingUp = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Shield = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Brain = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ChartBar = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FloatingOrb = ({ className, delay }: { className: string; delay: number }) => (
  <div 
    className={`absolute rounded-full blur-3xl animate-pulse pointer-events-none ${className}`} 
    style={{ animationDelay: `${delay}s`, animationDuration: '4s' }} 
  />
);

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  // const { theme } = useTheme(); // Available if needed in future

  // -------------------- MARKET DATA --------------------
  const { summary, loading, error, refetch } = useMarketSummary(30000);

  const [market, setMarket] = useState<MarketItem[]>([
    { name: "NIFTY 50", symbol: "NIFTY", value: "—", change: "—", up: true },
    { name: "SENSEX", symbol: "SENSEX", value: "—", change: "—", up: true },
    { name: "BANKNIFTY", symbol: "BANKNIFTY", value: "—", change: "—", up: true },
  ]);

  useEffect(() => {
    if (!loading && summary) {
      setMarket([
        {
          name: "NIFTY 50",
          symbol: "NIFTY",
          value: summary.NIFTY.value,
          change: `${summary.NIFTY.perChange >= 0 ? '+' : ''}${summary.NIFTY.perChange}%`,
          up: summary.NIFTY.perChange >= 0,
        },
        {
          name: "SENSEX",
          symbol: "SENSEX",
          value: summary.SENSEX.value,
          change: `${summary.SENSEX.perChange >= 0 ? '+' : ''}${summary.SENSEX.perChange}%`,
          up: summary.SENSEX.perChange >= 0,
        },
        {
          name: "BANKNIFTY",
          symbol: "BANKNIFTY",
          value: summary.BANKNIFTY.value,
          change: `${summary.BANKNIFTY.perChange >= 0 ? '+' : ''}${summary.BANKNIFTY.perChange}%`,
          up: summary.BANKNIFTY.perChange >= 0,
        },
      ]);
    }
  }, [summary, loading]);

  // -------------------- ROUTE PROTECTION --------------------
  const go = (route: string) => {
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    navigate(route);
  };

  // -------------------- FEATURES --------------------
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const features = useMemo(
    () => [
      {
        id: "market",
        icon: TrendingUp,
        title: "Real-Time Market Insights",
        short: "Live updates for NIFTY, SENSEX, BANKNIFTY with AI-powered analysis.",
        long: "Our system continuously monitors BSE and NSE exchanges, providing you with real-time data updates every 30 seconds. Get instant alerts on significant market movements, trend analysis, and personalized insights powered by machine learning algorithms.",
        color: "from-blue-500 to-indigo-400",
      },
      {
        id: "portfolio",
        icon: Shield,
        title: "Smart Portfolio Management",
        short: "AI-driven insights and tailored recommendations for your investments.",
        long: "Set your financial goals, risk tolerance, and investment horizon. Our AI engine analyzes your portfolio composition, suggests rebalancing strategies, identifies sector allocations, and provides personalized stock recommendations based on your unique financial profile.",
        color: "from-indigo-500 to-purple-400",
      },
      {
        id: "learning",
        icon: Brain,
        title: "Interactive Learning",
        short: "Money Matters modules and comprehensive financial education resources.",
        long: "Access our curated learning paths covering technical analysis, fundamental analysis, options trading, and risk management. Interactive quizzes, real-world case studies, and simulated trading environments help you learn by doing.",
        color: "from-purple-500 to-fuchsia-400",
      },
      {
        id: "analysis",
        icon: ChartBar,
        title: "Advanced Market Analysis",
        short: "AI-powered predictions and trend analysis for Indian markets.",
        long: "Leverage machine learning models that analyze historical patterns, news sentiment, FII/DII flows, and global market correlations. Identify potential breakout stocks, support/resistance levels, and market trends before they become obvious.",
        color: "from-indigo-500 to-blue-400",
      },
    ],
    []
  );

  const stats = [
    { icon: "📊", value: "5000+", label: "Stocks Tracked" },
    { icon: "🤖", value: "3", label: "AI Models" },
    { icon: "📈", value: "NSE & BSE", label: "Coverage" },
  ];

  const techStack = ['React', 'TypeScript', 'Python', 'TensorFlow', 'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'Clerk Auth'];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <FloatingOrb className="w-[600px] h-[600px] -top-48 -left-48 bg-teal-600/15" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] top-1/3 -right-32 bg-emerald-600/10" delay={1.5} />
        <FloatingOrb className="w-[400px] h-[400px] bottom-0 left-1/3 bg-cyan-600/10" delay={3} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-300">AI-Powered Financial Intelligence</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Welcome to</span>
                <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mt-2">FinEdge</span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed">
                Your intelligent companion for navigating Indian stock markets. Powered by AI, built for smarter investment decisions.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate("/sign-up")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-1"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={() => window.open("https://www.youtube.com/watch?v=YOUR_LINK", "_blank")}
                  className="group px-8 py-4 border border-slate-700 hover:border-teal-500 rounded-xl font-semibold text-lg flex items-center gap-3 transition-all hover:bg-teal-500/10"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                    <PlayIcon className="text-blue-400" />
                  </div>
                  Watch Demo
                </button>
              </div>
              
              {/* Project Stats */}
              <div className="grid grid-cols-3 gap-4 pt-10 border-t border-slate-800">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/30 transition-colors">
                    <span className="text-2xl">{stat.icon}</span>
                    <p className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* MARKET WIDGET */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm text-slate-400 font-medium">Live Market (30s refresh)</span>
                  </div>
                  <span className="px-3 py-1 text-xs bg-teal-500/20 text-blue-300 rounded-full">Real-time</span>
                </div>
                
                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                    <div className="h-20 bg-slate-800/50 rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {market.map((m, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors border border-slate-700/30">
                        <div>
                          <p className="font-medium text-slate-300 text-sm">{m.name}</p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold ${m.up ? 'bg-emerald-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                          {m.change}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-400 mt-3">
                    Failed to fetch data.{" "}
                    <button className="underline hover:text-red-300" onClick={refetch}>
                      Retry
                    </button>
                  </p>
                )}
                
                <div className="mt-6 h-36 bg-gradient-to-t from-blue-600/10 to-transparent rounded-xl flex items-end justify-around px-4 pb-4 border border-slate-700/30">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 70, 95].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-3 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t transition-all hover:from-blue-400 hover:to-indigo-300" 
                      style={{ height: `${h}%` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-teal-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm">Features</span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              Powerful Tools for{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Smart Investing
              </span>
            </h2>
            <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto">
              Everything you need to make informed investment decisions in Indian markets.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.id} className="group relative bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-teal-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/10 overflow-hidden">
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <f.icon className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.short}</p>
                  <button 
                    onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    className="mt-6 inline-flex items-center text-blue-400 font-medium hover:text-blue-300 transition-colors whitespace-nowrap"
                  >
                    {expandedId === f.id ? 'Show less' : 'Learn more'}
                    <ChevronDown className={`ml-2 transition-transform duration-300 ${expandedId === f.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === f.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-8 pb-8 pt-2 border-t border-slate-700/50">
                    <p className="text-slate-300 leading-relaxed">{f.long}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section className="relative py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-10">
            <h3 className="text-2xl font-bold text-center text-white mb-8">Built With Modern Technologies</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {techStack.map((tech, i) => (
                <span 
                  key={i} 
                  className="px-5 py-2 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:border-teal-500 hover:text-blue-300 transition-colors cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Explore FinEdge Today</h2>
              <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
                Experience AI-powered market analysis and take your investment research to the next level.
              </p>
              <button 
                onClick={() => navigate(isSignedIn ? "/portfolio" : "/sign-up")}
                className="px-10 py-4 bg-white text-teal-700 rounded-xl font-bold text-lg hover:bg-teal-50 transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
              </button>
            </div>
          </div>
        </div>
      </section> */}

      <GlimpseSection />


      {/* FOOTER */}
      <footer className="relative border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                FinEdge
              </h3>
              <p className="text-slate-400 max-w-md">
                An AI-powered investment analysis platform for Indian markets. Built as a final year engineering project to demonstrate the potential of machine learning in financial technology.
              </p>
              {/* <div className="flex gap-4 pt-4">
                <a 
                  href="https://github.com/Code-Ph0enix/FinEdge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:team@finedge.local"
                  className="w-10 h-10 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div> */}

<div className="flex pt-4">
  <div className="w-[152px] flex items-center justify-center">
    <a 
      href="https://github.com/Code-Ph0enix/FinEdge" 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-[152px] h-10 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-110 text-slate-300 hover:text-white"
    >
      {/* GitHub Icon */}
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
      </svg>

      {/* Text */}
      <span className="text-sm font-medium">GitHub</span>

      {/* NE Arrow Icon */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
      </svg>
    </a>
  </div>
</div>


            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => go("/portfolio")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Portfolio
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio/financial-path")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Financial Path
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio/chatbot")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    AI Advisor
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio/recommendations")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Recommendations
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio/learn")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Learn
                  </button>
                </li>
                <li>
                  <button onClick={() => go("/portfolio/money-pulse")} className="text-slate-400 hover:text-blue-400 transition-colors">
                    Market News
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/assets/FinEdge_Report.pdf" download className="text-slate-400 hover:text-blue-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/api-docs.html" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                    API Reference
                  </a>
                </li>
                {/* <li>
                  <a href="/assets/API_Reference_Report.pdf" download className="text-slate-400 hover:text-blue-400 transition-colors">
                    API Reference
                  </a>
                </li> */}
                <li>
                  <a href="mailto:eeshanyajoshi@gmail.com" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="tel:+918169570762" className="text-slate-400 hover:text-blue-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} FinEdge. Final Year Engineering Project.</p>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              Built with <span className="text-red-500">❤️</span> in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}