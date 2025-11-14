<!-- # 💰 FinEdge 🚀  

**FinEdge** is a **comprehensive AI-powered personal finance advisor** that combines various intelligent features including **chatbot capabilities, financial analysis, and much more**. Built with a **modern tech stack**, it features a **React frontend** and a **Python Flask backend**.  

---

## 🌟 Proposed Features  

✅ **AI-powered reAct agent** 🤖 with **LLM integration**  
📊 **Financial analysis & path planning** 📈  
🗣️ **Speech processing capabilities** 🎙️  
📰 **News aggregation & display** 🌍  
🔐 **Secure Google & Metamask login** 🔑  
📊 **Clean visual dashboard** to summarize all your financial data 📉  
📂 **MyData tab** to update your financial information ✏️  
💡 **Recommendations tab** for the best investment options 💰  
📚 **Money Matters** – Learn about finance 🏦  
🛣️ **Financial Path** – Plan your financial journey visually 🗺️  
🧮 **Money Calculator** – Predict your future finances 📅  
🧠 **AI Agent** – Get real-time financial insights using web & APIs 🌐  
🚀 **Money Plus** – Real-time financial news updates 📰  
📈 **Stock Analyzer** – Notifies you of the best investment timings 📊  

---  

## 🛠️ Proposed Tech Stack  

### 🎨 Frontend  
⚛️ **React (TypeScript)**  
🎨 **Tailwind CSS** for styling  
⚡ **Vite** as the build tool  
✅ **ESLint** for code quality  

### 🖥️ Backend  
🐍 **Python Flask**  
🧠 **Google's Gemini AI**  
🤖 **AI/ML libraries**  
☁️ **Cloud services integration**  

---  

## 📋 Prerequisites  

🖥️ **Node.js** (v16 or higher)  
🐍 **Python** (3.8+)  
📦 **npm** or **yarn**  
🔑 **Required API keys** (Gemini, Cloudinary, etc.)  

---  

## 🔧 Installation  

### 🖥️ Backend Setup  
1️⃣ Navigate to the backend directory:  
   ```bash
   cd backend
   ```  
