### Passo a passo do processo:

- Clonar o repositório.
- Dar o duplo clique no arquivo .html dentro da pasta clonada, ou abrir pelo Visual Studio Code com o Go Live.
- Escolher o tipo de processo, tempos de execução e se faz ou não I/O Bound e utilizar o botão de Adicionar.
- Utilizar o botão de Iniciar após cadastrar todos os processos que precisar.

### Sobre os escalonadores:

- I/O Bound, os escalonadores foram implementados com I/O Bound, ou seja, se estiver ocorrendo a execução e algum processo finalizar o tempo de I/O, irá tomar a frente do processo em execução e executar o tempo que ficou esperando.

- Round Robin: É um escalonador circular, irá executar os processos em sequência.

- FIFO É um escalonador que irá executar o processo até o final, finalizando, executa o próximo.

- SJF: É um escalonador que irá começar a executar os processos com menor tempo de execução primeiro, finalizando, executa o próximo com menor tempo.

- Tempo Real: É um escalonador que irá começar a executar os processos com maior prioridade primeiro, até o final, finalizando, executa o próximo com maior prioridade.

- Prioridade: É um escalonador que irá começar a executar os processos com maior prioridade primeiro, se possuir processos com a mesma prioridade, executa de forma paralela os dois, é um escalonador que necessita de alguma métrica de escalonamento, por isso, foi criado métricas para ele: | Muito baixa - 1 execução | Baixa - 2 execuções | Médio - 3 execuções | Alto - 4 execuções | Muito alto - 5 execuções.


- Obs: O processo de I/O Bound não foi implementado no escalonador de prioridade, somente nos outros.

#### Bruno Henrique Wiedemann Reis, Guilherme Weingaertner, Lucas Miguel Vieira
