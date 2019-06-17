default: build
	node app.js

test: build
	npm run test

build:
	browserify -t babelify ./src/form.js > ./lib/form.js
