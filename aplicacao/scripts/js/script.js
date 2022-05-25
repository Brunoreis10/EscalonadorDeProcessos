'use strict';

let id = 1;
let startTimeJobs;
let startTime;
let finishTime;
let now;
let jobsToExecute = [];
let jobsToCalculate = [];
let chartData = [];
let timeSlice;
let messages = {
	error: {
		totalTimeExecution: 'Insira um valor válido ao Tempo de Execução',
		timeSliceEmpty: 'Insira um valor válido ao Intervalo de Tempo',
		arrayTimesEmpty: 'Execute uma operação para montar o gráfico!',
		inputsEmpty: 'Adicione Jobs a fila!'

	},
	alert: {
		executeJobs: 'Iniciando o escalonamento dos Jobs',
		restartScheduler: 'Escalonador reiniciado!',
		graphicMounted: 'Gráfico montado com sucesso!',
		initExeJobs: 'Iniciando execução dos Jobs'
	},
	color: {
		success: '-textsuccess',
		danger: '-texterror',
		warning: '-textwarnning'
	}
}

//Ao executar o sistema, limpar tudo
$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip();
	cleanScheduler();
});

//Funções que imitam construtores de classes
function JobStruct(jobId, totalClocks, priority) {
	this.jobId = jobId;
	this.totalClocks = totalClocks;
	this.executed = false;
	this.priority = priority;
}

//Funções que imitam construtores de classes
function TimeExecution(jobId, startTime, finishTime) {
	this.jobId = jobId;
	this.startTime = startTime;
	this.finishTime = finishTime;
}

function createQueue() {
	let schTimeExecution = $('#schTimeExecution').val();
	let prioritySelect = $('.prioritySelect').val();
	let exprRegularInt = /([0-9])/.test(schTimeExecution);

	if((schTimeExecution === null) || (schTimeExecution === "") || (!exprRegularInt)) {
		toast(messages.error.totalTimeExecution, messages.color.danger);
		return;
	}

	var newJob =  new JobStruct(id, schTimeExecution, prioritySelect);
	jobsToExecute.push(newJob);
	jobsToCalculate.push(newJob);
	id++;

	$('.table-logs').append(`
		<li class="-itemjob">
			<i class="fas fa-level-up-alt -arrowjobicon"></i>
			Job <span class="-numberjob">${newJob.jobId}</span> adicionado a fila
			<i class="fas fa-minus -minusarrowicon"></i>
			Total de execução: <span class="-numbersecondjob">${newJob.totalClocks}</span> Hz
		</li>
	`);
}

function startJobs() {
	if((jobsToExecute.length <= 0) || (jobsToExecute == null)) {
		toast(messages.error.inputsEmpty, messages.color.danger);
		return;
	}

	timeSlice = $('#timeSlice').val();
	if((timeSlice === null) || (timeSlice === "")) {
		toast(messages.error.timeSliceEmpty, messages.color.danger);
		return;
	}

	disableForm('disable');
	chartData = [];
	let typeProgress = $('.typeOfProcess').val();

	toast(messages.alert.executeJobs, messages.color.success);
	$('.table-logs').append(`<li class="-itemjob"><p>Tipo de Escalonamento escolhido: <span class="-numbersecondjob">${typeProgress}</span></p></li>`);
	
	if(typeProgress === "RRS") {
		jobPreemptivo();
	} else if(typeProgress === "PRIORITY") {
		jobsToExecute.sort(comparePriority);
		jobRoundRobin();
	} else if(typeProgress === "FIFO") {
		jobRoundRobin();
	}
}

function jobPreemptivo() {
	startTime = new Date().getTime();
	runPreemptivo(0);
}

function runPreemptivo(index){
	if(!verifyJobs()) {
		return index;
	}

	if(index >= jobsToExecute.length){
		index = 0;
	}
	
	if(jobsToExecute[index].totalClocks <= 0){
		runPreemptivo(index + 1);
		return index;
	}
	
	if((jobsToExecute[index].totalClocks / timeSlice) > 30){
		toast(`Sistema encerrou o job ${jobsToExecute[index].jobId} por ser muito grande`, messages.color.danger);
		jobsToExecute.shift();
		runPreemptivo(index);
		return;
	}
	
	startTimeJobs = (new Date().getTime() - startTime) / 1000;
	
	setTimeout(function() {
		jobsToExecute[index].totalClocks = jobsToExecute[index].totalClocks - timeSlice;
		finishTime = (new Date().getTime() - startTime) / 1000;
		let jobExecution = new TimeExecution(jobsToExecute[index].jobId, startTimeJobs, finishTime);
		chartData.push(jobExecution);
		$('.table-logs').append(`<li class="-itemjob">Job <span class="-numberjob">${jobsToExecute[index].jobId}</span><span class="-startjob">executando</span></li>`);
		if(jobsToExecute[index].totalClocks <= 0){
			$('.table-logs').append(`<li class="-itemjob">Job <span class="-numberjob">${jobsToExecute[index].jobId}</span><span class="-stopjob">finalizou</span></li>`);
			runPreemptivo(index + 1);
			return index;
		}
		runPreemptivo(index + 1);
	}, 1000);
}

function verifyJobs() {
	for(var i = 0; i < jobsToExecute.length; i++){
		if(jobsToExecute[i].totalClocks >= 0){
			return true;
		}
	}
	return false;
}

function jobRoundRobin() {
	startTime = new Date().getTime();
	run(0);
}

