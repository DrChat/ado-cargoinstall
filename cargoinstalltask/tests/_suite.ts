import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('Task tests', function () {

    before(() => {

    });

    after(() => {

    });

    // Disabled until ADO gets their shiz together. Input we pass in is not recognized.
    // See basicInstall.ts for more info.
    // it('should succeed with sccache', function (done: Mocha.Done) {
    //     // this.timeout(1000);

    //     let tp = path.join(__dirname, 'basicInstall.js');
    //     let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    //     tr.run();
    //     console.log(tr.stdout);
    //     console.log(tr.stderr);
    //     assert.equal(tr.succeeded, true, 'should have succeeded');
    //     assert.equal(tr.warningIssues.length, 0, "should have no warnings");
    //     assert.equal(tr.errorIssues.length, 0, "should have no errors");
    //     assert.equal(tr.stdout.indexOf('INFO resolve: Resolving package: \'sccache\'') >= 0, true, "should display resolving sccache");
    //     done();
    // });
});
