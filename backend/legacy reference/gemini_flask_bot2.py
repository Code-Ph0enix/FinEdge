# Legacy Gemini Flask integration
# This file is kept for reference but is no longer used in the current application
# The active Flask implementation is in app.py

# TODO: This file can be safely removed as it's entirely commented out
# and the functionality has been replaced by the newer Flask implementation
  
#   """,
# )

# chat_session = model.start_chat(
#   history=[
#   ]
# )

# def chat_with_gemini(message, media_file_path=None):
#   global chat_session
#   files = []
#   if media_file_path:
#     for media_file in media_file_path:
#       files.append(upload_to_gemini(media_file, mime_type="audio/mpeg"))
  
#     response = chat_session.send_message(message, media_files=files)
#     return response
#   else:
#     response = chat_session.send_message(message)
#     return response.text
  
# if __name__ == "__main__":
#   # Sample test query
#   test_query = "Research that should i invest in IT-companies now?"
#   print("Test Query:", test_query)
#   response = chat_with_gemini(test_query)
#   print("Response:", response)