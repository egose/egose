SHELL := /usr/bin/env bash

.PHONY: db
db:
	mongod --dbpath ~/projects/_mongodb/db
