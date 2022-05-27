'use strict';

let id = 1;
let inicioTempoProcesso;
let tempoInicial;
let tempoFinal;
let agora;
let processosParaExecutar = [];
let processosParaCalcular = [];
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

//Ao executar o sistema, limpar tudo
$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
	limparEscalonador();
});

//Funções que imitam construtores de classes
function ProcessoEstrutura(jobId, totalClocks, priority) {
	this.jobId = jobId;
	this.totalClocks = totalClocks;
	this.executed = false;
	this.priority = priority;
}

//Funções que imitam construtores de classes
function TempoExecucao(jobId, startTime, finishTime) {
	this.jobId = jobId;
	this.startTime = startTime;
	this.finishTime = finishTime;
}

function validarCampoNumerico(numero) {
	const regex = new RegExp(/^[0-9]{1,}$/);
	return (regex.test(numero));
}

//Criar fila de processos, validando os campos em tela e adicionaondo nos vetores para serem adicionados em tela.
function criarFila() {
	let tempoExecucao = $('#schTimeExecution').val();
	let prioridadeSelecionada = $('.prioritySelect').val();
	let intervaloDeTempoInt = $('#timeSlice').val();


	let exprRegularIntTempoExecucao = validarCampoNumerico(tempoExecucao);
	let exprRegularIntIntervaloTempo = validarCampoNumerico(intervaloDeTempoInt);


	if ((tempoExecucao === null) || (tempoExecucao === "") || (!exprRegularIntTempoExecucao) || (!exprRegularIntIntervaloTempo)) {
		executaMensagemTela(mensagens.error.vlValidoTempoExecucao, mensagens.color.erro);
		return;
	}

	let newJob = new ProcessoEstrutura(id, tempoExecucao, prioridadeSelecionada);
	processosParaExecutar.push(newJob);
	processosParaCalcular.push(newJob);
	id++;

	let image = getImage();

	$('.table-logs').append(`
		<div id="divImages" style="display:flex; flex-direction:row; margin-bottom:10px; justify-content:center; align-items:center">
		<img src=" ` + image + `" id="image" style="margin-right:10px" width=25 height=25>
			<li class="-itemjob">
				Processo <span class="-numberjob">${newJob.jobId}</span> adicionado a fila
				<i class="fas fa-minus -minusarrowicon"></i>
				Total de execução: <span class="-numbersecondjob">${newJob.totalClocks}</span> Hz
			</li>
		</div>
	`);
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
	$('.table-logs').append(`<li class="-itemjob"><p>Tipo de Escalonamento escolhido: <span class="-numbersecondjob">${tipoProcesso}</span></p></li>`);

	if (tipoProcesso === "RRS") {
		processoPreemptivo();
	} else if (tipoProcesso === "PRIORIDADE") {
		processosParaExecutar.sort(compararPrioridade);
		processoRoundRobin();
	} else if (tipoProcesso === "FIFO") {
		processoRoundRobin();
	}
}

function processoPreemptivo() {
	tempoInicial = new Date().getTime();
	executarPreemptivo(0);
}

function executarPreemptivo(index) {
	//Verifica se têm jobs em execução, caso tenha, continua.
	if (!verifyJobs()) {
		return index;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].totalClocks <= 0) {
		executarPreemptivo(index + 1);
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o processo ${processosParaExecutar[index].jobId} por ser muito grande`, mensagens.color.erro);
		processosParaExecutar.shift();
		executarPreemptivo(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setIndexByRunPreemptivo(index);
}

function setIndexByRunPreemptivo(index) {
	setTimeout(function () {
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let jobExecution = new TempoExecucao(processosParaExecutar[index].jobId, inicioTempoProcesso, tempoFinal);
		grafico.push(jobExecution);
		$('.table-logs').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].jobId}</span><span class="-startjob">executando</span></li>`);
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-logs').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].jobId}</span><span class="-stopjob">finalizou</span></li>`);
			executarPreemptivo(index + 1);
			return index;
		}
		executarPreemptivo(index + 1);
	}, 1000);
}

function verifyJobs() {
	for (var i = 0; i < processosParaExecutar.length; i++) {
		if (processosParaExecutar[i].totalClocks >= 0) {
			return true;
		}
	}
	return false;
}

function processoRoundRobin() {
	tempoInicial = new Date().getTime();
	executar(0);
}

function executar(index) {
	if (index >= processosParaExecutar.length) {
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].jobId} por ser muito grande`, mensagens.color.erro);
		index++;
		executar(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	index = setIndexByRun(index);
}

function setIndexByRun(index) {
	setTimeout(function () {
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let jobExecution = new TempoExecucao(processosParaExecutar[index].jobId, inicioTempoProcesso, tempoFinal);
		grafico.push(jobExecution);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-logs').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].jobId}</span><span class="-startjob">executando</span></li>`);
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-logs').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].jobId}</span><span class="-stopjob">finalizou</span></li>`);
			index++;
		}
		executar(index);
	}, 1000);
	return index;
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

function compararPrioridade(jobA, jobB) {
	if (jobA.priority < jobB.priority)
		return 1;
	if (jobA.priority > jobB.priority)
		return -1;
	return 0;
}

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
				'Processo ' + grafico[i].jobId,
				new Date(0, 0, 0, 0, 0, grafico[i].startTime),
				new Date(0, 0, 0, 0, 0, grafico[i].finishTime)
			]
		);
	}

	let options = {
		timeline: { singleColor: '#007bff' },
	};

	chart.draw(dataTable, options);
}

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
function calculo() {
	for (let a = 0; a < processosParaCalcular.length; a++) {
		$('#calculo table tbody').empty();
		processosParaCalcular[a].lastTime = 0;
		processosParaCalcular[a].totalTime = 0;
		processosParaCalcular[a].waitTime = 0;
		for (let i = 0; i < grafico.length; i++) {
			if (processosParaCalcular[a].jobId == grafico[i].jobId) {
				processosParaCalcular[a].totalTime = Math.round(processosParaCalcular[a].totalTime + (grafico[i].finishTime - grafico[i].startTime));
				processosParaCalcular[a].waitTime = Math.round(processosParaCalcular[a].waitTime + (grafico[i].startTime - processosParaCalcular[a].lastTime));
				processosParaCalcular[a].lastTime = grafico[i].finishTime;
			}
		}
	}

	desenharCalculoEmTela();
	processosParaCalcular = [];
}
function desenharCalculoEmTela() {
	for (let a = 0; a < processosParaCalcular.length; a++) {
		$('#calculo table tbody').append(`
		<tr>
			<td>Processo ${processosParaCalcular[a].jobId}</td>
			<td>${processosParaCalcular[a].totalTime}s</td>
			<td>${processosParaCalcular[a].waitTime}s</td>
		</tr>`);
	}
}

function limparEscalonador() {
	$('#cleanScheduler').on('click', function () {
		id = 1;
		inicioTempoProcesso;
		processosParaExecutar = [];
		processosParaCalcular = [];
		grafico = [];
		$('.table-logs').html("");
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
