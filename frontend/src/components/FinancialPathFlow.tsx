// LATEST VERSION OF THE CODE
import { useCallback, useState, useRef } from 'react';
import axios from 'axios';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Mic, MicOff, Send, TrendingUp, Shield, IndianRupeeIcon, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SERVER_URL } from '../utils/utils';
import { useUser } from '@clerk/clerk-react';

// Define custom types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResult;
  };
}

interface CustomSpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface CustomSpeechRecognitionErrorEvent {
  error: string;
}

interface StrategyStyle {
  background: string;
  border: string;
  stroke?: string;
}

interface FlowNode extends Node {
  style: StrategyStyle;
}

interface FlowEdge extends Edge {
  style: StrategyStyle;
}

interface AssetBreakdown {
  category: string;
  allocation: string;
  instruments: string[];
  rationale: string;
}

interface Analysis {
  summary: string;
  riskAssessment: string;
  expectedReturns: string;
  timeHorizon: string;
  keyBenefits: string[];
  considerations: string[];
  assetBreakdown: AssetBreakdown[];
  taxImplications: string;
  rebalancingStrategy: string;
}

interface ServerResponse {
  nodes: FlowNode[];
  edges: FlowEdge[];
  analysis: Analysis;
  userProfile: {
    investmentAmount: string;
    riskProfile: string;
    goals: string[];
  };
}

interface SampleInput {
  title: string;
  text: string;
}

const sampleInputs: SampleInput[] = [
  {
    title: "Conservative Investor",
    text: "I'm looking for a low-risk investment strategy to preserve my capital. I prefer stable returns and want to invest ₹1 lakh for 3-5 years. Safety is my primary concern."
  },
  {
    title: "Balanced Growth",
    text: "i want to invest 10 lakhs based on the risk give me different assets classes"
  },
  {
    title: "Aggressive Growth",
    text: "I'm seeking high returns and can take high risks. I want to invest ₹1 lakh for 7-10 years in growth-oriented instruments. Market volatility doesn't worry me."
  }
];