function run(index){
	if(index >= jobsToExecute.length){
		return index;
	}

	if((jobsToExecute[index].totalClocks / timeSlice) > 30){
		toast(`Sistema encerrou o job ${jobsToExecute[index].jobId} por ser muito grande`, messages.color.danger);
		index++;
		run(index);
		return;
	}

	startTimeJobs = (new Date().getTime() - startTime ) / 1000;
	
	setTimeout(function() {
		finishTime = (new Date().getTime() - startTime) / 1000;
		let jobExecution = new TimeExecution(jobsToExecute[index].jobId, startTimeJobs, finishTime);
		chartData.push(jobExecution);
		jobsToExecute[index].totalClocks = jobsToExecute[index].totalClocks - timeSlice;
		$('.table-logs').append(`<li class="-itemjob">Job <span class="-numberjob">${jobsToExecute[index].jobId}</span><span class="-startjob">executando</span></li>`);
		if(jobsToExecute[index].totalClocks <= 0){
			$('.table-logs').append(`<li class="-itemjob">Job <span class="-numberjob">${jobsToExecute[index].jobId}</span><span class="-stopjob">finalizou</span></li>`);
			index++;
		}
		run(index);
	}, 1000);
}

function createChart() {
	if((chartData.length <= 0)  || (chartData == null)) {
		toast(messages.error.arrayTimesEmpty, messages.color.danger);
		return;
	}

	calculo();

	google.charts.load("current", { packages: ["timeline"] });
	google.charts.setOnLoadCallback(drawChart);
	$('#createChart').prop('disabled', true);
	$('#sectionGraphic').show();
	$('#sectionCalculo').show();
	toast(messages.alert.graphicMounted, messages.color.success);
}

// function compareTime(jobA, jobB) {
// 	if (jobA.totalClocks < jobB.totalClocks)
// 		return -1;
// 	if (jobA.totalClocks > jobB.totalClocks)
// 		return 1;
// 	return 0;
// }

function comparePriority(jobA, jobB) {
	if (jobA.priority < jobB.priority)
		return 1;
	if (jobA.priority > jobB.priority)
		return -1;
	return 0;
}

function sleep(milliseconds = 1000) {
	let now = new Date().getTime();
	while ( new Date().getTime() < (now + milliseconds) ) {}
}

function drawChart() {
    let container = document.getElementById('chartTime');
    let chart = new google.visualization.Timeline(container);
    let dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Job' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
	dataTable.addColumn({ type: 'date', id: 'End' });

	for (let i = 0; i < chartData.length; i++) {
		dataTable.addRow(
			[
				'Job ' +  chartData[i].jobId,
				new Date(0, 0, 0, 0, 0, chartData[i].startTime ),
				new Date(0, 0, 0, 0, 0, chartData[i].finishTime)
			]
		);
	}

    let options = {
    	timeline: { singleColor: '#007bff' },
	};

    chart.draw(dataTable, options);
}

function toast(msg, txtColor = null) {
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
function calculo(){
	for(let a = 0; a < jobsToCalculate.length; a++) {
		$('#calculo table tbody').empty();
		jobsToCalculate[a].lastTime = 0;
		jobsToCalculate[a].totalTime = 0;
		jobsToCalculate[a].waitTime = 0;
		for(let i = 0; i < chartData.length; i++){
			if(jobsToCalculate[a].jobId == chartData[i].jobId) {
				jobsToCalculate[a].totalTime = Math.round(jobsToCalculate[a].totalTime + (chartData[i].finishTime - chartData[i].startTime));
				jobsToCalculate[a].waitTime = Math.round(jobsToCalculate[a].waitTime + (chartData[i].startTime - jobsToCalculate[a].lastTime));
				jobsToCalculate[a].lastTime = chartData[i].finishTime;
			}
		}
	}

	drawCalculo();
	jobsToCalculate = [];
}
function drawCalculo() {
	let totalWaitTime = 0;
	let valuesWaitTime = "";
	let lengthTime =  jobsToCalculate.length;
	let totalTime = 0;
	let valuesTotalTime = "";
	let valueWaitTotal = 0;
	let valueTotal = 0;
	for(let a = 0; a < jobsToCalculate.length; a++) {
		$('#calculo table tbody').append(`
		<tr>
			<td>Job ${jobsToCalculate[a].jobId}</td>
			<td>${jobsToCalculate[a].totalTime}s</td>
			<td>${jobsToCalculate[a].waitTime}s</td>
		</tr>`);
		totalWaitTime = totalWaitTime + jobsToCalculate[a].waitTime;
		totalTime = totalTime + jobsToCalculate[a].totalTime;
		valuesWaitTime = valuesWaitTime + jobsToCalculate[a].waitTime;
		valuesTotalTime = valuesTotalTime + jobsToCalculate[a].totalTime;
		if((lengthTime - 1) != a) {
			valuesWaitTime = valuesWaitTime + " + " ;
			valuesTotalTime = valuesTotalTime +  " + ";
		}
	}
	valueTotal = (totalTime/lengthTime).toFixed(3);
	valueWaitTotal = (totalWaitTime/lengthTime).toFixed(3);
	$('.totalTimeValues').text(valuesTotalTime);
	$('.waitTimeValues').text(valuesWaitTime);
	$('.valueWaitTotal').text(valueWaitTotal + 's');
	$('.valueTotal').text(valueTotal + 's');
	$('.lengthTime').text(lengthTime);
	$('#sectionCalculo').removeClass('hide');
}

function cleanScheduler() {
	$('#cleanScheduler').on('click', function() {
		id = 1;
		startTimeJobs;
		jobsToExecute = [];
		jobsToCalculate = [];
		chartData = [];
		$('.table-logs').html("");
		$('#schTimeExecution').val("");
		$('#timeSlice').val("");
		$('#sectionGraphic').hide();
		$('#sectionCalculo').hide();
		$('#chartTime').html("");
		$('#tbodyScheduler').html("");
		disableForm('enable');
		toast(messages.alert.restartScheduler, messages.color.success);
	});
}

function disableForm(item) {
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
