default: build
	npm start

test: build
	npm run test

build:
	npm run build

dev:
	npm run dev

.PHONY: build test
