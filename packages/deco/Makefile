SHELL := /usr/bin/env bash

.PHONY: build
build:
	rm -rf lib
	yarn build
	yarn pre-publish

.PHONY: publish
publish: build
publish:
	pushd lib && npm publish --access public && popd
	yarn sync-version
