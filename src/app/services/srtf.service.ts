import { Injectable } from '@angular/core';
import { Process, StoryEvent, SrtfScheduler, Storyboard, Queue, Task, TaskType} from '../algorithm-core/srtf';

@Injectable({
  providedIn: 'root'
})
export class SrtfService {

  constructor() { }

  initProcess(phases: Array<string>, arriveTime: Array<number>, cpu: Array<Array<number>>, io: Array<Array<number>>) {
    const procList = new Array<Process>();
    for (let i = 0; i < arriveTime.length; i++) {
      const tempTask = new Queue<Task>();
      for (let j = 0; j < cpu[i].length; j++) {
        tempTask.enQueue(new Task(TaskType.CPU, cpu[i][j]));
        if (io[i][j] !== undefined) {
            tempTask.enQueue(new Task(TaskType.IO, io[i][j]));
        }
      }
      procList.push(new Process(phases[i], arriveTime[i], tempTask));
    }
    return procList;
  }

  runAlgo(procList: Array<Process>, phases: string[]) {
    const scheduler = new SrtfScheduler(procList);

    // Nhận kết quả trả về là một Storyboard
    const story: Storyboard = scheduler.scheduling();

    let result: Array<any> = [];

    story.Story.forEach((value: StoryEvent) => {
        result.push({
          startTime: value.Description === 'Arrived' ? value.Time : value.Time - 1,
          endTime: value.Time,
          Name: value.ProcessName,
          Task: value.Description,
        });
      });

    result = [... new Set(result)];
    // catch bug IO
    for (let i = 0; i < result.length; i++) {
      if (result[i].startTime === result[i].endTime) {
        continue;
      }
      const current = result[i - 1];
      const next = result[i];
      if (current.startTime === next.startTime) {
        if (current.Task === 'CPU') {
          next.startTime++;
          next.endTime++;
        }
      }
    }
    // catch bug CPU
    for (let i = 0; i < result.length; i++) {
      if (result[i].startTime === result[i].endTime) {
          continue;
      }
      const previous = result[i - 1];
      const next = result[i + 1];
      if (next !== undefined) {
        if ((previous.startTime === next.startTime) &&
            (previous.endTime === next.endTime) &&
            (previous.Name === next.Name) &&
            (previous.Task !== next.Task)) {
        for (let j = i; j < result.length; j++) {
            if (result[j].Task === 'CPU') {
            result[j].startTime++;
            result[j].endTime++;
            } else if (result[j].Task === 'IO') {
            result[j].startTime++;
            result[j].endTime++;
            }
          }
        }
      }
    }
    // filter each Process
    const eachProcess: Array<any> = [];
    for (const i of phases) {
      result.forEach(element => {
        if (element.Name === i) {
          eachProcess.push(element);
        }
      });
    }

    // slice each process
    let tempArray: Array<Array<any>> = [];
    for (const i of phases) {
        const temp = eachProcess.filter(element => {
            if (element.Name === i) {
                return element;
            }
        });
        tempArray.push(temp);
    }

    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        }
        const current = tempArray[i][j - 1];
        const next = tempArray[i][j];
        const offSet = next.startTime - current.startTime;
        if (offSet === 0) {
          if (current.Task === 'IO' && next.Task === 'IO') {
              next.startTime -= 1;
              next.endTime -= 1;
          } else if (current.Task === 'CPU' && next.Task === 'IO') {
            next.startTime += 1;
            next.endTime += 1;
          } else if (current.Task === 'IO' && next.Task === 'CPU') {
            next.startTime++;
            next.endTime++;
          } else if (current.Task === 'CPU' && next.Task === 'CPU') {
            next.startTime++;
            next.endTime++;
          }
        } else if (offSet > 1) {
            if (current.Task === 'IO' && next.Task === 'IO') {
                next.startTime -= offSet - 1;
                next.endTime -= offSet - 1;
            }
        }
      }
      // slice Terminated
      tempArray[i].pop();
    }

    tempArray = [... new Set(tempArray)];
    console.log(tempArray);
    const resultArray: Array<any> = [];
    for (let i = 0; i < phases.length; i++) {
      tempArray[i].forEach(element => {
        if (element.Task !== 'Terminated') {
          resultArray.push([
              element.Name,
              element.Task,
              element.startTime * 1000,
              element.endTime * 1000
          ]);
        }
      });
    }

    // push Terminated
    for (let i = 0; i < phases.length; i++) {
      for (let j = tempArray[i].length - 1; j > i; j--) {
        if (tempArray[i][j].Task === 'CPU') {
          resultArray.push([
              tempArray[i][j].Name,
              'Terminated',
              tempArray[i][j].endTime * 1000,
              tempArray[i][j].endTime * 1000
          ]);
          break;
        }
      }
    }
    // push response
    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        } else {
            const current = tempArray[i][j - 1].endTime;
            const next = tempArray[i][j].startTime;
            if (current === next) {
                break;
            } else {
              resultArray.push([
                  tempArray[i][j].Name,
                  'Response',
                  current * 1000,
                  next * 1000
              ]);
              break;
            }
          }
        }
      }

    // push waiting time
    for (let i = 0; i < phases.length; i++) {
      for (let j = 0; j < tempArray[i].length; j++) {
        if (tempArray[i][j].startTime === tempArray[i][j].endTime) {
            continue;
        } else {
          const current = tempArray[i][j - 1].endTime;
          const next = tempArray[i][j].startTime;
          if (current !== next) {
            if ((tempArray[i][j - 1].Task === 'CPU' && (tempArray[i][j].Task === 'CPU' || tempArray[i][j].Task === 'IO'))
            || (tempArray[i][j - 1].Task === 'IO' && (tempArray[i][j].Task === 'CPU' || tempArray[i][j].Task === 'CPU'))
            ) {
              resultArray.push([
                  tempArray[i][j].Name,
                  'Waiting',
                  current * 1000,
                  next * 1000
              ]);
            }
          }
        }
      }
    }
    console.log(resultArray);
    return [...new Set(resultArray)];
    }
  }


