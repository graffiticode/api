## Getting started with API gateway

### Steps include (Mac OSX)

* Clone and initialize the GC repo.
  * `$ git clone git@github.com:graffiticode/api.git`
  * `$ cd api`
  * `$ npm install`
* Test the API gateway against remote L0
  * `$ export LOCAL_COMPILES=false`
  * `$ make test`
* Get, build and start L0
  * See https://github.com/graffiticode/L0
* Test the API gatway against local L0
  * `$ export LOCAL_COMPILES=true`
  * Start L0
  * `make test`
