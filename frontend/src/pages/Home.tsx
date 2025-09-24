import { Link } from "react-router-dom";
import {
  TrendingUp,
  Shield,
  Brain,
  BarChart as ChartBar,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const features = [
  {
    icon: <TrendingUp className="h-6 w-6 text-white" />,
    title: "Real-Time Indian Market Insights",
    description:
      "Get instant updates on NIFTY, SENSEX, and personalized insights powered by AI.",
  },
  {
    icon: <Shield className="h-6 w-6 text-white" />,
    title: "Smart Portfolio Management",
    description:
      "Receive tailored investment suggestions for Indian markets based on your goals.",
  },
  {
    icon: <Brain className="h-6 w-6 text-white" />,
    title: "Learn & Grow",
    description:
      "Access educational resources about Indian markets and improve your financial literacy.",
  },
  {
    icon: <ChartBar className="h-6 w-6 text-white" />,
    title: "Market Analysis",
    description:
      "Stay ahead with AI-powered analysis of Indian stock market trends and predictions.",
  },
];

const Home = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-1.5 mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                    Powered by AI
                  </span>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                  <span className="block">Your AI-Powered</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600">
                    Investment Partner for Indian Markets!
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Make smarter investment decisions in Indian markets with
                  AI-driven insights, personalized recommendations, and
                  real-time analysis of NIFTY and SENSEX.
                </p>
                <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    to="/sign-up"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/portfolio/learn"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-indigo-200 dark:border-indigo-800 text-base font-medium rounded-lg text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Learn More
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-10 pt-6 grid grid-cols-3 gap-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      ₹10Cr+
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Assets Analyzed
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      98%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Accuracy Rate
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      5000+
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Active Users
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="relative h-56 w-full sm:h-72 md:h-80 lg:w-4/5 lg:h-4/5 lg:mx-auto lg:my-auto lg:mt-24">
            <img
              className="h-full w-full object-cover lg:rounded-xl shadow-2xl"
              src="https://www.bibs.co.in/blog-image/1708945824.jpeg"
              alt="Analytics Dashboard"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent rounded-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Powerful Features for Smart Investing
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
              Everything you need to make informed investment decisions and grow
              your wealth.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="pt-6">
                  <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="-mt-6">
                      <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md shadow-lg">
                        {feature.icon}
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
