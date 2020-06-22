import { Component, OnInit } from '@angular/core';
import { Process, Queue, Task, TaskType } from 'src/app/algorithm-core/srtf';
import { SrtfService } from 'src/app/services/srtf.service';


@Component({
  selector: 'app-srtf-algorithm',
  templateUrl: './srtf-algorithm.component.html',
  styleUrls: ['./srtf-algorithm.component.scss']
})
export class SrtfAlgorithmComponent implements OnInit {

  resultArray: Array<any> = [
    ['Name', 'State', 'From', 'To'],
  ];
  public chart: any = {
    chartType: 'Timeline',
    dataTable: this.resultArray,
  };

  // phases = ['P1', 'P2', 'P3'];
  // arriveTime = [0, 1, 2];
  // cpu = [[3, 3], [1, 1], [2, 3]];
  // io = [[2], [2], [3]];

  // phases = ['P1', 'P2', 'P3'];
  // arriveTime = [0, 0, 0];
  // cpu = [[1, 1, 1, 1, 1], [2, 2, 3], [13, 2]];
  // io = [[4, 4, 4, 4], [7, 7], [6]];
  // arriveTime = [0, 1, 2];
  // cpu = [[3, 3], [2, 2], [1, 5]];
  // io = [[4], [2], [1]];

  phases: Array<string> = [];
  arriveTime: Array<number> = [];
  cpu: Array<Array<number>> = [];
  io: Array<Array<number>> = [];

  procList1 = new Array<Process>();
  waitingTime: Array<number> = [];
  responseTime: Array<number> = [];
  totalTime: Array<number> = [];

  // input data
  inputFlag = false;
  buttonFlag = true;
  numOfProcess: number;
  flagChart = false;
  constructor(
    public algorithm: SrtfService
  ) {}

  ngOnInit() {
  }

  initProcess() {
    for (let i = 0; i < this.arriveTime.length; i++) {
      const tempTask = new Queue<Task>();
      for (let j = 0; j < this.cpu[i].length; j++) {
          tempTask.enQueue(new Task(TaskType.CPU, this.cpu[i][j]));
          tempTask.enQueue(new Task(TaskType.IO, this.io[i][j] !== undefined ? this.io[i][j] : 0));
      }
      this.procList1.push(new Process(this.phases[i], this.arriveTime[i], tempTask));
    }
    return this.procList1;
  }

  run() {
    this.initProcess();
    const tempArray = this.algorithm.runAlgo(this.procList1, this.phases);
    tempArray.forEach(i => {
      this.resultArray.push(i);
    });
    console.log(this.resultArray);
    this.flagChart = true;
  }

  confirmNOP() {
    if (this.buttonFlag) {
      for (let i = 0; i < this.numOfProcess; i++) {
        this.phases[i] = 'P' + (i + 1).toString();
        this.cpu.push([]);
        this.io.push([]);
      }
      this.buttonFlag = false;
    }
    console.log(this.phases);
    console.log(this.cpu);
    console.log(this.io);
  }
  // add process
  add() {
    this.phases.push('P' + (this.phases.length + 1).toString());
    this.cpu.push([]);
    this.io.push([]);
    console.log(this.phases);
    console.log(this.cpu);
    console.log(this.io);
  }

  // minus process
  minus() {
    this.phases.pop();
    this.cpu.pop();
    this.io.pop();
    console.log(this.phases);
    console.log(this.cpu);
    console.log(this.io);
  }

  save() {
    // this.inputArray = this.initProcess();
  }
}
