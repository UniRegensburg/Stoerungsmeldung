<?php

//Save the given log data

//Save the given parameters
$logData = json_decode(strip_tags(trim($_POST['logData'])), true);
$timestamp = strip_tags(trim($_POST['timestamp']));
$malfunctionId = strip_tags(trim($_POST['malfunctionId']));

//Save the data locally
$fp = fopen('../../logs/' . $malfunctionId . '.csv', 'w');

foreach ($logData as $fields) {
    fputcsv($fp, $fields);
}

fclose($fp);
?>