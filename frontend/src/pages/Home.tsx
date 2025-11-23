// src/pages/Home.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
// import { useTheme } from "../context/ThemeContext";
import { useMarketSummary } from "../hooks/useStockData";
import GlimpseSection from "../components/GlimpseSection";
import {
  TrendingUp,
  Shield,
  Brain,
  BarChart3,
  Timer,
  Zap,
  Target,
  BookOpen,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

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

const FloatingOrb = ({
  className,
  delay,
}: {
  className: string;
  delay: number;
}) => (
  <div
    className={`absolute rounded-full blur-3xl animate-pulse pointer-events-none ${className}`}
    style={{ animationDelay: `${delay}s`, animationDuration: "4s" }}
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
    {
      name: "BANKNIFTY",
      symbol: "BANKNIFTY",
      value: "—",
      change: "—",
      up: true,
    },
  ]);

  useEffect(() => {
    if (!loading && summary) {
      setMarket([
        {
          name: "NIFTY 50",
          symbol: "NIFTY",
          value: summary.NIFTY.value,
          change: `${summary.NIFTY.perChange >= 0 ? "+" : ""}${
            summary.NIFTY.perChange
          }%`,
          up: summary.NIFTY.perChange >= 0,
        },
        {
          name: "SENSEX",
          symbol: "SENSEX",
          value: summary.SENSEX.value,
          change: `${summary.SENSEX.perChange >= 0 ? "+" : ""}${
            summary.SENSEX.perChange
          }%`,
          up: summary.SENSEX.perChange >= 0,
        },
        {
          name: "BANKNIFTY",
          symbol: "BANKNIFTY",
          value: summary.BANKNIFTY.value,
          change: `${summary.BANKNIFTY.perChange >= 0 ? "+" : ""}${
            summary.BANKNIFTY.perChange
          }%`,
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
        short:
          "Live updates for NIFTY, SENSEX, BANKNIFTY with AI-powered analysis.",
        long: "Our system continuously monitors BSE and NSE exchanges, providing you with real-time data updates. Get instant alerts on significant market movements, trend analysis, and personalized insights powered by machine learning algorithms.",
        color: "from-blue-500 to-indigo-3",
      },
      {
        id: "portfolio",
        icon: Target,
        title: "Smart Portfolio Management",
        short:
          "AI-driven insights and tailored recommendations for your investments.",
        long: "Set your financial goals, risk tolerance, and investment horizon. Our AI engine analyzes your portfolio composition, suggests rebalancing strategies, identifies sector allocations, and provides personalized stock recommendations based on your unique financial profile.",
        color: "from-indigo-500 to-purple-3",
      },
      {
        id: "learning",
        icon: BookOpen,
        title: "Interactive Learning",
        short:
          "Money Matters modules and comprehensive financial education resources.",
        long: "Access our curated learning paths covering technical analysis, fundamental analysis, options trading, and risk management. Interactive quizzes, real-world case studies, and simulated trading environments help you learn by doing.",
        color: "from-purple-500 to-fuchsia-3",
      },
      {
        id: "analysis",
        icon: BarChart3,
        title: "Advanced Market Analysis",
        short: "AI-powered predictions and trend analysis for Indian markets.",
        long: "Leverage machine learning models that analyze historical patterns, news sentiment, FII/DII flows, and global market correlations. Identify potential breakout stocks, support/resistance levels, and market trends before they become obvious.",
        color: "from-indigo-500 to-blue-3",
      },
    ],
    []
  );

  const stats = [
    {
      id: "tracked",
      icon: TrendingUp,
      value: "4,800+",
      label: "Stocks Tracked",
    },
    { id: "models", icon: Brain, value: "3", label: "AI Models Active" },
    { id: "latency", icon: Timer, value: "<2s", label: "Avg Response" },
    {
      id: "coverage",
      icon: BarChart3,
      value: "NSE & BSE",
      label: "Market Coverage",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-neutral-900 dark:text-white overflow-hidden transition-colors border-purple-500/20 dark:border-slate-700">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <FloatingOrb
          className="w-[600px] h-[600px] -top-48 -left-48 bg-teal-600/15"
          delay={0}
        />
        <FloatingOrb
          className="w-[500px] h-[500px] top-1/3 -right-32 bg-emerald-600/10"
          delay={1.5}
        />
        <FloatingOrb
          className="w-[400px] h-[400px] bottom-0 left-1/3 bg-cyan-600/10"
          delay={3}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />
      </div>
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center bg-white dark:bg-slate-950">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block mb-2 text-neutral-900 dark:text-white font-semibold text-4xl lg:text-5xl">
                  Welcome to
                </span>
                <span
                  className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent leading-tight pb-1">
                  FinEdge
                </span>
              </h1>

              <p className="text-xl text-neutral-800 dark:text-slate-400 max-w-xl leading-relaxed">
                AI-based advisory for Indian markets: adaptive models, portfolio
                guidance, and contextual learning designed for clarity.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() =>
                    navigate(isSignedIn ? "/portfolio" : "/sign-up")
                  }
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 text-white dark:text-white"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSignedIn ? "Go to Dashboard" : "Get Started"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
              {/* Stats (icon-based, no emojis) */}
              {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-10 border-t border-purple-200 dark:border-slate-800">
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="group p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-purple-200 dark:border-slate-800 hover:border-indigo-500/40 transition-colors flex flex-col"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/10 flex items-center justify-center mb-2">
                      <stat.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-3" />
                    </div>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-slate-700 mt-1 font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div> */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-purple-200 dark:border-slate-800">
    {stats.map((stat) => (
    <div
      key={stat.id}
      className="group p-6 rounded-2xl bg-white dark:bg-slate-900/60 
                 border border-purple-200/40 dark:border-slate-800 
                 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10
                 transition-all flex flex-col items-start"
    >
      <div className="w-12 h-12 rounded-xl bg-indigo-600/15 dark:bg-indigo-600/15 
                      flex items-center justify-center mb-3">
        <stat.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
      </div>

      <p className="text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
        {stat.value}
      </p>

      <p className="text-sm text-neutral-600 dark:text-slate-400 mt-1 font-medium">
        {stat.label}
      </p>
    </div>
  ))}
</div>

              <p className="text-[10px] text-neutral-500 dark:text-slate-500 mt-2">
                *Prototype environment metric.
              </p>
            </div>
            {/* MARKET WIDGET */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-purple-200 dark:border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-3 rounded-full animate-pulse" />
                    <span className="text-sm text-neutral-600 dark:text-slate-400 font-medium">
                      Live Market
                    </span>
                  </div>
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
                      <div
                        key={i}
                        className="bg-neutral-100/70 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-neutral-200 dark:hover:bg-slate-800 transition-colors border border-neutral-200 dark:border-slate-700/30"
                      >
                        <div>
                          <p className="font-medium text-neutral-700 dark:text-slate-400 text-sm">
                            {m.name}
                          </p>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                            {typeof m.value === "number"
                              ? m.value.toLocaleString()
                              : m.value}
                          </p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg font-semibold ${
                            m.up
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-3"
                              : "bg-red-500/15 text-red-600 dark:text-red-3"
                          }`}
                        >
                          {m.change}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-3 mt-3">
                    Failed to fetch data.{" "}
                    <button
                      className="underline hover:text-red-300"
                      onClick={refetch}
                    >
                      Retry
                    </button>
                  </p>
                )}

                <div className="mt-6 h-36 bg-gradient-to-t from-blue-600/10 to-transparent rounded-xl flex items-end justify-around px-4 pb-4 border border-slate-700/30">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 70, 95].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="w-3 bg-gradient-to-t from-blue-500 to-indigo-3 rounded-t transition-all hover:from-blue-3 hover:to-indigo-300"
                        style={{ height: `${h}%` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-teal-3 rounded-full" />
          </div>
        </div>
      </section>

      {/* WHY FINEDGE SECTION */}
      <section className="relative pt-12 pb-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-4xl font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-300">
              Why FinEdge
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Empowering Investors with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Contextual Intelligence
              </span>
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Blending real-time market data, adaptive AI models, and guided
              learning pathways to optimize your financial decision making.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Market Intelligence",
                desc: "Advanced machine learning algorithms analyze market patterns, news sentiment, and technical indicators to deliver precise investment recommendations. Our AI continuously learns from market behavior to enhance prediction accuracy. Get personalized insights tailored to your investment style and risk tolerance.",
              },
              {
                icon: Target,
                title: "Goal-Based Financial Planning",
                desc: "Define your financial objectives and receive custom investment roadmaps with clear milestones and timelines. Our platform tracks your progress and adjusts strategies based on market conditions. Experience systematic wealth building with measurable outcomes and adaptive planning.",
              },
              {
                icon: BarChart3,
                title: "Real-Time Market Analytics",
                desc: "Access live data from NSE and BSE exchanges with comprehensive technical analysis and automated stock screening. Get instant alerts on market movements, sector rotations, and emerging opportunities. Make informed decisions with up-to-the-minute market intelligence.",
              },
              {
                icon: BookOpen,
                title: "Interactive Learning Hub",
                desc: "Master investment concepts through structured learning paths covering fundamental and technical analysis. Practice with virtual portfolios and real market scenarios without financial risk. Build lasting financial knowledge through hands-on experience and expert-curated content.",
              },
              {
                icon: Shield,
                title: "Advanced Risk Management",
                desc: "Protect your investments with comprehensive portfolio analysis including sector allocation, correlation studies, and stress testing. Monitor volatility metrics and receive risk-adjusted recommendations. Optimize returns while maintaining your desired risk profile through systematic analysis.",
              },
              {
                icon: Zap,
                title: "Seamless Portfolio Execution",
                desc: "Execute investment strategies efficiently with integrated broker connectivity and automated rebalancing features. Track performance metrics and transaction costs in real-time. Streamline your investment workflow from analysis to execution with minimal friction and maximum transparency.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="group p-8 rounded-xl bg-white dark:bg-slate-900/60 border-2 border-purple-200 dark:border-slate-800 hover:border-purple-3 dark:hover:border-indigo-500/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-slate-400">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* GLIMPSE SECTION */}
      <GlimpseSection />

      {/* TESTIMONIALS SECTION
      <section className="relative py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-300">
              Testimonials
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Trusted by Early Users
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-slate-700 max-w-2xl mx-auto">
              Real feedback from investors who've transformed their portfolios
              with FinEdge's AI-powered insights
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Ananya Sharma",
                role: "Senior Investment Analyst",
                company: "HDFC Asset Management",
                quote:
                  "FinEdge's AI recommendations helped me identify undervalued mid-cap opportunities that delivered exceptional returns. The risk analysis framework is particularly impressive for institutional use. The platform has become an integral part of our investment research process.",
                avatar: "AS",
              },
              {
                name: "Rohit Agarwal",
                role: "Portfolio Manager",
                company: "Axis Securities",
                quote:
                  "The real-time market insights and sector rotation alerts have significantly enhanced our trading efficiency. My clients have experienced consistent portfolio growth using FinEdge's strategic recommendations. The analytical depth is remarkable for retail accessibility.",
                avatar: "RA",
              },
              {
                name: "Priya Krishnan",
                role: "Wealth Manager",
                company: "ICICI Private Banking",
                quote:
                  "FinEdge's integrated learning modules have transformed how I educate clients about complex investment strategies. The platform successfully bridges sophisticated analytics with practical application. It's an invaluable tool for wealth management professionals.",
                avatar: "PK",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="group p-8 rounded-xl bg-white dark:bg-slate-800/60 border-2 border-purple-200 dark:border-slate-700 hover:border-purple-3 dark:hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-3 font-medium">
                      {testimonial.role}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-slate-500">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                <blockquote className="text-sm leading-relaxed text-neutral-700 dark:text-slate-70000 italic flex-grow">
                  "{testimonial.quote}"
                </blockquote>
                <div className="mt-6 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4 text-yellow-3 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FEATURES SECTION
      <section className="relative py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-3 font-semibold tracking-wider uppercase text-sm">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mt-4">
              Powerful Tools for{" "}
              <span className="bg-gradient-to-r from-blue-3 to-indigo-3 bg-clip-text text-transparent">
                Smart Investing
              </span>
            </h2>
            <p className="text-xl text-neutral-800 dark:text-slate-700 mt-4 max-w-2xl mx-auto">
              Everything you need to make informed investment decisions in
              Indian markets.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.id}
                className="group relative bg-white dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-purple-200 dark:border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 overflow-hidden"
              >
                <div className="p-8">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <f.icon className="text-white dark:text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-slate-700 leading-relaxed">
                    {f.short}
                  </p>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === f.id ? null : f.id)
                    }
                    className="mt-6 inline-flex items-center text-indigo-600 dark:text-indigo-3 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors whitespace-nowrap text-sm"
                  >
                    {expandedId === f.id ? "Show less" : "Learn more"}
                    <ChevronDown
                      className={`ml-2 transition-transform duration-300 ${
                        expandedId === f.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    expandedId === f.id
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-8 pb-8 pt-2 border-t border-slate-700/50">
                    <p className="text-sm text-neutral-700 dark:text-slate-70000 leading-relaxed">
                      {f.long}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}



      {/* CTA SECTION
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM36 0V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-3/20 rounded-full blur-3xl" />
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

      {/* FOOTER */}
      <footer className="relative border-t border-purple-200 dark:border-slate-800 bg-neutral-50/90 dark:bg-slate-950/90 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent leading-tight pb-1">
                FinEdge
              </h3>
              <p className="text-neutral-600 dark:text-slate-400 max-w-md">
                An AI-powered investment analysis platform for Indian markets.
                Built to demonstrate the potential of machine learning in
                financial technology.
              </p>
              <div className="flex pt-4">
                <div className="w-[152px] flex items-center justify-center">
                  <a
                    href="https://github.com/Code-Ph0enix/FinEdge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[152px] h-10  bg-neutral-200 dark:bg-slate-800 hover:bg-neutral-300 dark:hover:bg-teal-600 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 text-neutral-800 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white"
                    // className="w-[152px] h-10 bg-slate-800 hover:bg-teal-600 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-110 text-slate-70000 hover:text-white"
                  >
                    {/* GitHub Icon */}
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">GitHub</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 17L17 7M17 7H9M17 7v8"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate("/portfolio")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Portfolio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio/financial-path")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Financial Path
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio/chatbot")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    AI Advisor
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio/recommendations")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Recommendations
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio/learn")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Learn
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/portfolio/money-pulse")}
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Market News
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/assets/FinEdge_Report.pdf"
                    download
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="/api-docs.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:eeshanyajoshi@gmail.com"
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+918169570762"
                    className="text-slate-400 hover:text-blue-900 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-slate-400">
              <span>Made with</span>
              <span className="text-red-500 text-base">♥</span>
              <span>by</span>
              <a
                href="https://github.com/realsanjaysharma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-3 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Rohit Deshpande
              </a>
              <span>,</span>
              <a
                href="https://github.com/shubhjalui"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-3 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Shubh Jalui
              </a>
              <span>,</span>
              <a
                href="https://github.com/Code-Ph0enix"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-3 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Eeshanya Joshi
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
