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
let arrayAux = 0;
let indexIO = null;

//Ao executar o sistema, limpar tudo
$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
	limparEscalonador();
});

//Funções que imitam construtores de classes
function ProcessoEstrutura(idProcesso, totalClocks, prioridade, realizaIOBound) {
	this.idProcesso = idProcesso;
	this.totalClocks = totalClocks;
	this.executado = false;
	this.prioridade = prioridade;
	this.realizaIOBound = realizaIOBound;
	this.contadorIOBound = 0;
	this.posicaoTela = 0;
	this.contadorMuitoAlta = 0;
	this.contadorAlta = 0;
	this.contadorMedia = 0;
	this.contadorBaixa = 0;
	this.contadorMuitoBaixa = 0;
	this.tempoEsperaIO = 0;
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
	let realizaIOBound = $('#ioBound').is(":checked");

	let exprRegularTempoExecucao = validarCampoNumerico(tempoExecucao);
	let exprRegularIntervaloTempo = validarCampoNumerico(intervaloDeTempo);


	if ((tempoExecucao === null) || (tempoExecucao === "") || (!exprRegularTempoExecucao) || (!exprRegularIntervaloTempo)) {
		executaMensagemTela(mensagens.error.vlValidoTempoExecucao, mensagens.color.erro);
		return;
	}

	let novoProcesso = new ProcessoEstrutura(id, tempoExecucao, prioridadeSelecionada, realizaIOBound);
	processosParaExecutar.push(novoProcesso);
	processosParaCalcular.push(novoProcesso);
	id++;

	let imagem = getImagem();

	$('.table-logs').append(`
		<div id="divImages" style="display:flex; flex-direction:row; margin-bottom:10px; justify-content:center; align-items:center">
		<img src=" ` + imagem + `" id="image" style="margin-right:10px" width=25 height=25>
			<li class="-itemjobAdd` + novoProcesso.idProcesso + `">
				Processo <span class="-numberjob">${novoProcesso.idProcesso}</span> adicionado a fila
				<i class="fas fa-minus -minusarrowicon"></i>
				Total de execução: <span class="-numbersecondjob">${novoProcesso.totalClocks}</span> Hz
				<i class="fas fa-minus -minusarrowicon"></i>
				${getNomePrioridade(prioridadeSelecionada)}
				${realizaIOBound == true ? '<i class="fas fa-minus -minusarrowicon"></i> IO' :  '<i class="fas fa-minus -minusarrowicon"></i> S/IO'}
			</li>
		</div>
	`);
	setScrollNaUltimaAdicionando();
}

//Recebe o nome da prioridade para converter para letras.
function getNomePrioridade(id) {
	switch(id.toString()) {
		case "1":
			return "MB";
		case "2":
			return "B";
		case "3":
			return "M";
		case "4":
			return "A";
		case "5":
			return "MA";
	}
}

