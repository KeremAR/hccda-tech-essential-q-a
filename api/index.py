import json
import re
import random
from flask import Flask, jsonify, render_template, send_from_directory
import os

# Adjust paths for Vercel's serverless environment
app = Flask(__name__, template_folder='../templates', static_folder='../static')

# Determine the absolute path to the project's root directory
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json_file_path = os.path.join(project_root, 'hccda_questions.json')


def parse_questions():
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    cleaned_questions = []
    
    # This is a very complex regex to handle the messy data structure
    # It tries to find questions that are sometimes embedded in the "answer" field of the previous question.
    question_pattern = re.compile(r'(\d+)\.(.*?)(Answer:\s*(.*?))(?=(\n\n\d+\.|$))', re.DOTALL)
    option_pattern = re.compile(r'([A-Z])\)\s(.*?)(?=\n[A-Z]\)|$)', re.DOTALL)


    for entry in data:
        # First, process the main question in the entry
        process_entry(entry, cleaned_questions, option_pattern)

        # Then, check if the answer field contains more questions
        if isinstance(entry.get('answer'), str):
            # Clean up the embedded questions from the answer field
            answer_text = entry['answer']
            
            # This logic is to prevent the embedded questions from appearing in the explanation
            # We find the first embedded question and cut the explanation there.
            match = re.search(r'\n\n\d+\.', answer_text)
            if match:
                first_question_start = match.start()
                # Split the answer from the explanation, stopping before the next question
                answer_parts = answer_text[:first_question_start].split('Explanation:', 1)
                
                # Find other questions inside the "answer" field
                embedded_questions = re.findall(r'(?:\n\n|^)(\d+)\.(.*?)(?:Answer:\s*(.*?))(?=\n\n\d+\.|\Z)', answer_text, re.DOTALL)
                for q_num, q_text, q_ans in embedded_questions:
                    new_entry = {
                        "number": int(q_num),
                        "question": q_text.strip(),
                        "answer": q_ans.strip()
                    }
                    process_entry(new_entry, cleaned_questions, option_pattern)


    return cleaned_questions

def process_entry(entry, cleaned_questions, option_pattern):
    question_text = entry.get('question', '')
    answer_text = entry.get('answer', '')

    # Skip markers like "Multiple Choices"
    if 'Choices' in question_text or 'QUESTIONS' in question_text:
        return
        
    # Split question from options
    parts = question_text.split('\n\n', 1)
    main_question = parts[0]
    options_str = parts[1] if len(parts) > 1 else ''

    options = []
    # True/False questions
    if not options_str:
        options = ["True", "False"]
    else: # Multiple choice / Single choice
        # Clean options string
        options_list = re.split(r'\n\n', options_str.strip())
        options = [opt.strip() for opt in options_list if opt.strip()]


    # Parse answer and explanation
    answer_parts = answer_text.split('Explanation:', 1)
    answer = answer_parts[0].strip()
    explanation = answer_parts[1].strip() if len(answer_parts) > 1 else None

    # Handle messy answers
    answer = answer.replace('\n\n', ' ').replace('Answer:', '').strip()
    
    # Remove question number from start if it exists
    main_question = re.sub(r'^\d+\.\s*', '', main_question).strip()

    # Avoid duplicates
    if any(q['question'] == main_question for q in cleaned_questions):
        return

    cleaned_question = {
        'question': main_question,
        'options': options,
        'answer': answer,
        'explanation': explanation
    }
    cleaned_questions.append(cleaned_question)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/questions')
def get_questions():
    questions = parse_questions()
    random.shuffle(questions)
    return jsonify(questions)

# No need for the static route, Flask handles it with static_folder
# No need for app.run(), Vercel handles it. 