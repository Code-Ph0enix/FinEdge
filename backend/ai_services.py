# services/ai_service.py
import os
import re
import json
from dotenv import load_dotenv
import google.generativeai as genai

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_react_agent

# Custom tools
from react_template import get_react_prompt_template
from tools.mytools import (
    add, subtract, multiply, divide, power,
    search, repl_tool, get_historical_price,
    get_current_price, get_company_info,
    schedule_task, check_system_time, evaluate_returns
)

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

class FinancialAIService:
    def __init__(self):
        self.generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }

        # Base system instructions
        self.system_instruction = (
            "You are a personal financial advisor dedicated to helping in financial journey. "
            "Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. "
            "Be precise and practical in your advice while considering individual circumstances.\n\n"
            "Key areas of expertise:\n- Budgeting and expense tracking\n- Investment strategies and portfolio management\n"
            "- Retirement planning\n- Debt management and elimination\n- Tax planning considerations\n- Emergency fund planning\n"
            "- Risk management and insurance\n\nProvide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.\n"
            "Please make a short reply response, suited for WhatsApp-like messages."
        )

        # Gemini text chat
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=self.generation_config,
            system_instruction=self.system_instruction,
        )
        self.chat_session = self.model.start_chat(history=[])

        # Gemini financial path (JSON output)
        fin_path_instruction = (
            self.system_instruction +
            "\n\nYou can increase the number of nodes and edges in the response if needed.\n\n"
            "For the given user query you have to respond in the following strict format:\n"
            "{...JSON NODES/EDGES FORMAT...}"
        )
        self.fin_path_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=self.generation_config,
            system_instruction=fin_path_instruction,
        )
        self.fin_path_session = self.fin_path_model.start_chat(history=[])

        # Cache agents by llm_type
        self.agents = {}

    # ---------- LangChain Agent ----------
    def get_langchain_agent(self, llm_type="groq"):
        if llm_type in self.agents:
            return self.agents[llm_type]

        if llm_type == "groq":
            llm = ChatGroq(model="llama-3.3-70b-versatile")
        elif llm_type == "gemini":
            llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
        elif llm_type == "openai":
            llm = ChatOpenAI(model="gpt-4")
        elif llm_type == "ollama":
            llm = ChatOllama(model="deepseek-r1:14b", temperature=0.5)
        else:
            llm = ChatGroq(model="llama-3.3-70b-versatile")

        tools = [
            add, subtract, multiply, divide, power, search, repl_tool,
            get_historical_price, get_current_price, get_company_info,
            schedule_task, check_system_time, evaluate_returns
        ]
        prompt_template = get_react_prompt_template()
        agent = create_react_agent(llm, tools, prompt_template)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        self.agents[llm_type] = agent_executor
        return agent_executor

    def get_agent_response(self, user_input: str, llm_type="groq") -> str:
        try:
            agent_executor = self.get_langchain_agent(llm_type)
            response = agent_executor.invoke({"input": user_input})
            return response["output"]
        except Exception as e:
            return f"Agent error: {str(e)}"

    # ---------- Gemini Chat ----------
    def chat_with_gemini(self, message, media_file_path=None):
        files = []
        if media_file_path:
            for media_file in media_file_path:
                f = genai.upload_file(media_file, mime_type="audio/mpeg")
                files.append(f)
            response = self.chat_session.send_message(message, media_files=files)
        else:
            response = self.chat_session.send_message(message)
        return response.text

    # ---------- Gemini Financial Path ----------
    def get_gemini_fin_path(self, user_input: str, risk: str) -> dict:
        response = self.fin_path_session.send_message(
            f'{user_input}\nMy risk profile is: {risk}'
        )
        markdown_text = response.text
        try:
            json_match = re.search(r'```json\s*(.*?)\s*```', markdown_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            return json.loads(markdown_text)
        except Exception:
            return {"error": "Invalid JSON response from Gemini", "raw": markdown_text}

    # ---------- Unified Interface ----------
    def unified_chatbot(
        self,
        user_input: str,
        mode: str = "agent",   # "agent", "gemini", "fin_path"
        llm_type: str = "groq",
        risk: str = "conservative",
        media_file_path=None
    ):
        if mode == "agent":
            return self.get_agent_response(user_input, llm_type)
        elif mode == "gemini":
            return self.chat_with_gemini(user_input, media_file_path)
        elif mode == "fin_path":
            return self.get_gemini_fin_path(user_input, risk)
        else:
            return {"error": "Invalid mode selected"}


# import os
# from dotenv import load_dotenv
# import google.generativeai as genai
# import re
# import json

# # LangChain imports
# from langchain_openai import ChatOpenAI
# from langchain_groq import ChatGroq
# from langchain_ollama import ChatOllama
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.agents import AgentExecutor, create_react_agent
# from react_template import get_react_prompt_template
# from tools.mytools import *

# load_dotenv()
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# # --------- LangChain Agent Setup ---------
# def get_langchain_agent(llm_type="groq"):
#     if llm_type == "groq":
#         llm = ChatGroq(model="llama-3.3-70b-versatile")
#     elif llm_type == "gemini":
#         llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
#     elif llm_type == "openai":
#         llm = ChatOpenAI(model="gpt-4")
#     elif llm_type == "ollama":
#         llm = ChatOllama(model="deepseek-r1:14b", temperature=0.5)
#     else:
#         llm = ChatGroq(model="llama-3.3-70b-versatile")
#     tools = [
#         add, subtract, multiply, divide, power, search, repl_tool,
#         get_historical_price, get_current_price, get_company_info,
#         schedule_task, check_system_time, evaluate_returns
#     ]
#     prompt_template = get_react_prompt_template()
#     agent = create_react_agent(llm, tools, prompt_template)
#     agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
#     return agent_executor

# def get_agent_response(user_input: str, llm_type="groq") -> str:
#     agent_executor = get_langchain_agent(llm_type)
#     try:
#         response = agent_executor.invoke({"input": user_input})
#         return response["output"]
#     except Exception:
#         return "Sorry, I couldn't understand that. Please try again."

# # --------- Gemini Chat Setup ---------
# generation_config = {
#     "temperature": 1,
#     "top_p": 0.95,
#     "top_k": 40,
#     "max_output_tokens": 8192,
#     "response_mime_type": "text/plain",
# }

# system_instruction = (
#     "You are a personal financial advisor dedicated to helping in financial journey. "
#     "Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. "
#     "Be precise and practical in your advice while considering individual circumstances.\n\n"
#     "Key areas of expertise:\n- Budgeting and expense tracking\n- Investment strategies and portfolio management\n"
#     "- Retirement planning\n- Debt management and elimination\n- Tax planning considerations\n- Emergency fund planning\n"
#     "- Risk management and insurance\n\nProvide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.\n"
#     "Please make a short reply response, suited for whatsapp like messages."
# )

# model = genai.GenerativeModel(
#     model_name="gemini-1.5-flash",
#     generation_config=generation_config,
#     system_instruction=system_instruction,
# )

# chat_session = model.start_chat(history=[])

# def upload_to_gemini(path, mime_type=None):
#     file = genai.upload_file(path, mime_type=mime_type)
#     print(f"Uploaded file '{file.display_name}' as: {file.uri}")
#     return file

# def chat_with_gemini(message, media_file_path=None):
#     global chat_session
#     files = []
#     if media_file_path:
#         for media_file in media_file_path:
#             files.append(upload_to_gemini(media_file, mime_type="audio/mpeg"))
#         response = chat_session.send_message(message, media_files=files)
#         return response.text
#     else:
#         response = chat_session.send_message(message)
#         return response.text

# # --------- Gemini Financial Pathway ---------
# fin_path_instruction = (
#     system_instruction +
#     "\n\nYou can increase the number of nodes and edges in the response if needed.\n\n"
#     "For the given user query you have to response a proper output by giving proper response in the following format\n"
#     "Strictly follow the given format only\n\n"
#     "{...JSON NODES/EDGES FORMAT...}"
# )

# fin_path_model = genai.GenerativeModel(
#     model_name="gemini-1.5-flash",
#     generation_config=generation_config,
#     system_instruction=fin_path_instruction,
# )
# fin_path_session = fin_path_model.start_chat(history=[])

# def get_gemini_fin_path(user_input: str, risk: str) -> dict:
#     response = fin_path_session.send_message(f'{user_input} \nMy risk profile is:{risk}')
#     markdown_text = response.text
#     json_match = re.search(r'```json\s*(.*?)\s*```', markdown_text, re.DOTALL)
#     if json_match:
#         resp = json.loads(json_match.group(1))
#     else:
#         resp = json.loads(markdown_text)
#     return resp

# # --------- Unified API ---------
# def unified_chatbot(
#     user_input: str,
#     mode: str = "agent",  # "agent", "gemini", "fin_path"
#     llm_type: str = "groq",
#     risk: str = "conservative",
#     media_file_path=None
# ):
#     if mode == "agent":
#         return get_agent_response(user_input, llm_type)
#     elif mode == "gemini":
#         return chat_with_gemini(user_input, media_file_path)
#     elif mode == "fin_path":
#         return get_gemini_fin_path(user_input, risk)
#     else:
#         return "Invalid mode selected."

# # Example usage:
# if __name__ == "__main__":
#     print(unified_chatbot("Should I invest in Cipla pharmaceuticals?", mode="agent"))
#     print(unified_chatbot("Should I invest in Cipla pharmaceuticals?", mode="gemini"))
#     print(unified_chatbot("I have ten lakh rupees, where should I invest?", mode="fin_path", risk="moderate"))