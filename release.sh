#!/bin/bash

REL="releases/"
VER=$(grep -oP '"version": "\K(\d.\d.\d)' manifest.json) # extract the version number
ZIP="$REL$VER.zip"

if [ ! -d "$REL" ]; then # create release folder if needed
	mkdir $REL
fi

if [ -f $ZIP ]; then # overwrite check
	printf "$VER.zip already exists, have you incremented the version? You can overwrite [y] "
	read -r overwrite
	if [ $overwrite == "y" ]; then
		rm $ZIP
		echo "$VER overwritten"
	else
		echo "Overwrite cancelled"
		exit 1
	fi
fi

zip -r $ZIP dist popup resources styles images manifest.json -x "*ace-themes/*" -q # zip it all up
echo "Zipped! $VER is now ready."