.PHONY: getnext changelog-unrelease changelog changelog-latest release

SHELL:=/usr/bin/env bash
SEMTAG=semtag
CHANGELOG_FILE=CHANGELOG.md

scope?="auto"
nextver=`$(SEMTAG) final -s $(scope) -o -f`

changelog-unrelease:
	@git-chglog --no-case -o $(CHANGELOG_FILE)

changelog-next:
	@git-chglog --no-case -o $(CHANGELOG_FILE) --next-tag $(nextver)

changelog-latest:
	@git-chglog --no-case -o $(CHANGELOG_FILE) `$(SEMTAG) getlast`

release:
	@$(SEMTAG) final -s $(scope)

bump-next-version:
	@npm version $(nextver) --no-git-tag-version --allow-same-version

.PHONY: db
db:
	mkdir -p ../_mongodb/egose
	mongod --dbpath ../_mongodb/egose

.PHONY: upgrade
upgrade:
	yarn upgrade-interactive --latest

.PHONY: mk-serve
mk-serve:
	mkdocs serve

.PHONY: mk-build
mk-build:
	mkdocs build
