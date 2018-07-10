#!/bin/sh

ENV_FILE_LOCATION="dist/assets/js/env.js"
rm -f $ENV_FILE_LOCATION;

/bin/cat > $ENV_FILE_LOCATION <<EOF
window.PRESENTATION_SERVER_ROOT = '$PRESENTATION_SERVER_ROOT';
window.PRESENTATION_SERVER_CUSTOMER = '$PRESENTATION_SERVER_CUSTOMER'; 
window.OMEKA_IMPORT = '$OMEKA_IMPORT';
window.SOURCE_COLLECTION = '$SOURCE_COLLECTION';
EOF