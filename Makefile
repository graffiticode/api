default: build
	node app.js

test: build
	npm run test

build:
	mkdir -p lib
	npm run build
