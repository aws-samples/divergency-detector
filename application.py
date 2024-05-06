from flask import Flask, request, jsonify, render_template
import boto3
import re
import json
import time
import os

from python_utils import get_text, ask_claude, read_file, clean_text

application = Flask(__name__)
application.static_folder = 'static'

@application.route('/')
def index():
    return render_template('index.html')

@application.route('/process', methods=['POST'])
def process_file():
    file = request.files['file']
    file_name = file.filename

    content = file.read().decode('utf-8')
    cleaned_text = clean_text(content)

    # Replace 'your_knowledge_base_id' with the actual ID or name of your Bedrock Knowledge Base
    knowledge_base_id = 'WKHIYMT04G'

    prompt_template = read_file('main_prompt.txt').replace('{{text}}', cleaned_text)
    answer, _ = ask_claude(prompt_template, knowledge_base_id, kb_query=None, DEBUG=False)

    print("Statements: " + answer + "\n")

    answer_records = json.loads(answer)
    json_records = []
    for answer_record in answer_records:
        deep_record = answer_record['original_statement']
        dive_deep_prompt_template = read_file('dive_deep_prompt.txt').replace('{{text}}', deep_record)
        print("Deep Record: " + deep_record + "\n")
        deep_answer, s3_source_location = ask_claude(dive_deep_prompt_template, knowledge_base_id, deep_record, DEBUG=False)
        print("Deep Answer: " + deep_answer + "\n")
        deep_answer_record = json.loads(deep_answer)

       
        
        source_file_name = s3_source_location.split('/')[-1]
       

        print(source_file_name)

        deep_answer_record['sourceFileName'] = source_file_name
        json_records.append(deep_answer_record)

    print("-" * 80)
    return jsonify(json_records)

if __name__ == '__main__':
    application.run(debug=True) 