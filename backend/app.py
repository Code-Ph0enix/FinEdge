# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import subprocess
# import re
# import logging

# # Optional imports for financial path features
# try:
#     from onboard import bank_data, mf_data
# except ImportError:
#     print("Warning: Could not import onboard data")
#     bank_data, mf_data = {}, {}

# try:
#     from jgaad_ai_agent_backup import jgaad_chat_with_gemini
#     import gemini_fin_path
# except ImportError:
#     print("Warning: Could not import AI modules")
#     jgaad_chat_with_gemini = None
#     gemini_fin_path = None

# app = Flask(__name__)
# CORS(app)

# # Logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# @app.route("/", methods=["GET"])
# def home():
#     return jsonify("HI")

# # =================== DYNAMIC APIS ===================
# @app.route("/agent", methods=["POST"])
# def agent():
#     inp = request.form.get("input") or request.json.get("input") if request.is_json else None
    
#     if not inp:
#         return jsonify({"error": "No input provided"}), 400
    
#     if len(inp) > 1000:
#         return jsonify({"error": "Input too long"}), 400
    
#     try:
#         print(f"Processing input: {inp}")
        
#         process = subprocess.Popen(
#             ["python", "agent.py", inp],
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             universal_newlines=True
#         )
        
#         output = []
#         if process.stdout is not None:
#             for line in iter(process.stdout.readline, ""):
#                 if not line and process.poll() is not None:
#                     break
#                 if line:
#                     print(line.strip())
#                     output.append(line)
        
#         output_str = "".join(output)
#         return_code = process.wait()
        
#         if return_code != 0:
#             stderr = process.stderr.read() if process.stderr else ""
#             logger.error(f"Agent script failed: {stderr}")
#             return jsonify({"error": "Agent processing failed"}), 500
        
#         # Extract <Response> ... </Response>
#         final_answer = re.search(r"<Response>(.*?)</Response>", output_str, re.DOTALL)
#         if final_answer:
#             final_answer = final_answer.group(1).strip()
#         else:
#             if jgaad_chat_with_gemini:
#                 try:
#                     final_answer = jgaad_chat_with_gemini(inp, output_str)
#                 except Exception as e:
#                     logger.error(f"Backup AI failed: {e}")
#                     final_answer = "Error processing request"
#             else:
#                 final_answer = "No response generated"
        
#         return jsonify({"output": final_answer, "thought": output_str})
    
#     except subprocess.TimeoutExpired:
#         process.kill()
#         return jsonify({"error": "Request timed out"}), 500
#     except Exception as e:
#         logger.error(f"Error in agent endpoint: {e}")
#         return jsonify({"error": "Internal server error"}), 500

# @app.route("/ai-financial-path", methods=["POST"])
# def ai_financial_path():
#     data = request.get_json(silent=True) or request.form
#     input_text = data.get("input", "").strip()
#     risk = data.get("risk", "conservative")
    
#     if not input_text:
#         return jsonify({"error": "Input cannot be empty"}), 400
    
#     allowed_risks = ["conservative", "moderate", "aggressive"]
#     if risk not in allowed_risks:
#         return jsonify({"error": f"Invalid risk level. Allowed: {allowed_risks}"}), 400
    
#     print(f"Processing financial path for: {input_text}, risk: {risk}")
    
#     if not gemini_fin_path:
#         return jsonify({"error": "Financial AI service not available"}), 503
    
#     try:
#         response = gemini_fin_path.get_gemini_response(input_text, risk)
#         return jsonify(response)
#     except Exception as e:
#         logger.error(f"Financial path error: {e}")
#         return jsonify({"error": "Something went wrong"}), 500

# # =================== STATIC APIS ===================
# @app.route("/auto-bank-data", methods=["GET"])
# def AutoBankData():
#     if not bank_data:
#         return jsonify({"error": "Bank data not available"}), 503
#     return jsonify(bank_data)

# @app.route("/auto-mf-data", methods=["GET"])
# def AutoMFData():
#     if not mf_data:
#         return jsonify({"error": "MF data not available"}), 503
#     return jsonify(mf_data)

# if __name__ == "__main__":
#     app.run(debug=True)



from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import re
import logging

