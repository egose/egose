SHELL := /usr/bin/env bash

.PHONY: build
build:
	rm -rf _lib lib
	yarn build
	mv _lib/deco/src lib
	yarn pre-publish

.PHONY: publish
publish: build
publish:
	pushd lib && npm publish --access public && popd
	yarn sync-version
