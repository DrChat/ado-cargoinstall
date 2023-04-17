# ADO CargoInstall task
This is a simple pipeline task for ADO that conveniently downloads and exposes [`cargo-binstall`](https://github.com/cargo-bins/cargo-binstall/tree/main).

## Quick start
Use this task like this in your yaml:
```
- task: CargoInstall@1
  inputs:
    crates: 'sccache,cargo-ado'
```

It should look like the following:
```
Starting: CargoInstall
==============================================================================
Task         : Cargo Install
Description  : Cargo Install for ADO
Version      : 1.0.0
Author       : Justin Moore <jusmoore@microsoft.com>
Help         : 
==============================================================================
/home/vsts/.cargo/bin/cargo binstall -y sccache cargo-ado
 INFO resolve: Resolving package: 'cargo-ado'
 INFO resolve: Resolving package: 'sccache'
 WARN The package cargo-ado v0.0.2 will be downloaded from github.com
 INFO This will install the following binaries:
 INFO   - cargo-ado (cargo-ado -> /home/vsts/.cargo/bin/cargo-ado)
 WARN resolve: When resolving sccache bin sccache-dist is not found. But since it requies features dist-server, this bin is ignored.
 WARN The package sccache v0.4.1 will be downloaded from third-party source QuickInstall
 INFO This will install the following binaries:
 INFO   - sccache (sccache -> /home/vsts/.cargo/bin/sccache)
 INFO Installing binaries...
 INFO Installing binaries...
 INFO Done in 2.024889472s

Finishing: CargoInstall
```
