<?php

define("countURL", "http://www-app.uni-regensburg.de/Einrichtungen/TZ/famos/stoerung/count");

//Fetch content of count.txt from the UR server

$fileContent = file_get_contents(countURL);
echo json_encode($fileContent);

?>