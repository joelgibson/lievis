MD_FILES = $(shell find src -name '*.md' | grep --ignore-case --invert-match src/lib)
HTML_FILES = $(patsubst %.md, %.html, $(MD_FILES))
BASE_URL = $(shell grep '^/' base_url)

.PHONY: all clean watchfiles
all: $(HTML_FILES)

watchfiles:
	@echo $(MD_FILES) pandoc-template.html base_url

clean:
	rm $(HTML_FILES)

%.html: %.md pandoc-template.html base_url
	pandoc \
		--output $@ \
		--template=pandoc-template.html \
		--katex=fake-url \
		--lua-filter=rebase-links.lua \
		-M base_url=$(BASE_URL) \
		--toc \
		--section-divs \
		$<