2️⃣ Create and activate a virtual environment (recommended):  
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```  
3️⃣ Install Python dependencies:  
   ```bash
   pip install -r requirements.txt
   ```  
4️⃣ Set up **environment variables**:  
   - Create a `.env` file in the backend directory  
   - Add **necessary API keys and configurations**  

### 🎨 Frontend Setup  
1️⃣ Navigate to the frontend directory:  
   ```bash
   cd frontend
   ```  
2️⃣ Install dependencies:  
   ```bash
   npm install
   # or
   yarn install
   ```  
3️⃣ Set up **environment variables**:  
   - Create a `.env` file in the frontend directory  
   - Add necessary **configuration variables**  

---  

## 🚀 Running the Application  

### 🖥️ Backend  
1️⃣ From the backend directory:  
   ```bash
   python app.py
   ```  
   ✅ The backend server will start on **https://finedge-backend.onrender.com**  

### 🎨 Frontend  
1️⃣ From the frontend directory:  
   ```bash
   npm run dev
   # or
   yarn dev
   ```  
   ✅ The frontend development server will start on **http://localhost:5173**  

---  

## 🔑 Environment Variables  

### ⚙️ Backend (`.env`)  
🔹 **GEMINI_API_KEY**  
🔹 **CLOUDINARY_CLOUD_NAME**  
🔹 **CLOUDINARY_API_KEY**  
🔹 **CLOUDINARY_API_SECRET**  
🔹 **Other service-specific API keys**  

### ⚙️ Frontend (`.env`)  
🔹 **VITE_API_URL**  
🔹 **Other frontend-specific configurations**  

---  

## 📁 Project Structure  

---  

## 🙏 Acknowledgments  

- 🧠 **Google Gemini AI**  
- 🤖 **OpenAI**  
- 🔗 **Other libraries & services used** in the project  

---

## 📜 License

This project is licensed under a modified MIT License with an additional consent requirement. For personal or non-commercial use, you must obtain explicit written consent from the project owner.

See the [LICENSE](./LICENSE) file for details. -->




# 💰 FinEdge 🚀

FinEdge is an AI-driven personal finance management and investment advisory platform designed to help users understand, organize, and optimize their financial lives. In today's complex financial landscape, many individuals struggle to manage their finances effectively due to scattered tools and a lack of personalized guidance. FinEdge aims to bridge this gap by offering a centralized, intelligent, and easy-to-use solution that leverages AI to deliver actionable financial advice tailored to each user's unique profile.

---
</center>
<p align="center"> 
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">
  
<h1 align="center">
  🌐 <a href="https://fin-edge-lac.vercel.app/" target="_blank">LIVE DEMO</a>
</h1>

</center>
<p align="center"> 
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

---

## 🌟 Core Features

FinEdge offers a comprehensive suite of tools to empower you on your financial journey:

### Financial Management & Visualization

* **Unified Dashboard**: An intuitive interface to manage and monitor your income, expenses, assets, and liabilities in one place.
* **Real-Time Tracking**: Visualize your complete financial health with clean, interactive charts and dynamic visualizations powered by Chart.js/Recharts.
* **Goal Tracking**: Set, monitor, and achieve your short-term and long-term financial goals with dedicated tracking tools.

### AI-Powered Intelligence & Analytics

* **Personalized Investment Strategies**: Receive intelligent, data-driven investment recommendations based on your individual risk profile and financial objectives.
* **Intelligent Transaction Categorization**: Let AI automatically categorize your transactions to provide meaningful insights into your spending patterns.
* **AI Query Assistant**: Get instant answers to your questions about stocks, market updates, and financial concepts from an AI-powered chatbot.
* **Live Market Data**: Make informed decisions with real-time integration of stock market data and financial news.

### Education & Security

* **Financial Literacy Hub**: Enhance your financial knowledge with structured educational modules, articles, and video tutorials.
* **Secure Authentication**: Your data is protected with secure login through trusted third-party OAuth providers.
* **Data Protection**: Robust security measures, including the use of environment variables and API key encryption, are implemented to ensure your data is safe.

---

## 🛠️ Tech Stack

### 🎨 Frontend

* **Framework**: React (TypeScript) for a component-driven, scalable UI.
* **Styling**: Tailwind CSS for a clean, modern, utility-first design.
* **Data Visualization**: Chart.js / Recharts for interactive financial charts.
* **Build Tool**: Vite.
* **Code Quality**: ESLint.

### 🖥️ Backend

* **Framework**: Python Flask for API development and business logic.
* **AI & ML**: Google's Gemini AI and other AI APIs for generating financial insights and powering the chatbot.
* **Data Integration**: Third-party APIs for real-time stock, market, and news data.

---

## 🏛️ Backend Architecture

The FinEdge backend is built to be scalable, maintainable, and production-ready, following enterprise-grade best practices.

* **Clean Architecture**: Employs a proper separation of concerns, making the codebase easy to navigate and extend.
* **Flask Application Factory Pattern**: A scalable structure that allows for multiple configurations (e.g., development, testing, production).
* **Unified AI Service**: All AI-driven logic, including investment strategy generation and portfolio analysis, is consolidated into a single, powerful `FinancialAIService`.
* **Centralized Error Handling**: A robust, centralized middleware handles all errors, ensuring consistent and informative responses across the API.
* **RESTful API Design**: Follows clear RESTful design principles with standardized URL patterns and proper input validation.

---

## 📁 Project Structure

The project is organized into a clean and professional directory structure for clear separation of concerns.

```
backend/
├── app.py                 # Flask application factory [cite: 58]
├── config.py              # Configuration management [cite: 58]
├── requirements.txt       # Dependencies [cite: 58]
├── .env.example           # Environment template [cite: 58]
│
├── api/                   # API layer (routes, middleware, validators) [cite: 59]
│   ├── routes/
│   └── middleware/
│
├── core/                  # Core business logic [cite: 59]
│   ├── services/          # Business services (e.g., ai_service.py) [cite: 59]
│   └── models/            # Data models [cite: 59]
│
├── integrations/          # External service integrations [cite: 60]
│   ├── firebase/
│   └── external_apis/
│
├── utils/                 # Utilities (logger, helpers) [cite: 60]
│
├── tests/                 # Test suite (unit, integration) [cite: 61]
│
└── archive/               # Archived legacy files [cite: 61]
```

---

## 🌐 API Endpoints

The backend provides a comprehensive set of API endpoints for AI and data management.

* `/api/ai/investment-strategy`: Generate personalized investment strategies.
* `/api/ai/financial-chat`: Interact with the AI financial advisor chat.
* `/api/ai/portfolio-analysis`: Analyze user portfolios for insights.
* `/api/ai/market-insights`: Get the latest market trends and insights.
* `/api/data/assets`: Perform CRUD operations for user assets.
* `/api/data/financial-summary`: Retrieve a complete financial overview.

---

## 📋 Prerequisites

* Node.js (v16 or higher)
* Python (3.8+)
* npm or yarn
* Required API keys (Gemini, Cloudinary, etc.)

---

## 🔧 Installation

### 🖥️ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Set up environment variables:

* Create a `.env` file in the backend directory.
* Add necessary API keys and configurations as specified in `.env.example`.

---

### 🎨 Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Set up environment variables:

* Create a `.env` file in the frontend directory.
* Add necessary configuration variables.

---

## 🚀 Running the Application

### 🖥️ Backend

From the backend directory:

```bash
python app.py
```

✅ The backend server will start on `https://finedge-backend.onrender.com`

### 🎨 Frontend

From the frontend directory:

```bash
npm run dev
# or
yarn dev
```

✅ The frontend development server will start on `http://localhost:5173`

---

## 🙏 Acknowledgments

* 🧠 Google Gemini AI
* 🤖 OpenAI
* 🔗 Other libraries & services used in the project

---

## 📜 License

This project is licensed under a modified MIT License with an additional consent requirement. For personal or non-commercial use, you must obtain explicit written consent from the project owner.

See the [LICENSE](./LICENSE) file for details.