//Defina a cor dos processos em tela conforme o que estiver executando.
function setColorPelaEtapa(etapa, idProcesso) {
	if (etapa == 'EXECUTANDO') {
		let nomeClasse = '-itemjobAdd' + idProcesso;
		for (let i = 0; i < $('#divImages li').length; i++) {
			if ($('#divImages li')[i].className == nomeClasse) {
				$('#divImages li')[i].style.color = '#007fff';
			} else {
				if ($('#divImages li')[i].style.color != 'rgb(115, 158, 65)' && $('#divImages li')[i].style.color != 'orange') {
					$('#divImages li')[i].style.color = 'black';
				}
			}
		}
	} else if (etapa == 'TERMINADO') {
		let nomeClasse = '-itemjobAdd' + idProcesso;
		for (let i = 0; i < $('#divImages li').length; i++) {
			if ($('#divImages li')[i].className == nomeClasse) {
				$('#divImages li')[i].style.color = '#739e41';
			} else {
				if ($('#divImages li')[i].style.color != 'rgb(115, 158, 65)' && $('#divImages li')[i].style.color != 'orange') {
					$('#divImages li')[i].style.color = 'black';
				}
			}
		}
	} else if (etapa == 'EMIOBOUND') {
		let nomeClasse = '-itemjobAdd' + idProcesso;
		for (let i = 0; i < $('#divImages li').length; i++) {
			if ($('#divImages li')[i].className == nomeClasse) {
				$('#divImages li')[i].style.color = 'orange';
			}
		}
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

	setaTempoIOBound();

	if (tipoProcesso === "RRS") {
		processoRoundRobin(0);
	} else if (tipoProcesso === "PRIORIDADE") {
		processosParaExecutar.sort(compararPrioridade);
		for (let i = 0; i < processosParaExecutar.length; i++) {
			processosParaExecutar[i].posicaoTela = i;
		}
		processoPrioridade(0);
	} else if (tipoProcesso === "FIFO") {
		processoFIFO(0);
	} else if (tipoProcesso === "TEMPOREAL") {
		processosParaExecutar.sort(compararPrioridade);
		processoTempoReal(0);
	} else if (tipoProcesso === "SJF") {
		processosParaExecutar.sort(compararTempo);
		processoSJF(0);
	}
}

//Realiza o escalonamento por Round Robin, é um escalonamento circular, executa em ordem.
function processoRoundRobin(index) {
	tempoInicial = new Date().getTime();
	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoRoundRobin(index + 1);
	}

	if (processosParaExecutar[index].totalClocks <= 0) {
		processoRoundRobin(index + 1);
		return index;
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		processosParaExecutar.shift();
		processoRoundRobin(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	if (processosParaExecutar[index].realizaIOBound) {
		setTimeout(() => {
			tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
			let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
			grafico.push(processoEmExecucao);

			processosParaExecutar[index].tempoEsperaIO = processosParaExecutar[index].tempoEsperaIO - tempoFinal

			setColorPelaEtapa('EMIOBOUND', processosParaExecutar[index].idProcesso);
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-iojob">Em I/O Bound</span></li>`);
			setScrollNaUltimaLinhaRodando();

			if (processosParaExecutar[index].tempoEsperaIO <= 0) {
				processosParaExecutar[index].realizaIOBound = false;
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				return processoRoundRobin(index);
			} else {
				processosParaExecutar[index].contadorIOBound += 1;
				index++
				return processoRoundRobin(index);
			}
		}, 1000);
	} else {
		if (processosParaExecutar[index].contadorIOBound > 0 && !processosParaExecutar[index].realizaIOBound) {
			setTimeout(() => {
				processosParaExecutar[index].contadorIOBound--;
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				limparContadoresNaoUsados(processosParaExecutar[index].prioridade);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					processosFinalizados.push(index);
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					return processoRoundRobin(index++);
				}
				return processoRoundRobin(index);
			}, 1000);
		} else {
			setTimeout(() => {
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					processoRoundRobin(index + 1);
					return index;
				}
				let processoIOFinalizado = pegarProcessoFinalizadoIO(tempoFinal);
				if (processoIOFinalizado != null) {
					return processoRoundRobin(processoIOFinalizado);
				}
				processoRoundRobin(index + 1);
			}, 1000);
		}
	}
}

//Realiza o escalonamento por FIFO, o primeiro processo que entrar é o primeiro a sair.
function processoFIFO(index) {
	tempoInicial = new Date().getTime();
	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}
	
	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoFIFO(index + 1);
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoFIFO(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	let verificaSeProcessosTerminouIO = validaTempoIOBound();

	if (verificaSeProcessosTerminouIO != null) {
		index = verificaSeProcessosTerminouIO;
		indexIO = null;
	}

	if (processosParaExecutar[index].realizaIOBound) {
		setTimeout(() => {
			tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
			let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
			grafico.push(processoEmExecucao);

			processosParaExecutar[index].tempoEsperaIO = processosParaExecutar[index].tempoEsperaIO - tempoFinal

			setColorPelaEtapa('EMIOBOUND', processosParaExecutar[index].idProcesso);
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-iojob">Em I/O Bound</span></li>`);
			setScrollNaUltimaLinhaRodando();

			if (processosParaExecutar[index].tempoEsperaIO <= 0) {
				processosParaExecutar[index].realizaIOBound = false;
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				return processoFIFO(index);
			} else {
				processosParaExecutar[index].contadorIOBound += 1;
				index++
				return processoFIFO(index);
			}
		}, 1000);
	} else {
		if (processosParaExecutar[index].contadorIOBound > 0 && !processosParaExecutar[index].realizaIOBound) {
			setTimeout(() => {
				processosParaExecutar[index].contadorIOBound--;
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				limparContadoresNaoUsados(processosParaExecutar[index].prioridade);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					processosFinalizados.push(index);
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					return processoFIFO(index++);
				}
				return processoFIFO(index++);
			}, 1000);
		} else {
			setTimeout(() => {
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					index++;
				}
				let processoIOFinalizado = pegarProcessoFinalizadoIO(tempoFinal);
				if (processoIOFinalizado != null) {
					return processoFIFO(processoIOFinalizado);
				}
				processoFIFO(index);
			}, 1000);
		}
	}
}

