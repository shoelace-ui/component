
test:
	@DEBUG=*shoelace ./node_modules/.bin/mocha \
	  --require should \
	  --watch

.PHONY: test