const FinancialPathFlow = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('conservative');
  const [userInput, setUserInput] = useState('');
  const [fetchedUserData, setFetchedUserData] = useState<any>({}); // ✅ STORE FETCHED DATA HERE
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [serverData, setServerData] = useState<ServerResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]) as any;
  const [edges, setEdges, onEdgesChange] = useEdgesState([]) as any;

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds: any) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSpeechToText = () => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setUserInput(transcript);
          if (textareaRef.current) {
            textareaRef.current.value = transcript;
          }
        };

        recognition.onerror = (event: CustomSpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } else {
      setIsListening(false);
      window.speechSynthesis.cancel();
    }
  };

  const handleStrategySelect = (strategy: string) => {
    setActiveTab(strategy);
  };

  const handleGenerate = async () => {
    if (!activeTab) return;
    
    setIsGenerating(true);
    setShowResults(false);
    
    try {
      const clerkUserId = user?.id;
      let userData = {};
      
      if (clerkUserId) {
        try {
          const [profileRes, incomeRes, expensesRes, assetsRes, liabilitiesRes, goalsRes] = await Promise.all([
            fetch(`${SERVER_URL}/api/onboarding/status?clerkUserId=${clerkUserId}`),
            fetch(`${SERVER_URL}/api/user-profile/income?clerkUserId=${clerkUserId}`),
            fetch(`${SERVER_URL}/api/user-profile/expenses?clerkUserId=${clerkUserId}`),
            fetch(`${SERVER_URL}/api/user-profile/assets?clerkUserId=${clerkUserId}`),
            fetch(`${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${clerkUserId}`),
            fetch(`${SERVER_URL}/api/user-profile/goals?clerkUserId=${clerkUserId}`)
          ]);

          const profile = profileRes.ok ? await profileRes.json() : {};
          const income = incomeRes.ok ? await incomeRes.json() : {};
          const expenses = expensesRes.ok ? await expensesRes.json() : {};
          const assets = assetsRes.ok ? await assetsRes.json() : {};
          const liabilities = liabilitiesRes.ok ? await liabilitiesRes.json() : {};
          const goals = goalsRes.ok ? await goalsRes.json() : {};

          const monthlyIncome = income.income?.reduce((sum: number, inc: any) => {
            if (inc.frequency === 'monthly') return sum + inc.amount;
            if (inc.frequency === 'yearly') return sum + (inc.amount / 12);
            return sum;
          }, 0) || 0;

          const monthlyExpenses = expenses.expenses?.reduce((sum: number, exp: any) => {
            if (exp.frequency === 'monthly') return sum + exp.amount;
            if (exp.frequency === 'yearly') return sum + (exp.amount / 12);
            if (exp.frequency === 'weekly') return sum + (exp.amount * 4);
            if (exp.frequency === 'daily') return sum + (exp.amount * 30);
            return sum;
          }, 0) || 0;

          const totalAssets = assets.assets?.reduce((sum: number, asset: any) => sum + asset.value, 0) || 0;
          const totalLiabilities = liabilities.liabilities?.reduce((sum: number, liability: any) => sum + liability.amount, 0) || 0;
          const netWorth = totalAssets - totalLiabilities;

          userData = {
            originalRiskTolerance: profile.profile?.riskTolerance || 'Not specified',
            selectedRiskForThisQuery: activeTab,
            monthlyIncome: `₹${monthlyIncome.toLocaleString('en-IN')}`,
            annualIncome: `₹${(monthlyIncome * 12).toLocaleString('en-IN')}`,
            monthlyExpenses: `₹${monthlyExpenses.toLocaleString('en-IN')}`,
            monthlySavings: `₹${(monthlyIncome - monthlyExpenses).toLocaleString('en-IN')}`,
            totalAssets: `₹${totalAssets.toLocaleString('en-IN')}`,
            totalLiabilities: `₹${totalLiabilities.toLocaleString('en-IN')}`,
            netWorth: `₹${netWorth.toLocaleString('en-IN')}`,
            financialGoals: goals.goals?.map((g: any) => g.name) || [],
            assetCategories: assets.assets?.map((a: any) => `${a.category}: ₹${a.value.toLocaleString('en-IN')}`) || [],
            liabilityCategories: liabilities.liabilities?.map((l: any) => 
              `${l.category}: ₹${l.amount.toLocaleString('en-IN')}${l.interestRate ? ` @ ${l.interestRate}%` : ''}`
            ) || []
          };

          // ✅ SAVE TO STATE SO IT'S ACCESSIBLE IN JSX
          setFetchedUserData(userData);
          console.log('✅ Fetched user data:', userData);
        } catch (error) {
          console.error('⚠️ Error fetching user data:', error);
        }
      }

      const formData = new FormData();
      formData.append('input', userInput || 'I\'m looking for a low-risk investment strategy to preserve my capital. I prefer stable returns and want to invest ₹1 lakh for 3-5 years. Safety is my primary concern.');
      formData.append('risk', activeTab);
      formData.append('userData', JSON.stringify(userData));

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${SERVER_URL}/ai-financial-path`,
        data: formData
      };

      const response = await axios.request(config);
      const data: ServerResponse = response.data;
      setServerData(data);
      
      setNodes(data.nodes.map(node => ({
        ...node,
        className: `${node.style.background} border-2 ${node.style.border} rounded-lg p-4 text-center font-medium`,
        data: {
          ...node.data,
          label: (node.data as { label: string }).label.replace('₹', '₹')
        }
      })));
      
      setEdges(data.edges.map(edge => ({
        ...edge,
        className: edge.style.stroke,
        source: edge.source,
        target: edge.target,
        label: edge.label
      })));
      
      setShowResults(true);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('Error generating pathway:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleSampleInput = (text: string) => {
    setUserInput(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const tabs = [
    {
      id: 'conservative',
      label: 'Conservative',
      color: 'indigo',
      description: 'Low-risk approach focusing on capital preservation with stable returns',
      returns: '7-9% p.a.'
    },
    {
      id: 'moderate',
      label: 'Moderate',
      color: 'indigo',
      description: 'Balanced approach with moderate risk and growth potential',
      returns: '12-15% p.a.'
    },
    {
      id: 'aggressive',
      label: 'Aggressive',
      color: 'indigo',
      description: 'High-risk, high-reward strategy focusing on growth',
      returns: '15-20% p.a.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Investment Pathway Generator</h1>
        <p className="text-gray-600 dark:text-gray-300">Create your personalized investment strategy based on your goals and risk tolerance</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Inputs:</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Click to populate)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleInputs.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSampleInput(sample.text)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200 flex items-center group"
              >
                <span className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{sample.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleTextareaInput}
              placeholder="Describe your investment goals, risk tolerance, and preferences..."
              className="w-full min-h-[120px] p-5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSpeechToText}
              className={`absolute top-5 right-5 p-2.5 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isListening 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStrategySelect(tab.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-102 ${
                  activeTab === tab.id
                    ? `border-indigo-500 dark:border-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-700 dark:text-indigo-300 shadow-md`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-semibold">{tab.label}</div>
                <div className="text-sm mt-1 opacity-75">Returns: {tab.returns}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleGenerate}
            disabled={!activeTab || isGenerating}
            className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 transform hover:scale-102 ${
              activeTab && !isGenerating
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="h-6 w-6" />
            <span>{isGenerating ? 'Analyzing Your Preferences...' : 'Generate Investment Pathway'}</span>
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center max-w-2xl mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent mx-auto"></div>
          <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Creating Your Personalized Investment Pathway</h3>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Analyzing your preferences and generating the optimal investment strategy...
          </p>
        </div>
      )}

      {showResults && serverData && (
        <div ref={resultsRef} className="space-y-6 animate-fade-in scroll-mt-8">
          {/* User Profile Summary - FROM MONGODB */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
              <h2 className="text-2xl font-bold text-white">Your Investment Profile (From MyData)</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <IndianRupeeIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fetchedUserData.monthlyIncome || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <IndianRupeeIcon className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Expenses</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fetchedUserData.monthlyExpenses || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <IndianRupeeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Savings</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fetchedUserData.monthlySavings || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Net Worth</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fetchedUserData.netWorth || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Original Risk Profile</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {fetchedUserData.originalRiskTolerance || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selected Risk (This Query)</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {fetchedUserData.selectedRiskForThisQuery || activeTab}
                    </p>
                  </div>
                </div>
              </div>

              {fetchedUserData.financialGoals && fetchedUserData.financialGoals.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Financial Goals</p>
                  <div className="flex flex-wrap gap-2">
                    {fetchedUserData.financialGoals.map((goal: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
              <h2 className="text-2xl font-bold text-white">Investment Strategy Analysis</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Executive Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{serverData.analysis.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Risk Assessment</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{serverData.analysis.riskAssessment}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Expected Returns</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{serverData.analysis.expectedReturns}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Time Horizon</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{serverData.analysis.timeHorizon}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Benefits</h4>
                  <ul className="space-y-2">
                    {serverData.analysis.keyBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Important Considerations</h4>
                  <ul className="space-y-2">
                    {serverData.analysis.considerations.map((consideration, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-amber-500 mr-2">⚠</span>
                        <span className="text-gray-700 dark:text-gray-300">{consideration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
              <h2 className="text-2xl font-bold text-white">Detailed Asset Allocation</h2>
            </div>
            <div className="p-6 space-y-4">
              {serverData.analysis.assetBreakdown.map((asset, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{asset.category}</h3>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{asset.allocation}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{asset.rationale}</p>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recommended Instruments:</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.instruments.map((instrument, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
                <h3 className="text-lg font-bold text-white">Tax Implications</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">{serverData.analysis.taxImplications}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
                <h3 className="text-lg font-bold text-white">Rebalancing Strategy</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">{serverData.analysis.rebalancingStrategy}</p>
              </div>
            </div>
          </div>

          {/* Flowchart Visualization */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
              <h2 className="text-2xl font-bold text-white">Investment Pathway Visualization</h2>
            </div>
            <div className="h-[700px] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-gray-50 dark:bg-gray-800"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { strokeWidth: 2 }
                }}
              >
                <Background color={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPathFlow;
