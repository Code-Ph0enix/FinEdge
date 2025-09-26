# from dotenv import load_dotenv
# from langchain_openai import ChatOpenAI
# from langchain.agents import AgentExecutor, create_react_agent
# from react_template import get_react_prompt_template
# from langchain_groq import ChatGroq
# from langchain_ollama import ChatOllama
# from langchain_google_genai import ChatGoogleGenerativeAI
# from tools.mytools import *
# # no warnings
# import warnings
# import sys
# warnings.filterwarnings("ignore")


# # print(get_all_tool_names())
# # exit()

# # load environment variables
# load_dotenv()

# # Choose the LLM to use
# llm = ChatGroq(model="llama-3.3-70b-versatile")

# # llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")

# # set my message
# query = """ Should I invest in Cipla pharmaceuticals? """

# # set the tools
# tools = [add, subtract, multiply, divide, power, search, repl_tool, get_historical_price, get_current_price, get_company_info, schedule_task, check_system_time]
# # print(tools)
# # Get the react prompt template
# prompt_template = get_react_prompt_template()

# # Construct the ReAct agent
# agent = create_react_agent(llm, tools, prompt_template)

# # Create an agent executor by passing in the agent and tools
# agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)


# def get_agent_response(user_input: str) -> str:
#     try:
#         response = agent_executor.invoke({"input": user_input})
#         return response["output"]
#     except Exception as e:
#         # print("Error:", e)
#         return f"Sorry, I couldn't understand that. Please try again."

# # def run_agent_final()

# # Test case
# if __name__ == "__main__":
#     # Sample test query
#     # test_query = "Research that should i invest in IT-companies now?"
#     # test_query = input("Enter your query: ")
#     # print("Test Query:", test_query)
#     # response = get_agent_response(test_query)
#     # print("Response:", response)
#     if len(sys.argv) > 1:
#         # Get the query from command line arguments
#         query = ' '.join(sys.argv[1:])  # Join all arguments after script name
#         print("Query:", query)
#         response = get_agent_response(query)
#         print("<Response>", response, "</Response>")
#     else:
#         print("Please provide a query as command line argument")
#         print("Example: python agent.py Should I invest in Cipla pharmaceuticals?")




import os
import warnings
import sys
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from tools.mytools import *

warnings.filterwarnings("ignore")
load_dotenv()

def create_improved_agent():
    """Create a more robust ReAct agent with proper error handling"""
    
    # Use the standard ReAct prompt from LangChain Hub
    try:
        prompt = hub.pull("hwchase17/react")
    except:
        # Fallback to manual prompt creation if hub fails
        from langchain.prompts import PromptTemplate
        
        template = """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}"""
        
        prompt = PromptTemplate.from_template(template)
    
    # Try multiple LLM options with fallback
    llm_options = [
        # lambda: ChatGroq(model="llama-3.1-70b-versatile", temperature=0.1),  # More stable model
        # lambda: ChatGroq(model="mixtral-8x7b-32768", temperature=0.1),
        os.environment
        lambda: ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.1)
    ]
    
    llm = None
    for llm_factory in llm_options:
        try:
            llm = llm_factory()
            break
        except Exception as e:
            print(f"Failed to initialize LLM: {e}")
            continue
    
    if not llm:
        raise Exception("Failed to initialize any LLM")
    
    # Define tools with better error handling
    try:
        # tools = [add, subtract, multiply, divide, power, search, repl_tool, 
        #         get_historical_price, get_current_price, get_company_info, 
        #         schedule_task, check_system_time]
        
        # Validate tools have proper schemas
        for tool in tools:
            if not hasattr(tool, 'name') or not hasattr(tool, 'description'):
                print(f"Warning: Tool {tool} may be missing required attributes")
                
    except Exception as e:
        print(f"Error loading tools: {e}")
        tools = []  # Use empty tools list as fallback
    
    # Create agent with error handling
    try:
        agent = create_react_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=tools, 
            verbose=True,
            handle_parsing_errors=True,  # Handle parsing errors gracefully
            max_iterations=5,  # Limit iterations to prevent infinite loops
            early_stopping_method="generate"  # Stop early if needed
        )
        return agent_executor
    except Exception as e:
        print(f"Error creating agent: {e}")
        return None

def get_agent_response(user_input: str, max_retries: int = 3) -> str:
    """Get response from agent with retry logic"""
    
    agent_executor = create_improved_agent()
    if not agent_executor:
        return "Failed to initialize agent. Please check your configuration."
    
    for attempt in range(max_retries):
        try:
            response = agent_executor.invoke({"input": user_input})
            return response.get("output", "No output received")
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                return f"Sorry, I encountered an error after {max_retries} attempts. Please try rephrasing your question."
    
    return "Failed to get response"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = ' '.join(sys.argv[1:])
        print("Query:", query)
        response = get_agent_response(query)
        print("<Response>", response, "</Response>")
    else:
        print("Please provide a query as command line argument")
        print("Example: python agent.py Should I invest in Cipla pharmaceuticals?")
