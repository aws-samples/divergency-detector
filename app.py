from flask import Flask, request, jsonify, render_template
import boto3
import re
import json
import time
import os

# Import the necessary functions from the original code
from classify_statements import get_text, ask_claude, read_file, clean_text

app = Flask(__name__)
app.static_folder = 'static'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_file():
    file = request.files['file']
    file_name = file.filename

    content = file.read().decode('utf-8')
    cleaned_text = clean_text(content)


    prompt_template = read_file('main_prompt.txt').replace('{{text}}', cleaned_text)
    answer = ask_claude(prompt_template, DEBUG=False)

    answer_records = json.loads(answer)
    json_records = []
    for answer_record in answer_records:
        if answer_record['truth_value'] == 'false':
            dive_deep_prompt_template = read_file('dive_deep_prompt.txt').replace('{{text}}', answer_record['original_statement'])
            deep_answer = ask_claude(dive_deep_prompt_template, DEBUG=False)
            deep_answer_record = json.loads(deep_answer)
            if deep_answer_record['classification'].lower() == 'false':
                json_records.append(deep_answer_record)
    print("-" * 80)
    return jsonify(json_records)

if __name__ == '__main__':
    app.run(debug=True)