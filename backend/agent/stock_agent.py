import os
import sys
from pathlib import Path

# Add the project root directory to Python path to ensure imports work
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from typing import TypedDict, Annotated, Sequence
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from mlmodels.stock_data import StockData
from mlmodels.stock_model_holdout import StockModelHoldout
from mlmodels.stock_hyperopt import StockHyperopt
import matplotlib
matplotlib.use('Agg')  # Use Agg backend to avoid GUI issues on server
from datetime import datetime, timedelta
import re

# Load environment variables
load_dotenv()

# Define the state type
class AgentState(TypedDict):
    messages: Annotated[Sequence[HumanMessage | AIMessage], "The conversation history"]
    stock_data: StockData | None
    holdout_model: StockModelHoldout | None
    hyperopt_model: StockHyperopt | None
    last_action: str | None
    error: str | None
    image_data: str | None  # Added to store Base64 image string for frontend

# Initialize the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"), 
    temperature=0.7
)

class StockAgent:
    def __init__(self):
        self.llm = llm

# Define the system prompt with explicit Indian Market instructions
system_prompt = """You are a helpful stock market analysis assistant specializing in the INDIAN STOCK MARKET (NSE/BSE).
Your role is to:
1. Understand user requests about stock data.
2. Extract stock tickers. **CRITICAL:** If the user gives a company name (e.g., "Reliance", "TCS", "HDFC"), convert it to the Yahoo Finance ticker format with '.NS' suffix (e.g., "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS").
3. Perform appropriate analysis (historical data, forecasting, or hyperparameter tuning).
4. Provide clear and informative responses.

When analyzing stocks, you can:
- Show historical price data
- Create forecasts using Prophet
- Tune hyperparameters for better predictions

Always be clear about what you're doing and explain the results in a way that's easy to understand."""

# Create the prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="messages"),
])

def parse_relative_date(date_str: str) -> str:
    """Convert relative date expressions to YYYY-MM-DD format."""
    today = datetime.now()
    if date_str.lower() == "today":
        return today.strftime('%Y-%m-%d')
    
    match = re.match(r'(\d+)\s+years?\s+ago', date_str.lower())
    if match:
        years = int(match.group(1))
        return (today - timedelta(days=years*365)).strftime('%Y-%m-%d')
    
    match = re.match(r'(\d+)\s+months?\s+ago', date_str.lower())
    if match:
        months = int(match.group(1))
        return (today - timedelta(days=months*30)).strftime('%Y-%m-%d')
    
    match = re.match(r'(\d+)\s+days?\s+ago', date_str.lower())
    if match:
        days = int(match.group(1))
        return (today - timedelta(days=days)).strftime('%Y-%m-%d')
    
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except ValueError:
        return today.strftime('%Y-%m-%d')

# --- NODES ---

def extract_stock_info(state: AgentState) -> AgentState:
    """Extract stock information from user input."""
    try:
        last_message = state["messages"][-1].content
        
        # LLM extraction with explicit instruction for Indian Tickers
        response = llm.invoke([
            HumanMessage(content=f"""Extract the stock ticker symbol and date range from: "{last_message}"
            
            IMPORTANT RULES FOR INDIAN STOCKS:
            - Convert company names to their NSE ticker symbol ending in '.NS'.
            - Example: "Reliance" -> "RELIANCE.NS", "Tata Motors" -> "TATAMOTORS.NS", "Zomato" -> "ZOMATO.NS".
            
            Return format:
            TICKER: [ticker]
            START_DATE: [start_date]
            END_DATE: [end_date]
            
            Defaults if missing: start_date = 3 years ago, end_date = today""")
        ])
        
        info = {}
        for line in response.content.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                info[key.strip()] = value.strip()
        
        ticker = info.get('TICKER', '')
        start_date = parse_relative_date(info.get('START_DATE', '3 years ago'))
        end_date = parse_relative_date(info.get('END_DATE', 'today'))
        
        if ticker:
            # Initialize StockData with the extracted ticker
            state["stock_data"] = StockData(ticker, start_date, end_date)
            # We try fetching here to validate the ticker early
            state["stock_data"].fetch_closing_prices()
            
        return state
    except Exception as e:
        state["last_action"] = f"Error extracting info: {str(e)}"
        state["error"] = str(e)
        return state

