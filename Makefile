default: build
	node app.js

test: build
	npm run test

build:
	npm install
	npm run build
