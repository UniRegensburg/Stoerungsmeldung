<?php

/*
Externe Quelle:
http://stackoverflow.com/questions/5647461/how-do-i-send-a-post-request-with-php/5647987
*/

//Url to post a disturbance report to the UR webformular
define("submitUrl", "http://www-app.uni-regensburg.de/Einrichtungen/TZ/famos/stoerung/auswertenstoerungcsv.php");

//Regular expresses to check the validity of disturbance data
define("ndsRegex", "/^[a-z]{3}[0-9]{5}$/");
define("nameRegex", "/^[a-z,A-Z +]{3,40}$/");
define("mailRegex", "/\S+@\S+\.\S+/");
define("phoneRegex", "/^[0-9 +]{1,20}$/");
define("descRegex", "/^[A-Za-z0-9_,;. +-ßäöüÄÖÜ?!]{1,76}$/");
define("buildingRegex", "/^([A-Za-z0-9_,;. +-ß*\/()]{1,200})$/");
define("floorRegex", "/^[A-Za-z0-9_,;. +-ß*]{1,40}$/");
define("roomRegex", "/^([A-Za-z0-9_,;. +-ß*\/()]{1,150})$/");
define("spGrRegex", "/^[A-Za-z0-9\/äü_]{3,30}$/");

//Check whether the given disturbance data is valid using the regular expresses
if(preg_match(ndsRegex, ($_POST["userNDS"])) &&
   preg_match(nameRegex, ($_POST["userName"])) &&
   preg_match(mailRegex, ($_POST["userMail"])) &&
   preg_match(phoneRegex, ($_POST["userPhone"])) &&
   preg_match(descRegex, ($_POST["description"])) &&
   preg_match(buildingRegex, ($_POST["building"])) &&
   preg_match(floorRegex, ($_POST["floor"])) &&
   preg_match(roomRegex, ($_POST["room"])) &&
   preg_match(spGrRegex, ($_POST["specialGroup"]))){

  //Save the given parameters
  $userNDS = strip_tags(trim($_POST["userNDS"]));
  $userName = strip_tags(trim($_POST["userName"]));
  $userMail = strip_tags(trim($_POST["userMail"]));
  $userPhone = strip_tags(trim($_POST["userPhone"]));
  $description = strip_tags(trim($_POST["description"]));
  $building = strip_tags(trim($_POST["building"]));
  $floor = strip_tags(trim($_POST["floor"]));
  $room = strip_tags(trim($_POST["room"]));
  $specialGroup = strip_tags(trim($_POST["specialGroup"]));
  $sendValue = "Abschicken";
  $testMode = strip_tags(trim($_POST["testMode"]));

  //Set the POST-Request parameter
  $data = array('nds_eintrag' => $userNDS, 'Name' => $userName, 'eMail' => $userMail, 'Telefon' => $userPhone, 'Gebaeude' => $building, 'Etage' => $floor, 'Raum' => $room, 'fachgruppe' => $specialGroup, 'Nachricht' => $description, 'Send' => $sendValue);

  if($testMode == "false"){
    //Submit the disturbance report
    $options = array(
        'http' => array(
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data)
        )
    );
    $context  = stream_context_create($options);
    $result = file_get_contents(submitUrl, false, $context);
  }

  //Return the fault report success
  echo "true";

}else{
    //Set the POST-Request parameter
  $data = array('nds_eintrag' => $userNDS, 'Name' => $userName, 'eMail' => $userMail, 'Telefon' => $userPhone, 'Gebaeude' => $building, 'Etage' => $floor, 'Raum' => $room, 'fachgruppe' => $specialGroup, 'Nachricht' => $description, 'Send' => $sendValue);
    //Return the fault report failure
    echo "false";
}

?>