import tl = require('azure-pipelines-task-lib/task');
import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setAnswers({
    "getPlatform": {
        "linux": tl.Platform.Linux,
    }
});

// TODO: Wtf ADO
// ##vso[task.issue type=error;]Input required: crates
// ##vso[task.complete result=Failed;]Input required: crates
tmr.setInput('crates', 'sccache');

tmr.run();
