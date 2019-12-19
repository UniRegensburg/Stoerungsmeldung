//The loginController handles the login functionality of the app
//It asks for the user's nds account, name and phone data,
//validates the provided information and saves correct data
//If the webapp was started via QR-code the roomcode is extracted
//from the URL and saved to the local storage
//Finally it redirects the user to the estimation page,
// where the user starts to provide the disturbance information
var LoginController = (function() {

      //Variables containing the user name, phone and mail
  var userName = "",
      userPhone = "",
      userMail = "",

      //Regular expressions used to validate user content
      phoneRegex = /^[0-9 +]{1,20}$/,
      nameRegex = /^[a-z,A-Z +]{3,20}$/,
      ndsRegex = /^[a-z]{3}[0-9]{5}$/,

      //Variables containing input form fields
      button,
      inputField,
      activeSelectField,

      //Variable containing the nds account that the user entered
      ndsUserInput,

      //Variable containing the roomcode that the user provided by starting the app via QR code
      roomCode,

      //Variable containing the result of the nds account ldap request of the webserver
      result;

  //Initiate the loginController
  function init(){
    _setupUIListener();
    _setUserData();
    _checkForRoomcode();
  }

  //Setup the UI element listener
  function _setupUIListener(){
    //Add click listener to the logout buttons
    $(".menu-item-user-logout")[0].addEventListener("click", _logout, false);
    $(".menu-item-user-logout")[1].addEventListener("click", _logout, false);
    //Add change listener to the user input fields
    $(".name-input")[0].addEventListener("change", _checkUserName, false);
    $(".phone-input")[0].addEventListener("change", _checkUserPhone, false);
    $(".phone-input")[1].addEventListener("change", _checkUserPhone, false);
    //Add click listener to the login buttons
    $(".login-button")[0].addEventListener("click", _checkUserInfo, false);
    $(".login-button")[1].addEventListener("click", _checkUserInfo, false);
  }

  //Check whether user data(name, phone) is already saved locally and show it if available
  //If no user data is saved show available data of the ldap webserver request according
  //to the nds account that the user entered to login
  function _setUserData(){
    if(localStorage.getItem("userName")){
      $(".name-input")[0].value = localStorage.getItem("userName");
    }else if(result[1] != undefined){
      $(".name-input")[0].value = result[4];
    }
    if(localStorage.getItem("userPhone")){
      $(".phone-input")[0].value = localStorage.getItem("userPhone");
      $(".phone-input")[1].value = localStorage.getItem("userPhone");    
    }else if(result[3] != null){
      $(".phone-input")[0].value = result[3];
      $(".phone-input")[1].value = result[3];
    }
  }

  //Check whether the user provided a roomcode e.g. by entering the app per QR code
  function _checkForRoomcode(){
    roomCode = location.search.split("&").toString();
    if(roomCode.length > 0){
      if(document.documentElement.lang == "de"){
      FMApp.alert("Raumdaten wurden erkannt und werden automatisch im Störungsformular eingefügt.");
      }else{
        FMApp.alert("Room data has been recognized and will be automatically inserted into the malfunction report form.");
      }
      roomCode = roomCode.substring(1);
      sessionStorage.setItem("qrCode", roomCode);
    }
  }

  //Check whether the user entered an existing nds account
  //Send a Ldap-request to the python webserver if the user has a running internet connection
  //Show the offline fallback page otherwise
  //If the nds account was valid redirect to login page
  //else show an error alert and enable the nds submit buttons
  function _pyCheckNDS(userAcc){
    if(UtilityController.checkOnlineStatus() == "true"){
      $(".button-nds")[0].disabled = true;
      $(".button-nds")[1].disabled = true;
     	$.ajax({
        url: myApp.urSrvURL + "ldap.php",
        type: "POST",
        dataType: 'json',
        data: ({ "nds": userAcc}),
        error: function(jxhr, status, error) {
          if (jxhr.status == 408)
            _showTimeoutErrorMessage();
        },
        success: function(data) {
          result = data;
          //CHeck whether the success value of the json object is true or false
          if(result[0] === "true"){
            _NDSInputSuccess();
          }else{
            $(".button-nds")[1].disabled = false;
            $(".button-nds")[0].disabled = false;
            _showNDSErrorMessage();
          }
        }
      }); 
    }else{
      mainView.router.loadPage(myApp.offlineURL);
    }
  }

  //Show an error message if the server sends a timeout error
  //Enable the login buttons
  function _showTimeoutErrorMessage(){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Der Server benötigt zu lange um zu antworten. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.");
    }else{
      FMApp.alert("The server is taking to long to respond. Please try again later.");
    }
    $(".button-nds")[1].disabled = false;
    $(".button-nds")[0].disabled = false;
  }

  //Show an error message if the checked nds account doesnt exist
  function _showNDSErrorMessage(){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Kein gültiger NDS-Account. Bitte versuchen Sie es erneut.");
    }else{
      FMApp.alert("Not a correct NDS-account. Please try again.");
    }
  }

  //Redirect to the login page if the entered nds account exists
  function _NDSInputSuccess(){
    UtilityController.measureStep("Correct NDS Login", 0);
    mainView.router.loadPage("login.html");
  } 

  //Check whether the user provided a valid name and phone number
  //Show an error alert if the data was not valid
  //Redirect to the estimation page, save the entered user data
  //and update the options in the settings panel
  function _checkUserInfo(){
    if(_validateName($(".name-input")[0].value) && _checkLangUserPhone()){
      _saveUserData();
      _enableSettingsUI();
      UtilityController.measureStep("Valid User Info entered", 1);
      mainView.router.loadPage(myApp.estimateURL);
    }else if (document.documentElement.lang == "de"){
      FMApp.alert("Bitte füllen Sie alle Felder korrekt aus.");
    }else{
      FMApp.alert("Please fill all fields correctly.");      
    }
  }

  //Check the user name after input and show proper feedback(green/red font color)
  function _checkUserName(){
    if(_validateName($(".name-input")[0].value)){
      $(".name-input").css("color", "green");
    }else{
      $(".name-input").css("color", "red");
    }
  }

  //Check the user phone number after input and show proper feedback(green/red font color)
  function _checkUserPhone(){
    if (document.documentElement.lang == "de"){
      if(_validatePhone($(".phone-input")[1].value)){
        $(".phone-input:eq( 1 )").css("color", "green");
      }else{
        $(".phone-input:eq( 1 )").css("color", "red");
      }
    }else{
      if(_validatePhone($(".phone-input")[0].value)){
        $(".phone-input:eq( 0 )").css("color", "green");
      }else{
        $(".phone-input:eq( 0 )").css("color", "red");
      }
    }
      
  }

  //Logout the user, update the settings UI elements and reload the index page
  function _logout(){
    localStorage.removeItem("ndsAccount");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMail");
    localStorage.removeItem("userPhone");
    _disableSettingsUI();
    document.location.href = myApp.indexURL;
  }

  //Enable the logout button and show the user nds account in the settings panel
  function _enableSettingsUI(){
    $(".menu-item-user-name")[0].innerHTML = localStorage.getItem("ndsAccount");
    $(".menu-item-user-name")[1].innerHTML = localStorage.getItem("ndsAccount");
    $(".menu-item-user-logout")[0].disabled = false;
    $(".menu-item-user-logout")[1].disabled = false;
  }

  //Disable the logout button and delete the user nds account in the settings panel
  function _disableSettingsUI(){
    $(".menu-item-user-name")[0].innerHTML = "";
    $(".menu-item-user-name")[1].innerHTML = "";
    $(".menu-item-user-logout")[0].disabled = true;
    $(".menu-item-user-logout")[1].disabled = true;
  }

  //Save the user data(nds account, name, mail, phone) to the local storage if the data was valid
  function _saveUserData(){
    if(ndsUserInput != undefined){
      localStorage.setItem("ndsAccount", ndsUserInput);
    }
    userName = $(".name-input")[0].value;
    localStorage.setItem("userName", userName);
    if(localStorage.getItem("userMail") == undefined){
      userMail = result[2];
      localStorage.setItem("userMail", userMail);
    }
    if(document.documentElement.lang == "de"){
      userPhone = $(".phone-input")[1].value;
      localStorage.setItem("userPhone", userPhone);
    }else{
      userPhone = $(".phone-input")[0].value;
      localStorage.setItem("userPhone", userPhone);
    }
  }

  //Check whether the user entered a valid phone number
  function _checkLangUserPhone(){
    if(document.documentElement.lang == "de"){
      return _validatePhone($(".phone-input")[1].value);
    }else{
      return _validatePhone($(".phone-input")[0].value);
    }
  }

  //Check whether the user entered a valid phone number using regex
  function _validatePhone(phone){
    return phoneRegex.test(phone);
  }

  //Check whether the user entered a valid name using regex
  function _validateName(name){
    return nameRegex.test(name);
  }  

  //check whether the entered user nds account is valid
  function _checkStringFormat(inputString) {
    if ((inputString.length > 0) && ndsRegex.test(inputString)) {
        return true;
    }else{
      return false;
    }
  }

  //Redirect to the login page if the user saved his login information at an earlier date
  //Show an error alert if the nds account is not valid
  function checkLoginStatus(){
    if(localStorage.getItem("ndsAccount") != "undefined" && localStorage.getItem("ndsAccount") != null){
      if(document.documentElement.lang == "de"){
        if(_checkStringFormat(localStorage.getItem("ndsAccount"))){
          UtilityController.measureStep("Correct NDS Login", 0);
          mainView.router.loadPage(myApp.loginUrl);
        }else{
          FMApp.alert("Kein gültiger NDS-Account. Bitte versuchen Sie es erneut.");
        }
      }else{
        if(_checkStringFormat(localStorage.getItem("ndsAccount"))){
          UtilityController.measureStep("Correct NDS Login", 0);
          mainView.router.loadPage(myApp.loginUrl);
        }else{
          FMApp.alert("Not a correct NDS-account. Please try again.");
        }
      }
    }
  }

  //Check whether the user entered a valid nds account
  //If the nds account was valid check whether the entered nds account exists
  //or show an error alert if the nds account was not valid
  function checkUserNDS(){
    if(document.documentElement.lang == "de"){
      ndsUserInput = $(".login-input")[1].value.toLowerCase();
      if(_checkStringFormat(ndsUserInput)){
        _pyCheckNDS(ndsUserInput);
      }else{
        FMApp.alert("Kein valider NDS-Account. (z.B.: abc12345)");
      }
    }else{
      ndsUserInput = $(".login-input")[0].value.toLowerCase();
      if(_checkStringFormat(ndsUserInput)){
        _pyCheckNDS(ndsUserInput);
      }else{
        FMApp.alert("Not a valid nds account. (e.g.: abc12345)");
      }
    }
  }

  //Show the saved user nds account when the index html page body finished loading
  function setNDSAccount(){
    if (document.documentElement.lang == "de"){
      $(".login-input")[1].value = localStorage.getItem("ndsAccount");
    }else{
      $(".login-input")[0].value = localStorage.getItem("ndsAccount");
    }
  }

  return {
    init: init,
    checkLoginStatus: checkLoginStatus,
    checkUserNDS: checkUserNDS,
    setNDSAccount: setNDSAccount
  };
  
})();
