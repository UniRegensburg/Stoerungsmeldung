<?php

define("ndsRegex", "/^[a-z]{3}[0-9]{5}$/");

// basic sequence with LDAP is connect, bind, search, interpret search
// result, close connection

//Check whether the given parameter is a valid NDS-account
if(preg_match(ndsRegex, ($_POST["nds"]))){
    //Save the given NDS-account parameter
    $nds_account = $_POST["nds"];
    
    //Connect to the UR LDAP server
    $ds=ldap_connect("ldaps://ldap.ur.de:636");
}else{
    echo json_encode(array("invalid"));
}

if ($ds) { 
    $r=ldap_bind($ds);

    //Search for the given NDS-account
    $sr=ldap_search($ds, "o=uni-regensburg,c=de", "cn=" . $nds_account);  
    $info = ldap_get_entries($ds, $sr);

    //Interpret and save the search results
    $nds = $info[0]["cn"][0];
    $mail = $info[0]["mail"][0];
    //Phone number can be empty
    $phone = $info[0]["telephonenumber"][0];
    $fullname = $info[0]["fullname"][0];
    if($nds != null){
        echo json_encode(array("true", $nds, $mail, $phone, $fullname));
    }else{
    echo json_encode(array("false"));
    }
    //Close the LDAP connection
    ldap_close($ds);
}
?>
