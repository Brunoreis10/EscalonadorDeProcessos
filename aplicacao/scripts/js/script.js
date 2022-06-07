'use strict';

let id = 1;
let inicioTempoProcesso;
let tempoInicial;
let tempoFinal;
let processosParaExecutar = [];
let processosParaCalcular = [];
let processosFinalizados = [];
let grafico = [];
let intervaloDeTempo;
let mensagens = {
	error: {
		vlValidoTempoExecucao: 'Insira um valor válido ao Tempo de Execução',
		vlValidoIntervaloTempo: 'Insira um valor válido ao Intervalo de Tempo',
		vlValidaGrafico: 'Execute uma operação para montar o gráfico!',
		vlValidoFilasAdicionadas: 'Adicione Processos a fila!'

	},
	alert: {
		executandoProcessos: 'Iniciando o escalonamento dos Processos',
		reiniciarEscalonador: 'Escalonador reiniciado!',
		graficoMontadoSucesso: 'Gráfico montado com sucesso!',
		iniciandoExecucaoDosProcessos: 'Iniciando execução dos Processos'
	},
	color: {
		sucesso: '-textsuccess',
		erro: '-texterror',
		aviso: '-textwarnning'
	}
}
let contadorMuitoAlta = 0;
let contadorAlta = 0;
let contadorMedia = 0;
let contadorBaixa = 0;
let contadorMuitoBaixa = 0;

//Ao executar o sistema, limpar tudo
$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
	limparEscalonador();
});

//Funções que imitam construtores de classes
function ProcessoEstrutura(idProcesso, totalClocks, prioridade) {
	this.idProcesso = idProcesso;
	this.totalClocks = totalClocks;
	this.executado = false;
	this.prioridade = prioridade;
}

//Funções que imitam construtores de classes
function TempoExecucao(idProcesso, tempoInicial, tempoFinal) {
	this.idProcesso = idProcesso;
	this.tempoInicial = tempoInicial;
	this.tempoFinal = tempoFinal;
}

function validarCampoNumerico(numero) {
	const regex = new RegExp(/^[0-9]{1,}$/);
	return (regex.test(numero));
}

//Criar fila de processos, validando os campos em tela e adicionaondo nos vetores para serem adicionados em tela.
function criarFila() {
	let tempoExecucao = $('#schTimeExecution').val();
	let prioridadeSelecionada = $('.prioritySelect').val();
	let intervaloDeTempo = $('#timeSlice').val();


	let exprRegularTempoExecucao = validarCampoNumerico(tempoExecucao);
	let exprRegularIntervaloTempo = validarCampoNumerico(intervaloDeTempo);


	if ((tempoExecucao === null) || (tempoExecucao === "") || (!exprRegularTempoExecucao) || (!exprRegularIntervaloTempo)) {
		executaMensagemTela(mensagens.error.vlValidoTempoExecucao, mensagens.color.erro);
		return;
	}

	let novoProcesso = new ProcessoEstrutura(id, tempoExecucao, prioridadeSelecionada);
	processosParaExecutar.push(novoProcesso);
	processosParaCalcular.push(novoProcesso);
	id++;

	let imagem = getImagem();

	$('.table-logs').append(`
		<div id="divImages" style="display:flex; flex-direction:row; margin-bottom:10px; justify-content:center; align-items:center">
		<img src=" ` + imagem + `" id="image" style="margin-right:10px" width=25 height=25>
			<li class="-itemjob">
				Processo <span class="-numberjob">${novoProcesso.idProcesso}</span> adicionado a fila
				<i class="fas fa-minus -minusarrowicon"></i>
				Total de execução: <span class="-numbersecondjob">${novoProcesso.totalClocks}</span> Hz
			</li>
		</div>
	`);
	setScrollNaUltimaAdicionando();
}

