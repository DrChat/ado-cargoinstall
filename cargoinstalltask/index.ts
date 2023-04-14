import follow_redirects = require('follow-redirects');
import fs = require('fs');
import os = require('os');
import path = require('path');
import util = require('util');

import tl = require('azure-pipelines-task-lib/task');

const CARGO_BINSTALL_URLS = {
    'x86_64-unknown-linux-musl': {
        file: 'cargo-binstall-x86_64-unknown-linux-musl.tgz',
        url: 'https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-x86_64-unknown-linux-musl.tgz'
    },
    'x86_64-pc-windows-msvc': {
        file: 'cargo-binstall-x86_64-pc-windows-msvc.zip',
        url: 'https://github.com/cargo-bins/cargo-binstall/releases/latest/download/cargo-binstall-x86_64-pc-windows-msvc.zip'
    },
};

// `PropertyKey` is short for "string | number | symbol"
// since an object key can be any of those types, our key can too
// in TS 3.0+, putting just "string" raises an error
function hasKey<O extends Object>(obj: O, key: PropertyKey): key is keyof O {
    return key in obj
}

// Downloads file from remote HTTP[S] host and puts its contents to the
// specified location.
async function download(url: string, filePath: string) {
    var http = follow_redirects.http;
    var https = follow_redirects.https;

    const proto = !url.charAt(4).localeCompare('s') ? https : http;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        let fileInfo: {
            mime: string | undefined;
            size: number;
        } | null = null;

        const request = proto.get(url, response => {
            if (response.statusCode! >= 400) {
                fs.unlink(filePath, () => {
                    reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                });
                return;
            }

            fileInfo = {
                mime: response.headers['content-type'],
                size: parseInt(response.headers['content-length']!, 10),
            };

            response.pipe(file);
        });

        // The destination stream is ended by the time it's called
        file.on('finish', () => {
            file.close();
            resolve(fileInfo!)
        });

        request.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        file.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

async function run() {
    try {
        const inputCrates: string[] = tl.getDelimitedInput('crates', ',', true);
        if (inputCrates.length == 0) {
            tl.setResult(tl.TaskResult.Failed, util.format('no crates specified'));
            return;
        }

        // 1) Check for `cargo-binstall` on PATH or "~/.cargo/bin/cargo-binstall[.exe]"
        const ext = tl.getPlatform() == tl.Platform.Windows ? '.exe' : '';
        const cargoBinPath = path.join(os.homedir(), '.cargo', 'bin');
        const binstallPath = path.join(cargoBinPath, util.format('cargo-binstall%s', ext));

        if (!fs.existsSync(binstallPath)) {
            // No cargo-binstall on the system. Try to download it from GitHub.
            // Detect target triple using unstable rustc option (for now).
            let res = tl.execSync('rustc', '+nightly -Z unstable-options --print target-spec-json', { silent: true })
            if (res.code != 0) {
                tl.setResult(tl.TaskResult.Failed, util.format('failed to query host target triple: rustc exited with code %d', res.code));
                return;
            }

            let resJson = JSON.parse(res.stdout);
            let triple: string = resJson['llvm-target']

            tl.debug(util.format('Target triple: %s', triple));

            if (triple == "x86_64-unknown-linux-gnu") {
                // Use MUSL instead.
                triple = "x86_64-unknown-linux-musl";
            }

            if (hasKey(CARGO_BINSTALL_URLS, triple)) {
                let info = CARGO_BINSTALL_URLS[triple];

                // 2) Download binary archive to temp directory
                const dest = path.join(tl.getVariable('Agent.TempDirectory')!, info.file);
                await download(info.url, dest);

                if (path.extname(dest) == ".zip") {
                    // HACK: Agents have 7zip installed by default.
                    let res = tl.execSync('7z', util.format('x %s -o\"%s\"', dest, cargoBinPath), { silent: true });
                    if (res.code != 0) {
                        console.log(res.stdout);
                        console.log(res.stderr);

                        tl.setResult(tl.TaskResult.Failed, util.format('failed to extract cargo-binstall: code %d', res))
                        return;
                    }
                } else if (path.extname(dest) == ".tgz") {
                    // HACK: Assuming we're on Linux if we get here. `tar` on windows does not appear to support `-C`.
                    let res = tl.execSync('tar', util.format('-xzvf %s -C\"%s\"', dest, cargoBinPath), { silent: true });
                    if (res.code != 0) {
                        console.log(res.stdout);
                        console.log(res.stderr);

                        tl.setResult(tl.TaskResult.Failed, util.format('failed to extract cargo-binstall: code %d', res))
                        return;
                    }
                } else {
                    tl.setResult(tl.TaskResult.Failed, util.format('failed to install cargo-binstall: unknown archive format "%s"', path.extname(dest)))
                }

                if (!fs.existsSync(binstallPath)) {
                    tl.setResult(tl.TaskResult.Failed, util.format('failed to install cargo-binstall: file not present on filesystem'))
                    return;
                }
            } else {
                console.log('Triple \"%s\" not supported! Please contact VRTD. Building from code...', triple)
                let res = await tl.exec('cargo', 'install cargo-binstall')
                if (res != 0) {
                    tl.setResult(tl.TaskResult.Failed, util.format('failed to install cargo-binstall: code %d', res))
                    return;
                }
            }
        } else {
            tl.debug("cargo-binstall already installed");
        }

        // 3) Run `cargo-binstall <crate>`
        let res = await tl.exec('cargo', util.format('binstall -y %s', inputCrates.join(' ')));
        if (res != 0) {
            tl.setResult(tl.TaskResult.Failed, util.format('failed to install crate: code %d', res))
            return;
        }

        tl.setResult(tl.TaskResult.Succeeded, 'Success');
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        } else {
            tl.setResult(tl.TaskResult.Failed, "unknown error");
        }
    }
}

run();