//Realiza o escalonamento por Tempo real, que consiste em executar os processos com maior prioridade até o final, sem métricas e sem execução paralela.
function processoTempoReal(index) {
	tempoInicial = new Date().getTime();
	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoTempoReal(index + 1);
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoTempoReal(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	let verificaSeProcessosTerminouIO = validaTempoIOBound();

	if (verificaSeProcessosTerminouIO != null) {
		index = verificaSeProcessosTerminouIO;
		indexIO = null;
	}

	if (processosParaExecutar[index].realizaIOBound) {
		setTimeout(() => {
			tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
			let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
			grafico.push(processoEmExecucao);

			processosParaExecutar[index].tempoEsperaIO = processosParaExecutar[index].tempoEsperaIO - tempoFinal

			setColorPelaEtapa('EMIOBOUND', processosParaExecutar[index].idProcesso);
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-iojob">Em I/O Bound</span></li>`);
			setScrollNaUltimaLinhaRodando();

			if (processosParaExecutar[index].tempoEsperaIO <= 0) {
				processosParaExecutar[index].realizaIOBound = false;
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				return processoTempoReal(index);
			} else {
				processosParaExecutar[index].contadorIOBound += 1;
				index++
				return processoTempoReal(index);
			}
		}, 1000);
	} else {
		if (processosParaExecutar[index].contadorIOBound > 0 && !processosParaExecutar[index].realizaIOBound) {
			setTimeout(() => {
				processosParaExecutar[index].contadorIOBound--;
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				limparContadoresNaoUsados(processosParaExecutar[index].prioridade);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					processosFinalizados.push(index);
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					return processoTempoReal(index++);
				}
				return processoTempoReal(index++);
			}, 1000);
		} else {
			setTimeout(() => {
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					index++;
				}
				let processoIOFinalizado = pegarProcessoFinalizadoIO(tempoFinal);
				if (processoIOFinalizado != null) {
					return processoTempoReal(processoIOFinalizado);
				}
				processoTempoReal(index);
			}, 1000);
		}
	}
}

//Realiza o escalonamento por SJF que consiste em executar os processos com menor tempo de execução primeiro.
function processoSJF(index) {
	tempoInicial = new Date().getTime();
	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoSJF(index + 1);
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoSJF(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	if (processosParaExecutar[index].realizaIOBound) {
		setTimeout(() => {
			tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
			let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
			grafico.push(processoEmExecucao);

			processosParaExecutar[index].tempoEsperaIO = processosParaExecutar[index].tempoEsperaIO - tempoFinal

			setColorPelaEtapa('EMIOBOUND', processosParaExecutar[index].idProcesso);
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-iojob">Em I/O Bound</span></li>`);
			setScrollNaUltimaLinhaRodando();

			if (processosParaExecutar[index].tempoEsperaIO <= 0) {
				processosParaExecutar[index].realizaIOBound = false;
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				return processoSJF(index);
			} else {
				processosParaExecutar[index].contadorIOBound += 1;
				index++
				return processoSJF(index);
			}
		}, 1000);
	} else {
		if (processosParaExecutar[index].contadorIOBound > 0 && !processosParaExecutar[index].realizaIOBound) {
			setTimeout(() => {
				processosParaExecutar[index].contadorIOBound--;
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				limparContadoresNaoUsados(processosParaExecutar[index].prioridade);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					processosFinalizados.push(index);
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					return processoSJF(index++);
				}
				return processoSJF(index++);
			}, 1000);
		} else {
			setTimeout(() => {
				tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
				let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
				grafico.push(processoEmExecucao);
				processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
				$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
				setScrollNaUltimaLinhaRodando();
				setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
				if (processosParaExecutar[index].totalClocks <= 0) {
					$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
					setScrollNaUltimaLinhaRodando();
					processosParaExecutar[index].executado = true;
					setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
					index++;
				}
				let processoIOFinalizado = pegarProcessoFinalizadoIO(tempoFinal);
				if (processoIOFinalizado != null) {
					return processoSJF(processoIOFinalizado);
				}
				processoSJF(index);
			}, 1000);
		}
	}
}