function getImage() {
	//Sortear número de 0 a 6 para com base neles, jogar em tela o processo com seu ícone aleatório.
	let random = getRandom(6);

	if (random == 0) {
		return "aplicacao/images/iconExcel.png";
	} else if (random == 1) {
		return "aplicacao/images/iconOneNote.png";
	} else if (random == 2) {
		return "aplicacao/images/iconPowerPoint.png";
	} else if (random == 3) {
		return "aplicacao/images/iconWord.png";
	} else if (random == 4) {
		return "aplicacao/images/iconSteam.png";
	} else if (random == 5) {
		return "aplicacao/images/iconDiscord.png";
	}
}

//Validar o tipo do processo cadastrado, validar o seu tipo de escalonador (prioridade, Robin Round) e chamar a rotina com base nessa característica.
function iniciarProcessos() {
	if ((processosParaExecutar.length <= 0) || (processosParaExecutar == null)) {
		executaMensagemTela(mensagens.error.vlValidoFilasAdicionadas, mensagens.color.erro);
		return;
	}

	intervaloDeTempo = $('#timeSlice').val();
	if ((intervaloDeTempo === null) || (intervaloDeTempo === "")) {
		executaMensagemTela(mensagens.error.vlValidoIntervaloTempo, mensagens.color.erro);
		return;
	}

	desativarFormulario('disable');
	grafico = [];
	let tipoProcesso = $('.typeOfProcess').val();

	executaMensagemTela(mensagens.alert.executandoProcessos, mensagens.color.sucesso);
	$('.table-process-running').append(`<li class="-itemjob"><p>Tipo de Escalonamento escolhido: <span class="-numbersecondjob">${tipoProcesso}</span></p></li>`);

	if (tipoProcesso === "RRS") {
		processoRoundRobin();
	} else if (tipoProcesso === "PRIORIDADE") {
		processosParaExecutar.sort(compararPrioridade);
		processoPrioridade();
	} else if (tipoProcesso === "FIFO") {
		processoFIFO();
	} else if (tipoProcesso === "TEMPOREAL") {
		processosParaExecutar.sort(compararPrioridade);
		processoTempoReal();
	} else if (tipoProcesso === "SJF") {
		processosParaExecutar.sort(compararTempo);
		processoSJF();
	}
}

function processoRoundRobin() {
	tempoInicial = new Date().getTime();
	processoRoundRobinParteDois(0);
}

function processoRoundRobinParteDois(index) {
	//Verifica se têm jobs em execução, caso tenha, continua.
	if (!verificaProcessos()) {
		return index;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].totalClocks <= 0) {
		processoRoundRobinParteDois(index + 1);
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		processosParaExecutar.shift();
		processoRoundRobinParteDois(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			processoRoundRobinParteDois(index + 1);
			return index;
		}
		processoRoundRobinParteDois(index + 1);
	}, 1000);
}

function verificaProcessos() {
	for (var i = 0; i < processosParaExecutar.length; i++) {
		if (processosParaExecutar[i].totalClocks >= 0) {
			return true;
		}
	}
	return false;
}

function processoFIFO() {
	tempoInicial = new Date().getTime();
	processoFIFOParteDois(0);
}

function processoFIFOParteDois(index) {
	if (index >= processosParaExecutar.length) {
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoFIFOParteDois(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			index++;
		}
		processoFIFOParteDois(index);
	}, 1000);
}

function processoTempoReal() {
	tempoInicial = new Date().getTime();
	processoTempoRealParte2(0);
}

function processoTempoRealParte2(index) {
	if (index >= processosParaExecutar.length) {
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoTempoRealParte2(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			index++;
		}
		processoTempoRealParte2(index);
	}, 1000);
}

function processoSJF() {
	tempoInicial = new Date().getTime();
	processoSJFParte2(0);
}

function processoSJFParte2(index) {
	if (index >= processosParaExecutar.length) {
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoSJFParte2(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			index++;
		}
		processoSJFParte2(index);
	}, 1000);
}

function processoPrioridade() {
	tempoInicial = new Date().getTime();
	processoPrioridadeParte2(0);
}

