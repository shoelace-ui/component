test:
	@DEBUG=shoelace-component:* ./node_modules/.bin/mocha \
	  --watch \
	  --require should 

.PHONY: test
