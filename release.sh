#!/bin/bash

REL="releases/"
NOTES_VER=$(jq -r .[0].version resources/update-log.json) # update log version
MAN_VER=$(jq -r .version manifest.json) # manifest version
ZIP="$REL$MAN_VER.zip"

if [ ! -d "$REL" ]; then # release folder check
	mkdir $REL
fi

check_overwrite () {
	printf "$1"
	read -r response
	if [ $response == "y" ]; then
		return 0
	else
		return 1
	fi
}

if [ $NOTES_VER != $MAN_VER ]; then # mismatched version check
	check_overwrite "Manifest and update log version numbers are mismatched, are they incremented?\nYou can overwrite [y] "
	if [ $? != 0 ]; then
		exit 1
	fi
fi	

if [ -f $ZIP ]; then # overwrite check
	check_overwrite "$MAN_VER.zip already exists, have you incremented the version?\nYou can overwrite [y] "
	if [ $? != 0 ]; then
		exit 1
	fi
	rm $ZIP
fi

zip -r $ZIP dist popup styles/general.css images manifest.json -q # zip it all up
echo "Zipped! $MAN_VER is now ready."
