import os
import sys
from pathlib import Path
from typing import TypedDict, Annotated, Sequence, Dict

# Add project root to path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END

# Import Models
from mlmodels.stock_data import StockData
from mlmodels.stock_model_holdout import StockModelHoldout
from mlmodels.stock_hyperopt import StockHyperopt

import matplotlib
matplotlib.use('Agg') # Crucial for server-side plotting
from datetime import datetime, timedelta
import re

# Load environment variables
load_dotenv()

# --- 1. UPDATED STATE DEFINITION ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[HumanMessage | AIMessage], "The conversation history"]
    stock_data: StockData | None
    holdout_model: StockModelHoldout | None
    hyperopt_model: StockHyperopt | None
    last_action: str | None
    error: str | None
    # CHANGE: Now stores a dictionary of multiple images
    images: Dict[str, str] 

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"), 
    temperature=0.7
)

# Date parsing utility (Unchanged)
def parse_relative_date(date_str: str) -> str:
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

# --- 2. NODES ---

def extract_stock_info(state: AgentState) -> AgentState:
    """Extract stock information and initialize image dict."""
    try:
        last_message = state["messages"][-1].content
        
        # Initialize empty images dict for this run
        state["images"] = {}
        state["error"] = None

        response = llm.invoke([
            HumanMessage(content=f"""Extract the stock ticker symbol and date range from: "{last_message}"
            
            IMPORTANT RULES FOR INDIAN STOCKS:
            - Convert company names to their NSE ticker symbol ending in '.NS'.
            - Example: "Reliance" -> "RELIANCE.NS", "Tata Motors" -> "TATAMOTORS.NS".
            
            Return format:
            TICKER: [ticker]
            START_DATE: [start_date]
            END_DATE: [end_date]
            
            Defaults: start_date = 3 years ago, end_date = today""")
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
            state["stock_data"] = StockData(ticker, start_date, end_date)
            # Fetch data immediately to fail fast if invalid
            state["stock_data"].fetch_closing_prices()
            
        return state
    except Exception as e:
        state["last_action"] = f"Error extracting info: {str(e)}"
        state["error"] = str(e)
        return state

def run_full_pipeline(state: AgentState) -> AgentState:
    """
    Runs the complete analysis pipeline sequentially:
    1. Historical Analysis (2 Images)
    2. Holdout Validation (1 Image + Metrics)
    3. Hyperopt Forecast (1 Image + Best Params)
    """
    try:
        if not state["stock_data"] or state["stock_data"].dataframe is None:
            state["error"] = "No data available for analysis."
            return state

        print(f"Starting pipeline for {state['stock_data'].ticker}...")

        # --- STEP 1: HISTORICAL DATA (2 IMAGES) ---
        # Image 1: Price History
        state["images"]["price_history"] = state["stock_data"].get_price_plot()
        # Image 2: Daily Returns
        state["images"]["daily_returns"] = state["stock_data"].get_returns_plot()
        
        # --- STEP 2: HOLDOUT VALIDATION (1 IMAGE) ---
        holdout = StockModelHoldout(state["stock_data"])
        metrics = holdout.run_analysis() # Train/Test split analysis
        state["holdout_model"] = holdout
        # Image 3: Actual vs Predicted
        state["images"]["holdout_pred"] = holdout.visualize_forecast()
        
        # --- STEP 3: HYPEROPT FORECAST (1 IMAGE) ---
        hyperopt = StockHyperopt(state["stock_data"])
        # Run optimization (max_evals=10 for speed on web)
        best_params = hyperopt.run_analysis(max_evals=10) 
        state["hyperopt_model"] = hyperopt
        # Image 4: Future Forecast
        state["images"]["future_forecast"] = hyperopt.visualize_forecast()

        # Save technical details for the LLM to summarize
        metrics_str = ", ".join([f"{k}: {v:.4f}" for k, v in metrics.items()])
        state["last_action"] = (
            f"Successfully generated 4 charts.\n"
            f"Validation Metrics: {metrics_str}\n"
            f"Optimized Params: {best_params}"
        )
        print("Pipeline completed successfully.")
        
        return state

    except Exception as e:
        error_msg = f"Pipeline execution failed: {str(e)}"
        print(error_msg)
        state["error"] = error_msg
        state["last_action"] = error_msg
        return state

def generate_summary(state: AgentState) -> AgentState:
    """Generate a comprehensive summary of all findings."""
    try:
        if state["error"]:
            response_text = f"I encountered an error during the analysis: {state['error']}. Please check the ticker symbol and try again."
        else:
            ticker = state["stock_data"].ticker
            # Rich context for the LLM
            context = f"""
            You have successfully analyzed {ticker} for the Indian Market.
            
            The system has generated 4 visual charts for the user:
            1. Closing Price History (Trend)
            2. Daily Returns Distribution (Volatility)
            3. Validation Model (Actual vs Predicted)
            4. Future Forecast (Next Year Prediction)
            
            Technical Data:
            {state['last_action']}
            
            User's Original Request: {state['messages'][-1].content}
            
            Please provide a structured summary (plain text, no markdown) that:
            1. Summarizes the historical trend and volatility.
            2. Explains the validation metrics (RMSE/MAE) - is the model trustworthy?
            3. Interprets the future forecast direction.
            4. Ends with a neutral disclaimer that this is AI-generated analysis, not financial advice.
            """
            
            response = llm.invoke([HumanMessage(content=context)])
            response_text = response.content

        state["messages"].append(AIMessage(content=response_text))
        return state
    except Exception as e:
        state["messages"].append(AIMessage(content=f"Error generating summary: {str(e)}"))
        return state

# --- 3. GRAPH SETUP (LINEAR PIPELINE) ---

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("extract_info", extract_stock_info)
workflow.add_node("run_pipeline", run_full_pipeline)
workflow.add_node("summarize", generate_summary)

# Define Linear Flow (No routing needed for full report)
workflow.add_edge("extract_info", "run_pipeline")
workflow.add_edge("run_pipeline", "summarize")
workflow.add_edge("summarize", END)

workflow.set_entry_point("extract_info")
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
            "images": {} # Initialize empty dict for images
        }
        
    def process_user_input(self, user_input: str) -> str:
        try:
            self.state["messages"] = [HumanMessage(content=user_input)]
            # Invoke the graph
            result_state = app.invoke(self.state)
            
            # Update internal state with result so images can be accessed by API
            self.state = result_state 
            
            return self.state["messages"][-1].content
        except Exception as e:
            return f"Error processing request: {str(e)}"

# For testing
if __name__ == "__main__":
    agent = StockAgent()
    print("Running test...")
    response = agent.process_user_input("Forecast Reliance")
    print("\nResponse:", response)
    print("\nImages generated:", list(agent.state["images"].keys()))