all: modularize-script minify-script create-style-folder copy-style copy-extra

include ../../build/modules.mk

MODULE = textboxlist
MODULARIZE_OPTIONS = -d "autosize.input,scrollTo"
SOURCE_SCRIPT_FOLDER = .
SOURCE_SCRIPT_FILE_PREFIX =

SOURCE_STYLE_FILE_PREFIX =
SOURCE_STYLE_FILE_SUFFIX = .less
CSS_FILE_SUFFIX_UNCOMPRESSED = .less

copy-extra:
	cp variables.less ${TARGET_STYLE_FOLDER}/.