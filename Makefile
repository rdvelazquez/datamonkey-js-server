.PHONY: clean all test publish

hyphy:
	echo "installing hyphy"
	@if ! test -d ./.hyphy; then git clone http://github.com/veg/hyphy.git ./.hyphy/; fi
	@cd ./.hyphy && git checkout develop && git pull && cmake . && make -j 4 hyphy && cd ../

hivtrace:
	@mkdir -p ./.python
	@virtualenv ./.python/env/
	@./.python/env/bin/pip install numpy
	@./.python/env/bin/pip install biopython
	@./.python/env/bin/pip install hivtrace==0.3.2

npm:
	echo "running npm"
	@npm install

directories:
	mkdir -p app/absrel/output
	mkdir -p app/bgm/output
	mkdir -p app/busted/output
	mkdir -p app/fade/output
	mkdir -p app/fel/output
	mkdir -p app/flea/output
	mkdir -p app/fubar/output
	mkdir -p app/fade/output
	mkdir -p app/gard/output
	mkdir -p app/meme/output
	mkdir -p app/prime/output
	mkdir -p app/relax/output
	mkdir -p app/slac/output
	mkdir -p app/hivtrace/output

install: hyphy hivtrace npm directories

