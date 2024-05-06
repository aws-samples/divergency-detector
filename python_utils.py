import boto3
import re
import sys
import json
import time
import os
import traceback

def get_text(response_body):
    for content in response_body.get("content"):
        if 'text' in content:
            return content['text']
    return ""

def ask_claude(prompt_text, knowledge_base_id, kb_query, DEBUG=False):
    MAX_ATTEMPTS = 5
    if not "Assistant:" in prompt_text:
        prompt_text = "\n\nHuman:" + prompt_text + "\n\Assistant: "
    s3_source_location = ''
    if kb_query:
        # Create the Bedrock Knowledge Base client
        bedrock_client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

        # Query the Bedrock Knowledge Base with the prompt text
        knowledge_base_retrieve = bedrock_client.retrieve(
            knowledgeBaseId=knowledge_base_id,
            retrievalQuery={
                'text': kb_query
            }
        )
        knowledge_base_info = knowledge_base_retrieve['retrievalResults'][0]['content']['text']
        s3_source_location = knowledge_base_retrieve['retrievalResults'][0]['location']['s3Location']['uri']
        print("-" * 80)

        prompt_text = prompt_text.replace('{{knowledge_base_info}}', knowledge_base_info)

    data = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 3000,
        "messages": [
            {
                "content": [
                    {
                        "text": prompt_text,
                        "type": "text"
                    }
                ],
                "role": "user"
            }
        ],
        "temperature": 0,
        "stop_sequences": ["\nAssistant:"]
    }
    json_data = json.dumps(data, indent=4)

    modelId = "anthropic.claude-3-sonnet-20240229-v1:0"
    #modelId = "anthropic.claude-3-haiku-20240307-v1:0"
    accept = "application/json"
    contentType = "application/json"

    bedrock_runtime_client = boto3.client("bedrock-runtime", region_name='us-east-1')

    start_time = time.time()
    attempt = 1
    while True:
        try:
            query_start_time = time.time()
            response = bedrock_runtime_client.invoke_model(
                        body=json_data,
                        modelId=modelId,
                        accept=accept,
                        contentType=contentType)

            response_body = json.loads(response.get("body").read())
            results = get_text(response_body).lower().strip()
            request_time = round(time.time()-start_time,2)
            if DEBUG:
                print("Recieved:",results)
                print("request time (sec):",request_time)
            break
        except Exception as e:
            print("Error with calling Bedrock: "+str(e))
            if attempt>MAX_ATTEMPTS:
                print("Max attempts reached!")
                results = str(e)
                request_time = -1
                break
            else:#retry in 10 seconds
                time.sleep(10)
    
    return results, s3_source_location

def read_file(file_name):
    file = open(file_name, "r")
    content = file.read()
    file.close()
    return content

def clean_text(text):
    replacement_text = ""
    output = text

    pattern = "[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?,[0-9]{3}"
    output = re.sub(pattern, replacement_text, text)

    pattern = "-->"
    output = re.sub(pattern, replacement_text, output)

    pattern = "[0-9]{3}\n"
    output = re.sub(pattern, replacement_text, output)

    pattern = "[0-9]{2}\n"
    output = re.sub(pattern, replacement_text, output)

    pattern = "[0-9]{1}\n"
    output = re.sub(pattern, replacement_text, output)

    pattern = "\n"
    output = re.sub(pattern, replacement_text, output)

    output = output.replace('. ' ,'.\n')

    return output
def main(video_script_file_name, output_folder_name):
    video_script = read_file(video_script_file_name)
    cleaned_video_script = clean_text(video_script)
    print(cleaned_video_script)
    base_name = os.path.basename(video_script_file_name)
    
    prompt_template = read_file('main_prompt.txt').replace('{{text}}', cleaned_video_script)
    answer = ask_claude(prompt_template, DEBUG=False)
    
    answer_records = json.loads(answer)
    #print(answer_records)
    json_records = json.loads('[]')
    for answer_record in answer_records:
        dive_deep_prompt_template = read_file('dive_deep_prompt.txt').replace('{{text}}', answer_record['original_statement'])
        print('evaluating statement ' + str(answer_record['original_statement']))
        print(answer_record)
        answer = ask_claude(dive_deep_prompt_template, DEBUG=False)
        print(answer)
        deep_answer_record = json.loads(answer)
        if deep_answer_record['classification'].lower() == 'false':
            print(deep_answer_record)
            json_records.append(deep_answer_record)
     
    if (len(json_records)>0):     
        json_file_name = output_folder_name + '/' + base_name + ".json"
        json_records_string = json.dumps(json_records, indent=2)
        with open(json_file_name, "w") as write_file:
            print(json_records_string)
            print('writing file ' + json_file_name)
            write_file.write(json_records_string)
        
if __name__ == "__main__":
    if len(sys.argv) > 2:
        
        video_path = sys.argv[1]
        output_folder_name = sys.argv[2]
        
        if os.path.isdir(video_path):
            file_list = os.listdir(video_path)
            for video_script_file_name in file_list:
                try:
                    file_name = video_path + '/' + video_script_file_name
                    print('Loading file ' + file_name)
                    main(file_name, output_folder_name)
                except Exception:
                    traceback.print_exc()
                
        else:
            print('Loading file ' + video_path)
            main(video_path, output_folder_name)
        
    else:
        print('use: python classify_statements.py sft_full output')