def analyze_historical_data(state: AgentState) -> AgentState:
    """Analyze historical stock data."""
    try:
        if state["stock_data"] and state["stock_data"].dataframe is not None:
            # Generate Image and store Base64 string in state
            img_base64 = state["stock_data"].visualize_data()
            state["image_data"] = img_base64
            state["last_action"] = f"Historical analysis completed for {state['stock_data'].ticker}."
        else:
            state["last_action"] = "No stock data available for analysis"
            
        return state
    except Exception as e:
        state["last_action"] = f"Error in historical analysis: {str(e)}"
        return state

def run_holdout_analysis(state: AgentState) -> AgentState:
    """Run holdout analysis."""
    try:
        if state["stock_data"]:
            state["holdout_model"] = StockModelHoldout(state["stock_data"])
            metrics = state["holdout_model"].run_analysis()
            
            # Generate Image (Base64)
            img_base64 = state["holdout_model"].visualize_forecast()
            state["image_data"] = img_base64
            
            metrics_msg = "\n".join([f"{metric}: {value:.4f}" for metric, value in metrics.items()])
            state["last_action"] = f"Holdout analysis completed. Metrics:\n{metrics_msg}"
        else:
            state["last_action"] = "No stock data available for holdout analysis"
            
        return state
    except Exception as e:
        state["last_action"] = f"Error in holdout analysis: {str(e)}"
        return state

def run_hyperopt_analysis(state: AgentState) -> AgentState:
    """Run hyperparameter optimization."""
    try:
        if state["stock_data"]:
            state["hyperopt_model"] = StockHyperopt(state["stock_data"])
            # Reduced max_evals to 10 for faster web response
            best_params = state["hyperopt_model"].run_analysis(max_evals=10)
            
            # Generate Image (Base64)
            img_base64 = state["hyperopt_model"].visualize_forecast()
            state["image_data"] = img_base64
            
            params_msg = "\n".join([f"{param}: {value}" for param, value in best_params.items()])
            state["last_action"] = f"Optimization completed. Best parameters:\n{params_msg}"
        else:
            state["last_action"] = "No stock data available for optimization"
            
        return state
    except Exception as e:
        state["last_action"] = f"Error in hyperopt analysis: {str(e)}"
        return state

def generate_response(state: AgentState) -> AgentState:
    """Generate final response."""
    try:
        messages = state["messages"]
        context = f"Last action: {state['last_action']}\n\nUser's last message: {messages[-1].content}"
        
        response = llm.invoke([HumanMessage(content=context)])
        state["messages"].append(AIMessage(content=response.content))
        
        return state
    except Exception as e:
        state["messages"].append(AIMessage(content=f"Error generating response: {str(e)}"))
        return state

# --- GRAPH SETUP ---

workflow = StateGraph(AgentState)

workflow.add_node("extract_stock_info", extract_stock_info)
workflow.add_node("analyze_historical", analyze_historical_data)
workflow.add_node("run_holdout", run_holdout_analysis)
workflow.add_node("run_hyperopt", run_hyperopt_analysis)
workflow.add_node("generate_response", generate_response)

def route_based_on_intent(state: AgentState) -> str:
    last_message = state["messages"][-1].content.lower()
    if "forecast" in last_message and ("tune" in last_message or "optimize" in last_message):
        return "run_hyperopt"
    elif "forecast" in last_message or "predict" in last_message:
        return "run_holdout" # Or default to Hyperopt if you prefer accuracy
    elif "historical" in last_message or "price" in last_message:
        return "analyze_historical"
    else:
        # Default to Holdout for generic "Analyze X" requests as it's a good balance
        return "run_holdout" 

workflow.add_conditional_edges(
    "extract_stock_info",
    route_based_on_intent,
    {
        "analyze_historical": "analyze_historical",
        "run_holdout": "run_holdout",
        "run_hyperopt": "run_hyperopt",
        "generate_response": "generate_response"
    }
)

workflow.add_edge("analyze_historical", "generate_response")
workflow.add_edge("run_holdout", "generate_response")
workflow.add_edge("run_hyperopt", "generate_response")
workflow.add_edge("generate_response", END)

workflow.set_entry_point("extract_stock_info")
app = workflow.compile()

class StockAgent:
    def __init__(self):
        self.state = {
            "messages": [],
            "stock_data": None,
            "holdout_model": None,
            "hyperopt_model": None,
            "last_action": None,
            "error": None,
            "image_data": None
        }
        
    def process_user_input(self, user_input: str) -> str:
        try:
            self.state["messages"].append(HumanMessage(content=user_input))
            self.state = app.invoke(self.state)
            return self.state["messages"][-1].content
        except Exception as e:
            return f"Error processing request: {str(e)}"

# For testing
if __name__ == "__main__":
    agent = StockAgent()
    print(agent.process_user_input("Forecast Reliance"))