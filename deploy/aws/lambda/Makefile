default: update

clean:
	rm -rf node_modules function.zip

build:
	npm i
	npm run build

zip: build
	npm ci --production
	zip -r \
		--exclude="*deploy/*" \
		--exclude="*test/*" \
		--exclude="*.git/*" \
		function.zip .
	npm i

create: zip
	aws lambda create-function \
		--function-name api \
		--zip-file fileb://function.zip \
		--handler lambda.handler \
		--runtime nodejs10.x \
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

