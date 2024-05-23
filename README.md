# O Editor-Chefe

O Editor-Chefe is a web application that processes text files and provides insights using natural language processing. It leverages the power of models available in Amazon Bedrock to analyze statements against an Amazon Bedrock Knowledge Base.

## Prerequisites

- Flask
- Boto3 (AWS SDK for Python)

## Usage

1. Clone the repository or download the source code.
2. Install the required dependencies by running `pip install -r requirements.txt`.
3. Set up the necessary AWS credentials and configurations.
4. Run the Flask application by executing `python3 application.py`.
5. Open your web browser and navigate to `http://localhost:5000`.
6. Upload a text file.
7. The application will analyze the file and display the processed statements.


Note: Make sure to replace `'your_knowledge_base_id'` in `application.py` with the appropriate value for the Amazon Bedrock Knowledge Base ID containing the desired files.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.