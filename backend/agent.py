from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from react_template import get_react_prompt_template
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.mytools import *
# no warnings
import warnings
import sys
import os
warnings.filterwarnings("ignore")


# print(get_all_tool_names())
# exit()

# load environment variables
load_dotenv()

# Choose the LLM to use
# Using Gemini 2.0 Flash with strict ReAct formatting
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
    max_output_tokens=1024
)
# llm = ChatGroq(model="llama-3.3-70b-versatile")

# set my message
query = """ Should I invest in Cipla pharmaceuticals? """

# set the tools (including search for financial research)
tools = [add, subtract, multiply, divide, power, search, repl_tool, get_historical_price, get_current_price, get_company_info, check_system_time]
# print(tools)
# Get the react prompt template
prompt_template = get_react_prompt_template()

# Construct the ReAct agent
agent = create_react_agent(llm, tools, prompt_template)

# Create an agent executor by passing in the agent and tools
agent_executor = AgentExecutor(
    agent=agent, 
    tools=tools, 
    verbose=True, 
    handle_parsing_errors=True,
    max_iterations=3,  # Limit iterations to prevent infinite loops
    return_intermediate_steps=False
)


def get_agent_response(user_input: str) -> str:
    try:
        response = agent_executor.invoke({"input": user_input})
        return response["output"]
    except Exception as e:
        print("Error:", e)  # Enable error printing to see what's wrong
        return f"Sorry, I encountered an error: {str(e)}"

# def run_agent_final()

# Test case
if __name__ == "__main__":
    # Sample test query
    # test_query = "Research that should i invest in IT-companies now?"
    # test_query = input("Enter your query: ")
    # print("Test Query:", test_query)
    # response = get_agent_response(test_query)
    # print("Response:", response)
    if len(sys.argv) > 1:
        # Get the query from command line arguments
        query = ' '.join(sys.argv[1:])  # Join all arguments after script name
        print("Query:", query)
        response = get_agent_response(query)
        print("<Response>", response, "</Response>")
    else:
        print("Please provide a query as command line argument")
        print("Example: python agent.py Should I invest in Cipla pharmaceuticals?")