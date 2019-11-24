default: update

clean:
	rm -rf build node_modules function.zip

build: clean
	npm i
	npm run build

zip: build
	npm ci --production
	zip -r \
		function.zip \
		package.json \
		package-lock.json \
		node_modules \
		build/src
	npm i

create: zip
	aws lambda create-function \
		--function-name api \
		--zip-file fileb://function.zip \
		--handler build.src.deploy.lambdaHandler \
		--runtime nodejs12.x \
		--role arn:aws:iam::903691265300:role/lambda-cli-role

update: zip
	aws lambda update-function-code \
		--function-name api \
		--zip-file fileb://function.zip

invoke:
	aws lambda invoke \
		--function-name api \
		--payload '{"key":"value"}' \
		out