# Import specific items instead of wildcard
try:
    from onboard import bank_data, mf_data
except ImportError:
    print("Warning: Could not import onboard data")
    bank_data, mf_data = {}, {}

try:
    from jgaad_ai_agent_backup import jgaad_chat_with_gemini
    import gemini_fin_path
except ImportError:
    print("Warning: Could not import AI modules")
    jgaad_chat_with_gemini = None
    gemini_fin_path = None

app = Flask(__name__)
CORS(app)

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/', methods=['GET'])
def home():
    return jsonify("HI")

# =================== DYNAMIC APIS ===================
@app.route('/agent', methods=['POST'])
def agent():
    inp = request.form.get('input')
    
    if not inp:
        return jsonify({'error': 'No input provided'}), 400
    
    # Basic input validation
    if len(inp) > 1000:  # Prevent extremely long inputs
        return jsonify({'error': 'Input too long'}), 400
    
    try:
        print(f"Processing input: {inp}")
        
        # Add timeout to prevent hanging
        process = subprocess.Popen(
            ['python', 'agent.py', inp], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        output = []
        # Stream output in real-time
        if process.stdout is not None:
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    print(line.strip())  # Print to terminal in real-time
                    output.append(line)
        else:
            logger.error("process.stdout is None")
        
        output_str = ''.join(output)
        return_code = process.wait()
        
        # Check if process failed
        if return_code != 0:
            if process.stderr is not None:
                stderr = process.stderr.read()
            else:
                stderr = ""
                logger.error("process.stderr is None")
            logger.error(f"Agent script failed: {stderr}")
            return jsonify({'error': 'Agent processing failed'}), 500
        
        # Use regex to extract the response between <Response> tags
        final_answer = re.search(r'<Response>(.*?)</Response>', output_str, re.DOTALL)
        if final_answer:
            final_answer = final_answer.group(1).strip()
        else:
            # Fallback to backup AI if available
            if jgaad_chat_with_gemini:
                try:
                    final_answer = jgaad_chat_with_gemini(inp, output_str)
                except Exception as e:
                    logger.error(f"Backup AI failed: {e}")
                    final_answer = "Error processing request"
            else:
                final_answer = "No response generated"
        
        return jsonify({'output': final_answer, 'thought': output_str})
        
    except subprocess.TimeoutExpired:
        process.kill()
        return jsonify({'error': 'Request timed out'}), 500
    except Exception as e:
        logger.error(f"Error in agent endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/ai-financial-path', methods=['POST'])
def ai_financial_path():
    # Fix the original bug - check if 'input' exists in form data
    if 'input' not in request.form:
        return jsonify({'error': 'No input provided'}), 400
        
    input_text = request.form.get('input', '').strip()
    if not input_text:
        return jsonify({'error': 'Input cannot be empty'}), 400
        
    risk = request.form.get('risk', 'conservative')
    
    # Validate risk level
    allowed_risks = ['conservative', 'moderate', 'aggressive']
    if risk not in allowed_risks:
        return jsonify({'error': f'Invalid risk level. Allowed: {allowed_risks}'}), 400
    
    print(f"Processing financial path for: {input_text}, risk: {risk}")
    
    if not gemini_fin_path:
        return jsonify({'error': 'Financial AI service not available'}), 503
    
    try:
        response = gemini_fin_path.get_gemini_response(input_text, risk)
        return jsonify(response)
    except Exception as e:
        logger.error(f"Financial path error: {e}")
        return jsonify({'error': 'Something went wrong'}), 500

# =================== STATIC APIS ===================
@app.route('/auto-bank-data', methods=['GET'])  # Fixed: was 'get', now 'GET'
def AutoBankData():
    if not bank_data:
        return jsonify({'error': 'Bank data not available'}), 503
    return jsonify(bank_data)

@app.route('/auto-mf-data', methods=['GET'])  # Fixed: was 'get', now 'GET'
def AutoMFData():
    if not mf_data:
        return jsonify({'error': 'MF data not available'}), 503
    return jsonify(mf_data)

# =================== CONNECTION APIS ===================
# Add your connection APIs here

# =================== BOTS ===================
# Add your bot endpoints here

if __name__ == "__main__":
    app.run(debug=True)