function processoPrioridadeParte2(index) {

	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoPrioridadeParte2(index + 1);
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoPrioridadeParte2(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		if (processosParaExecutar[index].prioridade == "5") {
			if (contadorMuitoAlta == 5) {
				contadorMuitoAlta = 0;
				index++;

				return processoPrioridadeParte2(index);
			}
			contadorMuitoAlta++;
		} else if (processosParaExecutar[index].prioridade == "4") {
			if (contadorAlta == 4) {
				contadorAlta = 0;
				index++;

				return processoPrioridadeParte2(index);
			}
			contadorAlta++;
		} else if (processosParaExecutar[index].prioridade == "3") {
			if (contadorMedia == 3) {
				contadorMedia = 0;
				index++;

				return processoPrioridadeParte2(index);
			}
			contadorMedia++;
		} else if (processosParaExecutar[index].prioridade == "2") {
			if (contadorBaixa == 2) {
				contadorBaixa = 0;
				index++;

				return processoPrioridadeParte2(index);
			}
			contadorBaixa++;
		} else if (processosParaExecutar[index].prioridade == "1") {
			if (contadorMuitoBaixa == 1) {
				contadorMuitoBaixa = 0;
				index++;

				return processoPrioridadeParte2(index);
			}
			contadorMuitoBaixa++;
		}
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			processosParaExecutar[index].executado = true;
			processosFinalizados.push(index);
			index++;
		}
		processoPrioridadeParte2(index);
	}, 1000);
}

function criarGrafico() {
	if ((grafico.length <= 0) || (grafico == null)) {
		executaMensagemTela(mensagens.error.vlValidaGrafico, mensagens.color.erro);
		return;
	}

	calculo();

	google.charts.load("current", { packages: ["timeline"] });
	google.charts.setOnLoadCallback(desenharGrafico);
	$('#createChart').prop('disabled', true);
	$('#sectionGraphic').show();
	$('#sectionCalculo').show();
	executaMensagemTela(mensagens.alert.graficoMontadoSucesso, mensagens.color.sucesso);
}

function compararPrioridade(processoA, processoB) {
	if (processoA.prioridade < processoB.prioridade)
		return 1;
	if (processoA.prioridade > processoB.prioridade)
		return -1;
	return 0;
}

function compararTempo(processoA, processoB) {
	if (processoA.totalClocks < processoB.totalClocks)
		return -1;
	if (processoA.totalClocks > processoB.totalClocks)
		return 1;
	return 0;
}

//Desenha o gráfico em tela conforme os valores.
function desenharGrafico() {
	let container = document.getElementById('chartTime');
	let chart = new google.visualization.Timeline(container);
	let dataTable = new google.visualization.DataTable();
	dataTable.addColumn({ type: 'string', id: 'Job' });
	dataTable.addColumn({ type: 'date', id: 'Start' });
	dataTable.addColumn({ type: 'date', id: 'End' });

	for (let i = 0; i < grafico.length; i++) {
		dataTable.addRow(
			[
				'Processo ' + grafico[i].idProcesso,
				new Date(0, 0, 0, 0, 0, grafico[i].tempoInicial),
				new Date(0, 0, 0, 0, 0, grafico[i].tempoFinal)
			]
		);
	}

	let options = {
		timeline: { singleColor: '#007bff' },
	};

	chart.draw(dataTable, options);
}

//Mostra mensagens padrão em tela.
function executaMensagemTela(msg, txtColor = null) {
	$('#toast-place').append(`
		<div role="alert" aria-live="assertive" aria-atomic="true" data-autohide="true" class="toast" data-delay="2000">
			<div class="toast-body ${txtColor}">
				<span class="-toastmsg">${msg}</span>
				<button type="button" class="close" data-dismiss="toast" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
		</div>
	`);

	$('.toast').toast('show');
	$('.toast').on('hidden.bs.toast', e => {
		$(e.currentTarget).remove();
	});
}

