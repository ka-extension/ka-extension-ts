#!/bin/bash

REL="releases/"
VER=$(grep -oP '"version": "\K(\d.\d.\d)' manifest.json) # extract the version number
ZIP="$REL$VER.zip"

if [ ! -d "$REL" ]; then
	mkdir $REL
fi

zip -r $ZIP dist popup resources styles images manifest.json # zip it all up