//Realizada o escalonamento por prioridade, o processo com maior prioridade é executado primeiro conforme a métrica de escalonamento
//Métrica de escalonamento desse sistema:
//Muito baixo = 1 | Baixo = 2 | Médio = 3 | Alto = 4 | Muito alto = 5
function processoPrioridade(index) {
	tempoInicial = new Date().getTime();
	if (processosFinalizados.length == processosParaExecutar.length) {
		return;
	}

	if (index >= processosParaExecutar.length) {
		index = 0;
	}

	if (processosParaExecutar[index].executado) {
		return processoPrioridade(index + 1);
	}

	if ((processosParaExecutar[index].totalClocks / intervaloDeTempo) > 30) {
		executaMensagemTela(`Sistema encerrou o Processo ${processosParaExecutar[index].idProcesso} por ser muito grande`, mensagens.color.erro);
		index++;
		processoPrioridade(index);
		return;
	}

	inicioTempoProcesso = (new Date().getTime() - tempoInicial) / 1000;

	setTimeout(() => {
		if (processosParaExecutar[index].prioridade == "5") {
			if (processosParaExecutar[index].contadorMuitoAlta == 5) {
				processosParaExecutar[index].contadorMuitoAlta = 0;
				index++;

				return processoPrioridade(index);
			}
			processosParaExecutar[index].contadorMuitoAlta++;
		} else if (processosParaExecutar[index].prioridade == "4") {
			if (processosParaExecutar[index].contadorAlta == 4) {
				processosParaExecutar[index].contadorAlta = 0;
				index++;

				return processoPrioridade(index);
			}
			processosParaExecutar[index].contadorAlta++;
		} else if (processosParaExecutar[index].prioridade == "3") {
			if (processosParaExecutar[index].contadorMedia == 3) {
				processosParaExecutar[index].contadorMedia = 0;
				index++;

				return processoPrioridade(index);
			}
			processosParaExecutar[index].contadorMedia++;
		} else if (processosParaExecutar[index].prioridade == "2") {
			if (processosParaExecutar[index].contadorBaixa == 2) {
				processosParaExecutar[index].contadorBaixa = 0;
				index++;

				return processoPrioridade(index);
			}
			processosParaExecutar[index].contadorBaixa++;
		} else if (processosParaExecutar[index].prioridade == "1") {
			if (processosParaExecutar[index].contadorMuitoBaixa == 1) {
				processosParaExecutar[index].contadorMuitoBaixa = 0;
				index++;

				return processoPrioridade(index);
			}
			processosParaExecutar[index].contadorMuitoBaixa++;
		}
		tempoFinal = (new Date().getTime() - tempoInicial) / 1000;
		let processoEmExecucao = new TempoExecucao(processosParaExecutar[index].idProcesso, inicioTempoProcesso, tempoFinal);
		grafico.push(processoEmExecucao);
		processosParaExecutar[index].totalClocks = processosParaExecutar[index].totalClocks - intervaloDeTempo;
		$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-startjob">executando</span></li>`);
		setScrollNaUltimaLinhaRodando();
		setColorPelaEtapa('EXECUTANDO', processosParaExecutar[index].idProcesso);
		limparContadoresNaoUsados(processosParaExecutar[index].prioridade);
		if (processosParaExecutar[index].totalClocks <= 0) {
			$('.table-process-running').append(`<li class="-itemjob">Processo <span class="-numberjob">${processosParaExecutar[index].idProcesso}</span><span class="-stopjob">finalizou</span></li>`);
			setScrollNaUltimaLinhaRodando();
			processosParaExecutar[index].executado = true;
			processosFinalizados.push(index);
			setColorPelaEtapa('TERMINADO', processosParaExecutar[index].idProcesso);
		}

		let indexAux = setaProcessosParalelos(processosParaExecutar[index].prioridade);

		if (indexAux == null) {
			return processoPrioridade(0);
		} else {
			processoPrioridade(indexAux);
		}
	}, 1000);
}

