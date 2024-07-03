# Detector de Divergências

É intuitivo pensar em geração e sumarização de textos ao se falar de Generative AI. 
Esse repositório traz outros dois casos de uso para essa tecnologia: **interpretação de texto** e **interpretação de imagem**.

Vamos supor que você precise escrever um material: a página inicial do site da sua empresa, um documento oficial ou um projeto de pesquisa. 

Após escrito, é necessário validar se o conteúdo desse material está acurado, ou seja, se não há nada desatualizado ou inconsistente. 

**Sem Generative AI**, seria necessário muito estudo e leitura, e até consulta a especialistas, para ter certeza de que o conteúdo não estará impreciso. 

**Com Generative AI**, essa análise pode ser feita pelo próprio modelo. Você pode inclusive enriquecer o modelo com suas próprias documentações já vigentes, e pedir para a IA generativa analisá-lo em busca de inconsistências.

Nesse workshop, o modelo utilizado foi o [Anthropic Claude 3](https://aws.amazon.com/pt/bedrock/claude/) Sonnet, disponibilizado pela solução da AWS chamada de [Amazon Bedrock](https://aws.amazon.com/pt/bedrock).

Na página do IBGE é possível baixar vários datasets e gráficos. O PDF que traz o Panorama do Censo 2022 foi o artefato usado para enriquecer o modelo via [knowledge bases](https://aws.amazon.com/pt/bedrock/knowledge-bases/). Esse PDF faz um resumo dos dados mais relevantes pesquisados durante o CENSO-2022.


## Vamos analisar o PDF


O PDF usado para enriquecer o modelo via knowledge bases faz um resumo dos dados mais relevantes pesquisados durante o CENSO-2022.

Ele pode ser encontrado em [/files/Panorama-do-Censo-2022.pdf](https://github.com/aws-samples/divergency-detector/files/Panorama-do-Censo-2022.pdf)

Observe que esse PDF mostra dados essencialmente por imagens e gráficos. Dados sobre crescimento populacional histórico, densidade demográfica, pirâmide etária, entre outros. 


[![Video de exploracao do PDF](https://github.com/aws-samples/divergency-detector/files/pdf-censo.png)](https://github.com/aws-samples/divergency-detector/recordings/demo-explanation.mov "CENSO")


## Testando a solução

Para testar o modelo, recomenda-se o uso de um texto sobre dados do Brasil cheio de fatos incorretos.

Uma sugestão é o arquivo [/files/texto-incorreto.txt](https://github.com/aws-samples/divergency-detector/files/texto-incorreto.txt)


## Acessando a solução


Agora vamos acessar a solução. Ela foi carinhosamente chamada de O Editor Chefe. Ela fará uma análise de veracidade das informações do texto.

    Obs.: a implantação da solução será descrita abaixo 

Para usar a solução, faça o upload do [/files/texto-incorreto.txt](https://github.com/aws-samples/divergency-detector/files/texto-incorreto.txt). 

Após alguns segundos, será mostrada uma lista de divergências encontradas no texto. 

Vamos analisar algumas:
1) Sobre o tamanho da população, ele nos informa que a população correta do Brasil é de 203.080.756 pessoas, divergindo do valor do texto. Vamos voltar ao PDF para ver se o Editor Chefe está correto
2) Sobre o crescimento populacional, ele indica que o maior crescimento populacional fori entre 1940 e 1991, divergindo também do texto. Vamos voltar ao PDF para ver se o Editor Chefe está correto.
3) Sobre a região com maior densidade demográfica, ele aponta a região sudeste, com estados como são paulo e rio de janeiro na faixa mais escura, indicando mais de 20 milhões de habitantes. A região sul não é a com maior densidade demográfica. Vamos voltar ao PDF para ver se o Editor Chefe está correto.
   
Observe que o modelo fez uma análise das imagens de um PDF para poder dar estas respostas.

Um vídeo de como a solução deveria funcionar está aqui [recordings/demo-editor-chefe.mp4](https://github.com/aws-samples/divergency-detector/recordings/demo-editor-chefe.mp4)


# Como implantar a solução

## Pré-requisitos

- Flask
- Boto3 (AWS SDK for Python)

## Amazon Bedrock - como configurar? 

1) Criar um datasource com os arquivos abaixo:

a) https://github.com/aws-samples/divergency-detector/files/pdf-censo.png

b) https://github.com/aws-samples/divergency-detector/files/

c) https://github.com/aws-samples/divergency-detector/files/

d) https://github.com/aws-samples/divergency-detector/files/

Observe que estão sendo providenciados 3 TXTs. Eles foram gerados a partir de um pipeline de Bedrock. Esse pipeline fez a análise do PDF utilizando-se o prompt **multimodal** do Anthropic Claude, que gera sumários de imagens.
Para mais informações, consulte [esse link](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html#model-parameters-anthropic-claude-messages-multimodal-prompts.title)

2) Após a criação do datasource, será necessário criar o knowlege bases

    . Configure o "number of retrieved results" do knowledge bases para 20


## Implantação

1. Clone the repository or download the source code.
2. Install the required dependencies by running `pip install -r requirements.txt`.
3. Set up the necessary AWS credentials and configurations.
4. Run the Flask application by executing `python3 application.py`.
5. Open your web browser and navigate to `http://localhost:5000`.
6. Upload a text file.
7. The application will analyze the file and display the processed statements.


Note: Make sure to replace `'your_knowledge_base_id'` in `application.py` with the appropriate value for the Amazon Bedrock Knowledge Base ID containing the desired PDF file.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.