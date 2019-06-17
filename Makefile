default: build
	node app.js

test: build
	npm run test

build:
	browserify -t babelify ./src/formView.js > ./lib/formView.js