//Realiza o processo de escalonamento de prioridade em processos paralelos.
//Caso tenha mais de um processo com a mesma prioridade, eles devem ser executados de forma paralela, pois, possuem a mesma prioridade.
function setaProcessosParalelos(prioridade) {
	if (prioridade == "5") {
		let indexAux = null;
		arrayAux = processosParaExecutar.filter(function(a) {
			return a.prioridade == "5";
		});

		for (let i = 0; i < arrayAux.length; i++) {
			if (arrayAux[i].contadorMuitoAlta == 0 && indexAux == null && !arrayAux[i].executado) {
				indexAux = arrayAux[i].posicaoTela;
			}
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoAlta == 1 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoAlta == 2 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoAlta == 3 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoAlta == 4 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoAlta == 5 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		return indexAux;
	} else if (prioridade == "4") {
		let indexAux = null;
		arrayAux = processosParaExecutar.filter(function(a) {
			return a.prioridade == "4";
		});

		for (let i = 0; i < arrayAux.length; i++) {
			if (arrayAux[i].contadorAlta == 0 && indexAux == null && !arrayAux[i].executado) {
				indexAux = arrayAux[i].posicaoTela;
			}
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorAlta == 1 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorAlta == 2 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorAlta == 3 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorAlta == 4 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}
		return indexAux;
	} else if (prioridade == "3") {
		let indexAux = null;
		arrayAux = processosParaExecutar.filter(function(a) {
			return a.prioridade == "3";
		});

		for (let i = 0; i < arrayAux.length; i++) {
			if (arrayAux[i].contadorMedia == 0 && indexAux == null && !arrayAux[i].executado) {
				indexAux = arrayAux[i].posicaoTela;
			}
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMedia == 1 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMedia == 2 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMedia == 3 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}
		return indexAux;
	} else if (prioridade == "2") {
		let indexAux = null;
		arrayAux = processosParaExecutar.filter(function(a) {
			return a.prioridade == "2";
		});

		for (let i = 0; i < arrayAux.length; i++) {
			if (arrayAux[i].contadorBaixa == 0 && indexAux == null && !arrayAux[i].executado) {
				indexAux = arrayAux[i].posicaoTela;
			}
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorBaixa == 1 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorBaixa == 2 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}
		return indexAux;
	} else if (prioridade == "1") {
		let indexAux = null;
		arrayAux = processosParaExecutar.filter(function(a) {
			return a.prioridade == "1";
		});

		for (let i = 0; i < arrayAux.length; i++) {
			if (arrayAux[i].contadorMuitoBaixa == 0 && indexAux == null && !arrayAux[i].executado) {
				indexAux = arrayAux[i].posicaoTela;
			}
		}

		if (indexAux == null) {
			for (let i = 0; i < arrayAux.length; i++) {
				if (arrayAux[i].contadorMuitoBaixa == 1 && indexAux == null && !arrayAux[i].executado) {
					indexAux = arrayAux[i].posicaoTela;
				}
			}	
		}
		return indexAux;
	}
}

function limparContadoresNaoUsados(prioridade) {
	for (let i = 0; i < processosParaExecutar.length; i++) {
		if (prioridade == "5") {
			processosParaExecutar[i].contadorAlta = 0;
			processosParaExecutar[i].contadorMedia = 0;
			processosParaExecutar[i].contadorBaixa = 0;
			processosParaExecutar[i].contadorMuitoBaixa = 0;
		} else if (prioridade == "4") {
			processosParaExecutar[i].contadorMuitoAlta = 0;
			processosParaExecutar[i].contadorMedia = 0;
			processosParaExecutar[i].contadorBaixa = 0;
			processosParaExecutar[i].contadorMuitoBaixa = 0;
		} else if (prioridade == "3") {
			processosParaExecutar[i].contadorMuitoAlta = 0;
			processosParaExecutar[i].contadorAlta = 0;
			processosParaExecutar[i].contadorBaixa = 0;
			processosParaExecutar[i].contadorMuitoBaixa = 0;
		} else if (prioridade == "2") {
			processosParaExecutar[i].contadorMuitoAlta = 0;
			processosParaExecutar[i].contadorAlta = 0;
			processosParaExecutar[i].contadorMedia = 0;
			processosParaExecutar[i].contadorMuitoBaixa = 0;
		} else if (prioridade == "1") {
			processosParaExecutar[i].contadorMuitoAlta = 0;
			processosParaExecutar[i].contadorAlta = 0;
			processosParaExecutar[i].contadorMedia = 0;
			processosParaExecutar[i].contadorBaixa = 0;
		}
	}
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
	if (parseInt(processoA.prioridade) < parseInt(processoB.prioridade))
		return 1;
	if (parseInt(processoA.prioridade) > parseInt(processoB.prioridade))
		return -1;
	return 0;
}

function compararTempo(processoA, processoB) {
	if (parseInt(processoA.totalClocks) < parseInt(processoB.totalClocks))
		return -1;
	if (parseInt(processoA.totalClocks) > parseInt(processoB.totalClocks))
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
		arrayAux = 0;
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
			$('#ioBound').prop('disabled', true);
			break;
		case 'enable':
			$('#schTimeExecution').prop('disabled', false);
			$('#timeSlice').prop('disabled', false);
			$('#createQueue').prop('disabled', false);
			$('#prioritySelect').prop('disabled', false);
			$('#typeOfProcess').prop('disabled', false);
			$('#startJobs').prop('disabled', false);
			$('#createChart').prop('disabled', false);
			$('#ioBound').prop('disabled', false);
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

function setaTempoIOBound() {
	for (let i = 0; i < processosParaExecutar.length; i++) {
		if (processosParaExecutar[i].realizaIOBound) {
			processosParaExecutar[i].tempoEsperaIO = getRandom(100);
		}
	}
}

//Subtrai o tempo de espera dos processos em I/O bound, caso algum deles finalize, é o próximo a ser executado.
function validaTempoIOBound() {
	for (let i = 0; i < processosParaExecutar.length; i++) {
		if (processosParaExecutar[i].realizaIOBound && tempoFinal != undefined) {
			processosParaExecutar[i].tempoEsperaIO = processosParaExecutar[i].tempoEsperaIO - tempoFinal
		}

		if (processosParaExecutar[i].realizaIOBound && processosParaExecutar[i].tempoEsperaIO <= 0) {
			indexIO = i;
		}
	}

	return indexIO;
}

//Não deixa ser selecionada o campo I/O bound caso o escalonador for de prioridade
function deveEsconderIOBound(escalonador) {
	escalonador == "PRIORIDADE" ? $('#ioBound').prop('disabled', true) : $('#ioBound').prop('disabled', false);
}

function pegarProcessoFinalizadoIO(tempoFinal) {
	let processoFinalizado = null;
	for (let i = 0; i < processosParaExecutar.length; i++) {
		if (processosParaExecutar[i].realizaIOBound) {
			processosParaExecutar[i].tempoEsperaIO = processosParaExecutar[i].tempoEsperaIO - tempoFinal;
			processosParaExecutar[i].contadorIOBound += 1;
			if (processoFinalizado == null && processosParaExecutar[i].tempoEsperaIO <= 0) {
				processoFinalizado = i;
			}
		}
	}

	return processoFinalizado;
}
