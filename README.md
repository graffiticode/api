## Getting started with the API gateway

### Steps include (Mac OSX)

* Clone and initialize the GC repo.
  * `$ git clone git@github.com:graffiticode/api.git`
  * `$ cd api`
  * `$ npm install`
* Set Graffiticode LOCAL_COMPILES to true
  * Switch to the ./graffiticode terminal.
  * `$ export LOCAL_COMPILES=true`
* Test the API gateway
  * Switch back to the ./api terminal.
  * `$ export LOCAL_COMPILES=false`
  * `$ make test`