//Calcula o tempo de cada processo.
function calculo() {
	for (let a = 0; a < processosParaCalcular.length; a++) {
		$('#calculo table tbody').empty();
		processosParaCalcular[a].ultimoTempo = 0;
		processosParaCalcular[a].tempoTotal = 0;
		processosParaCalcular[a].tempoEspera = 0;
		for (let i = 0; i < grafico.length; i++) {
			if (processosParaCalcular[a].idProcesso == grafico[i].idProcesso) {
				processosParaCalcular[a].tempoTotal = Math.round(processosParaCalcular[a].tempoTotal + (grafico[i].tempoFinal - grafico[i].tempoInicial));
				processosParaCalcular[a].tempoEspera = Math.round(processosParaCalcular[a].tempoEspera + (grafico[i].tempoInicial - processosParaCalcular[a].ultimoTempo));
				processosParaCalcular[a].ultimoTempo = grafico[i].tempoFinal;
			}
		}
	}

	desenharCalculoEmTela();
	processosParaCalcular = [];
}

//Desenha os valores de tempo em tela em uma tabela para verificação.
function desenharCalculoEmTela() {
	for (let a = 0; a < processosParaCalcular.length; a++) {
		$('#calculo table tbody').append(`
		<tr>
			<td>Processo ${processosParaCalcular[a].idProcesso}</td>
			<td>${processosParaCalcular[a].tempoTotal}s</td>
			<td>${processosParaCalcular[a].tempoEspera}s</td>
		</tr>`);
	}
}

//Limpa o escalonador e as tabelas.
function limparEscalonador() {
	$('#cleanScheduler').on('click', function () {
		id = 1;
		inicioTempoProcesso;
		processosParaExecutar = [];
		processosParaCalcular = [];
		processosFinalizados = [];
		grafico = [];
		contadorMuitoAlta = 0;
		contadorAlta = 0;
		contadorMedia = 0;
		contadorBaixa = 0;
		contadorMuitoBaixa = 0;
		$('.table-logs').html("");
		$('.table-process-running').html("");
		$('#schTimeExecution').val("");
		$('#timeSlice').val("");
		$('#sectionGraphic').hide();
		$('#sectionCalculo').hide();
		$('#chartTime').html("");
		$('#tbodyScheduler').html("");
		desativarFormulario('enable');
		executaMensagemTela(mensagens.alert.reiniciarEscalonador, mensagens.color.sucesso);
	});
}

//Desativa o formulário para evitar que o usuário insira algo em execução.
function desativarFormulario(item) {
	switch (item) {
		case 'disable':
			$('#schTimeExecution').prop('disabled', true);
			$('#timeSlice').prop('disabled', true);
			$('#createQueue').prop('disabled', true);
			$('#prioritySelect').prop('disabled', true);
			$('#typeOfProcess').prop('disabled', true);
			$('#startJobs').prop('disabled', true);
			break;
		case 'enable':
			$('#schTimeExecution').prop('disabled', false);
			$('#timeSlice').prop('disabled', false);
			$('#createQueue').prop('disabled', false);
			$('#prioritySelect').prop('disabled', false);
			$('#typeOfProcess').prop('disabled', false);
			$('#startJobs').prop('disabled', false);
			$('#createChart').prop('disabled', false);
			break;
	}
}

function getRandom(max) {
	return Math.floor(Math.random() * max)
}

function getImagem() {
	//Sortear número de 0 a 6 para com base neles, jogar em tela o processo com seu ícone aleatório.
	let random = getRandom(6);

	if (random == 0) {
		return "aplicacao/images/iconExcel.png";
	} else if (random == 1) {
		return "aplicacao/images/iconOneNote.png";
	} else if (random == 2) {
		return "aplicacao/images/iconPowerPoint.png";
	} else if (random == 3) {
		return "aplicacao/images/iconWord.png";
	} else if (random == 4) {
		return "aplicacao/images/iconSteam.png";
	} else if (random == 5) {
		return "aplicacao/images/iconDiscord.png";
	}
}

//Joga o scroll para baixo, para o usuário não precisar abaixar.
function setScrollNaUltimaLinhaRodando() {
	const objScrDiv = document.getElementById('proc-running');
	objScrDiv.scrollTop = objScrDiv.scrollHeight;
}

function setScrollNaUltimaAdicionando() {
	const objScrDiv = document.getElementById('proc-exec');
	objScrDiv.scrollTop = objScrDiv.scrollHeight;
}