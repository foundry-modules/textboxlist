all: modularize-script minify-script

include ../../build/modules.mk

MODULE = textboxlist
MODULARIZE_OPTIONS = -d "autosize.input,scrollTo"
SOURCE_SCRIPT_FOLDER = .
SOURCE_SCRIPT_FILE_PREFIX = 
