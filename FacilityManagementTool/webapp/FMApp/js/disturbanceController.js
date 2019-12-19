//The disturbanceController determines and checks the necessary disturbance data and finally submits the disturbance
//The user can enter room information according to the disturbance, assign a sepcialist group and enter a brief description
//Optionally the user can choose to send images as attachement to provide further information according to the disturbance
//To assist the user to enter the necessary disturbance information, the disturbanceController fetches suitable local and 
//specialist group information from csv files and tries to automatically assign the correct special group
//If the user started the webapp via QR-code the app automatically enters the according building, floor and room data
var DisturbanceController = (function() {

      //Variables containing the building, floor and room data
  var building = [],
      floor = [],
      room = [],

      //Variable containing the currently active select form field
      activeSelectField,

      //Variable containing a new option for a select form field
      newOption,

      //Variable containing the currently active checkBox
      activeCheckBox,

      //Variable containing the currently active text field
      activeTextField,

      //Variable containing the currently active button
      activeButton,

      //Variables containing the currently chosen building, floor and room
      activeBuilding = "",
      activeFloor = "",
      activeRoom = "",

      //Variable containing all rows of the csv file containing the building, floor and room data
      csvDataRows,
      //Variable containing a single row of the csv file containing the building, floor and room data
      rowCells,

      //Regular expressions used to validate user content(disturbance description)
      descRegex = /^[A-Za-z0-9_,;. +-ßäöüÄÖÜ?!]{1,75}$/,
      tokenRegex = /\S+/g,

      //Variable containing an error message which is shown when the user
      //hasnt completely filled in all necessary fields of a disturbance
      errMsg = "Following fields are missing: \n",
      //Variable containing boolean value, whether the user made a mistake
      //filling in the necessary distubance data
      err = false,

      //Variables containing all the information needed to submit a valid disturbance report
      userNDS = "abc12345",
      disturbanceId = 1,
      userName = "Max Mustermann",
      userMail = "example@mail.com",
      userPhone = "1234",
      currDate = "01.01.1991 01:01",
      description = "Disturbance description here",
      specGrp = "Specialist group here",

      //Variable containing the match rating of each specialist group according to the description text
      matchRatings = [0, 0, 0, 0, 0, 0],

      //Array containing keywords for automatic word detection for specialists 
      specialistKeywords = [],

      //Variable to check whether a specialist group keyword was found in the description text
      keywordFound = false,

      //Variable containing the time a preloader is showed before a specilaist group is automatically inserted in ms
      groupInsertionDelay = 1000; 

  //Initiate the disturbanceController when the disturbance.html is initiated
  function init(){
    _setupUIListener();
    _fetchCsvData();
  }

  //Setup the UI element listener
  function _setupUIListener(){
    //Add change listener to the building, floor and room select input fields
    $("#buildingSelect")[0].addEventListener("change", _buildingChanged, false);
    $("#floorSelect")[0].addEventListener("change", _floorChanged, false);
    $("#roomSelect")[0].addEventListener("change", _roomChanged, false);
    //Add change listener to the specialist group select input fields
    $(".groupSelect")[0].addEventListener("change", _specialistGroupChanged, false);
    $(".groupSelect")[1].addEventListener("change", _specialistGroupChanged, false);
    //Add click listener to the check disturbance buttons
    $(".check-button")[0].addEventListener("click", _checkDisturbanceData, false);
    $(".check-button")[1].addEventListener("click", _checkDisturbanceData, false);
    
    //CHeck whether the config variable updateGroOnChar is set to true and set the according eventlistener
    if(myApp.updateGrpOnChar === true){
      //Add input listener to the description textareas
      $(".desc-text")[0].addEventListener("input", _descChanged, false);
      $(".desc-text")[1].addEventListener("input", _descChanged, false);
    }else{
      //Add change listener to the description textareas
      $(".desc-text")[0].addEventListener("change", _descChanged, false);
      $(".desc-text")[1].addEventListener("change", _descChanged, false);
    }
  }

  //Fetch the building and specialist group data from csv files
  function _fetchCsvData(){
    _fetchBuildingData();
    _fetchSpecialistGroupData();
  }

  //Fetch the building, room and floor csv data file
  function _fetchBuildingData(){
    $.ajax({
      url: myApp.localBuildingCsv,
      dataType: "text",
    }).done(_parseBuildingData);
  }

  //Fetch the specialist group csv data file
  function _fetchSpecialistGroupData(){
    $.ajax({
      url: myApp.localSpecialistGroupCsv,
      dataType: "text",
    }).done(_parseSpecialistGroupData);
  }

  //Check whether the entered description contains keywords that match
  //one of the available specialist groups and set the according specialist group
  function _descChanged(){
    _saveDescText();
    //Check whether the description exists
    if(description != null){
    _checkDescText();
    _setSpGroup();
    }else{
    }
  }

  //If keywords were found show a prealoder animaion which indicates the change of the specialist group
  //and set the specialist group accordingly
  //and reset the keywordFound variable and the matchRatings array 
  function _setSpGroup(){ 
    if(keywordFound != false){
      _indicateGroupInsertion();
      activeSelectField.selectedIndex = (_getMaxIndex(matchRatings) + 1);
      keywordFound = false;
      matchRatings.fill(0);
      UtilityController.measureStep("Specialist group selected", 7);
    }
  }

  //Hide the Select field and show a preloader instead to indicate
  //the automatic change of the specialist group
  function _indicateGroupInsertion(){
    $(".groupSelect").hide();
    $(".groupPreloader").css('display', 'block');
    //Wait for a period of time until the groupselect is displayed again
    //Amount is specified in the groupInsertionDelay variable
    setTimeout(
      function(){
        $(".groupSelect").css('display', 'block')
        $(".groupPreloader").css('display', 'none');
      }, groupInsertionDelay);
  }

  //Iterate over the description text tokens
  //Check every token whether it matches any specialist keyword
  function _checkDescText(){
    for(var i = 0, descLen = description.length; i < descLen; i ++){
      //Iterate over the matchRatings/specialistGroup array
      for(var j = 0, matchLen = matchRatings.length; j < matchLen; j++){
        //Check whether the current token exists in the specific array of keywords
        if(specialistKeywords[j].indexOf(description[i]) != -1){
          keywordFound = true;
          matchRatings[j]++;
        }
      }
    }
  }

  //Save the correct description text (according to the app language)
  //into an array of lowercase tokens
  function _saveDescText(){
    if(document.documentElement.lang == "de"){
      description = $(".desc-text")[1].value.toLowerCase().match(tokenRegex);
      activeSelectField = $(".groupSelect")[1];
    }else{
      description = $(".desc-text")[0].value.toLowerCase().match(tokenRegex);
      activeSelectField = $(".groupSelect")[0];
    }
    UtilityController.measureStep("Description entered", 6);
  }

  //Check whether the user provided a roomcode by starting the app per QR code
  function _checkForQRCode(){
    if(sessionStorage.getItem("qrCode")){
      _parseRoomCode();
    }
  }

  //Extract the building, floor and room information from a roomcode
  function _parseRoomCode(){
    for(i = 0; i < csvDataRows.length; i++){
      if(sessionStorage.getItem("qrCode") == csvDataRows[i].split("*")[4]){
        activeBuilding = csvDataRows[i].split("*")[1];
        activeFloor = csvDataRows[i].split("*")[2];
        activeRoom = csvDataRows[i].split("*")[3];
        _updateSelectFields();
        break;
      }
    }
  }

  //Update the building, floor and room select fields when the given roomcode was successfully parsed
  function _updateSelectFields(){
    $("#buildingSelect")[0].value = activeBuilding;
    _buildingChanged();
    $("#floorSelect")[0].value = activeFloor;
    _floorChanged();
    $("#roomSelect")[0].value = activeRoom;
    _roomChanged();
  }

  //Save the building csv file data
  //Format: Altes Finanzamt, ALFI*Altes Finanzamt, ALFI*_0  EG*001 Lesesaal slow.*BY.R.L.2700.2700.0.01*0000000000004O1E..
  //Extract the building data
  //Format: ["Altes Finanzamt, ALFI", "Bibliothek, Tiefgarage Ost, TGAO", ..]
  function _parseBuildingData(data) {
    csvDataRows = data.split(/\r?\n|\r/);
    for (var i = 0, j = csvDataRows.length; i < j; i++) {
      rowCells = csvDataRows[i];
      if(rowCells !== ""){
        building.push(rowCells.split("*")[1]);
      }
    }
    _appendBuildingData(_uniqArray(building));
  }

  //Parse the specialist group csv file data and save it into a 2-dimensional array
  function _parseSpecialistGroupData(data){
    csvSGDataRows = data.split(/\r?\n|\r/);
    for (var i = 0, rowsLen = csvSGDataRows.length; i < rowsLen; i++) {
      rowCells = csvSGDataRows[i];
      if(rowCells !== ""){
        specialistKeywords.push(rowCells.split(","));
      }
    }
  }

  //React to user specialist group selections and log it
  function _specialistGroupChanged(){
    UtilityController.measureStep("Specialist group selected", 7);
  }

  //React to user building selections
  //Extract the according floor data and enable the floor select field
  function _buildingChanged(){
    UtilityController.measureStep("Building selected", 3);

    $("#floorSelect")[0].disabled = false;
    activeSelectField = $("#buildingSelect")[0];

    _extractFloorData(activeSelectField.options[activeSelectField.selectedIndex].value);
  }

  //React to user floor selections
  //Extract the according room data 
  function _floorChanged(){
    UtilityController.measureStep("Floor selected", 4);

    activeSelectField = $("#buildingSelect")[0];
    activeBuilding = activeSelectField.options[activeSelectField.selectedIndex].value;
    activeSelectField = $("#floorSelect")[0];
    activeFloor = activeSelectField.options[activeSelectField.selectedIndex].value;

    _extractRoomData(activeBuilding, activeFloor);
  }

  //React to user room selections
  //Fetch the building, floor and room data
  function _roomChanged(){
    UtilityController.measureStep("Room selected", 5);

    activeSelectField = $("#buildingSelect")[0];
    activeBuilding = activeSelectField.options[activeSelectField.selectedIndex].value;

    activeSelectField = $("#floorSelect")[0];
    activeFloor = activeSelectField.options[activeSelectField.selectedIndex].value;

    activeSelectField = $("#roomSelect")[0];
    activeRoom = activeSelectField.options[activeSelectField.selectedIndex].value;
  }

  //Check whether the user provided the necessary disturbance information
  //If yes: save the provided information and submit the disturbance 
  //Else show an error alert
  function _checkDisturbanceData(){
    err = false;   
    if(document.documentElement.lang == "de"){
      errMsg = "Folgende Felder fehlen oder sind mit ungültigem Inhalt gefüllt: ";
      activeSelectField = $(".groupSelect")[1];
      activeTextField = $(".desc-text")[1];
      if($("#roomSelect")[0].selectedIndex === 0){
        errMsg += " - Raum";
        err = true;
      }
      if(activeSelectField.selectedIndex === 0){
        errMsg += " - Fachgruppe";
        err = true;
      }
      if(_validateDescription(activeTextField.value)){
        errMsg += " - Beschreibung";
        err = true;
      }
      //Save the disturbance data(specialGroup, description)
      sessionStorage.setItem("specialGroup", activeSelectField.options[activeSelectField.selectedIndex].value);
      sessionStorage.setItem("description", activeTextField.value);
    }else{
      errMsg = "Following fields are missing or filled with invalid content: ";
      activeSelectField = $(".groupSelect")[0];
      activeTextField = $(".desc-text")[0];
      if($("#roomSelect")[0].selectedIndex === 0){
        errMsg += " - Room";
        err = true;
      }
      if(activeSelectField.selectedIndex === 0){
        errMsg += " - Specialist group";
        err = true;
      }
      if(_validateDescription(activeTextField.value)){
        errMsg += " - Description";
        err = true;
      }
      //Save the disturbance data(specialGroup, description)
      sessionStorage.setItem("specialGroup", activeSelectField.options[activeSelectField.selectedIndex].value);
      sessionStorage.setItem("description", activeTextField.value);
    }
    if(err === false){
      _fetchWebId();
    }else{
      FMApp.alert(errMsg, "Facility Management App");
    }
  }

  //Translate an english name of a special group into german
  function _translateSpecGroup(englishSpecGroup){
    switch(englishSpecGroup) {
    case "Electric":
        return "Starkstrom";
    case "Heating/Ventilation":
        return "Heizung/Lüftung";
    case "Sanitary":
        return "Sanitär";
    case "Refrigeration":
        return "Kältetechnik";
    case "Windows/Doors":
        return "Fenster/Türen";
    case "Telecommunications":
        return "Nachrichtentechnik";
    default:
        return "Nachrichtentechnik";
    }
  }

  //Fetch the disturbance id for the currently created disturbance report
  //Show an error alert if the user got no active internet connection
  function _fetchWebId(){
    if(UtilityController.checkOnlineStatus() == "true"){
      $.ajax({
        url: myApp.urSrvURL + "distIdCount.php",
        success: function(data) {
          disturbanceId = $.parseJSON(data);
          sessionStorage.setItem("webId", disturbanceId);
          _submitDisturbance();
        }
      });
    }else{
      mainView.router.loadPage(myApp.offlineURL);
    }
  }

  //Submit the disturbance with all the necessary data
  function _submitDisturbance(){
    activeCheckBox = document.getElementById("picCheckbox");

    //Gather the necessary data for the disturbance
    _gatherDistData();

    //Check whether the user has internet connection
    //If yes: submit the disturbance report to the php script
    //If no: Show the fallback offline page
    if(UtilityController.checkOnlineStatus() == "true"){
      $.ajax({
        url: myApp.urSrvURL + "submitDist.php",
        type: "POST",
        dataType: 'json',
        data: ({"userNDS": userNDS, "userName": userName, "userMail": userMail,
                "userPhone": userPhone, "description": description,
                "building": activeBuilding, "floor": activeFloor, 
                "room": activeRoom, "specialGroup": specGrp, "testMode": myApp.testMode}),
        error: function(jxhr, status, error) {
          if (jxhr.status == 408)
            _showTimeoutErrorMessage();
        },
        success: function(data) {
          result = JSON.parse(data);
            //CHeck whether the success value of the returned json object is 
            //true or false and show the according message
            if(result == true){
              _distSubmitSuccess();
            }else if(result == false){
              _distSubmitFailure();
            }else{
              FMApp.alert("Error while submitting the malfunction report: " + result);
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
    $(".check-button")[1].disabled = false;
    $(".check-button")[0].disabled = false;
  }

  //Show an error alert
  function _distSubmitFailure(result){
    //Show an error alert
    if(document.documentElement.lang == "de"){
      //Show an error alert
      FMApp.alert("Ein Fehler beim Senden der Störungsmeldung ist aufgetreten. Bitte versuchen Sie es erneut.");
      
    }else{
      //Show an error alert
      FMApp.alert("An error occurred while submitting your fault report. Please try again");
    }
  }

  //Show a success alert, send the log data to the server, upload chosen image files and redirect the user accordingly
  function _distSubmitSuccess(result){
    //Log the final time of the disturbance submit
    UtilityController.measureStep("Malfunction reported", 10);
    //Send the log data to the webserver
    UtilityController.sendLog(sessionStorage.getItem("webId"));
    //Upload the chosen image files to the server
    DataController.uploadAttachement();
    //Redirect to appreciation.html 
    mainView.router.loadPage(myApp.appreciationURL);
    //Show a success alert
    if(document.documentElement.lang == "de"){
      //Show a success alert
      FMApp.alert("Störung wurde erfolgreich übermittelt. Falls Sie Bilder beigefügt haben, warten Sie bitte bis Sie eine Meldung zum jeweiligen Bild erhalten haben. Dies kann je nach Dateigröße einige Augenblicke dauern.");
      
    }else{
      //Show a success alert
      FMApp.alert("Malfunction successfully submitted. If you attached image files to the malfunction report wait until you receive a sucess message for each file. This may take a few moments.");
    }
  }

  //Gather all the data needed for the disturbance report
  function _gatherDistData(){
    userNDS = localStorage.getItem("ndsAccount");
    userName = localStorage.getItem("userName");
    userMail = localStorage.getItem("userMail");
    userPhone = localStorage.getItem("userPhone");
    //Mark the disturbance descritpion with a preceeding '<A> - '
    //if the user wants to add attachements to the report
    if(DataController.uploadsAvailable() === true){
      description = "<A> - " + sessionStorage.getItem("description");
    }else{
      description = sessionStorage.getItem("description");
    }
    specGrp = sessionStorage.getItem("specialGroup");
  }

  //Validate the disturbance descriptio
  //Allowed figures: a-Z,;.+-_ ? ß
  function _validateDescription(description){
    if(descRegex.test(description)){
      return false;
    }
    return true;
  }

  //Extract the necessary room data from the csv file
  function _extractRoomData(building, floor){
    room = [];
    for (var i = 0, j = csvDataRows.length; i < j; i++) {
      rowCells = csvDataRows[i];
      if(rowCells !== "" && rowCells.split("*")[1] == building && rowCells.split("*")[2] == floor){
        room.push(rowCells.split("*")[3]);
      }
    }
    _appendRoomData(_uniqArray(room));
  }

   //Append the current room data from the csv file to the html site(roomSelect)
  function _appendRoomData(roomList){
    //First, clear the old options from the select item and enable the select input field
    activeSelectField = $("#roomSelect")[0];
    _resetSelectOptions(activeSelectField);
    activeSelectField.disabled = false;

    //Afterwards append the current data
    for(var i = 0; i < roomList.length; i++){
      newOption = document.createElement("option");
      newOption.value = roomList[i];
      if (typeof newOption.textContent === "undefined"){
            newOption.innerText = roomList[i];
        }
        else{
            newOption.textContent = roomList[i];
        }
      activeSelectField.appendChild(newOption);
    }
  }

  //Reset options of a given select input field
  function _resetSelectOptions(mySelect){
    while (mySelect.firstChild) {
        mySelect.removeChild(mySelect.firstChild);
    }
    //Then create a placeholder option for the select input field
    //Depending on the header"s lang attribute in english or german
    _createPlaceHolderOption(mySelect);
  }

  //Create a german/english placeholderoption for a given select input field 
  function _createPlaceHolderOption(mySelect){
    var newOption = document.createElement("option");
    if(document.documentElement.lang == "de"){
      newOption.value = "platzhalter";
      if (typeof newOption.textContent === "undefined"){
        newOption.innerText = "Bitte wählen";
      }
      else{
        newOption.textContent = "Bitte wählen";
      }
      mySelect.appendChild(newOption);
    }else{
      newOption.value = "placeholder";
      if (typeof newOption.textContent === "undefined"){
        newOption.innerText = "Please choose";
      }
      else{
        newOption.textContent = "Please choose";
      }
      mySelect.appendChild(newOption);
    }
  }

  //Extract the necessary floor data from the csv file
  function _extractFloorData(building){
    floor = [];
    for (var i = 0, j = csvDataRows.length; i < j; i++) {
      rowCells = csvDataRows[i];
      if(rowCells !== "" && rowCells.split("*")[1] == building){
        floor.push(rowCells.split("*")[2]);
      }
    }
    _appendFloorData(_uniqArray(floor));
  }

  //Append the current floor data from the csv file to the html site(floorSelect)
  function _appendFloorData(floorList){
    //First clear the old options from the select item fields(floorSelect, roomSelect)
    activeSelectField = $("#roomSelect")[0];
    _resetSelectOptions(activeSelectField);
    activeSelectField = $("#floorSelect")[0];
    _resetSelectOptions(activeSelectField);

    //Afterwards append the current data
    for(var i = 0; i < floorList.length; i++){
      var newOption = document.createElement("option");
      newOption.value = floorList[i];
      if (typeof newOption.textContent === "undefined"){
            newOption.innerText = floorList[i];
        }
        else{
            newOption.textContent = floorList[i];
        }
      activeSelectField.appendChild(newOption);
    }
    //Disable the room select input field, as the user has to specify a floor first
    activeSelectField = $("#roomSelect")[0];
    _resetSelectOptions(activeSelectField);
    activeSelectField.disabled = true;
  }

  //Append the buildings data from the csv file to the html site
  function _appendBuildingData(buildingList){
    //First, create a placeholder option for the select input field
    //(buildingSelect, floorSelect, roomSelect)
    //Depending on the header"s lang attribute in english or german
    activeSelectField = $("#floorSelect")[0];
    _resetSelectOptions(activeSelectField);
    //Disable the floor and the room select input fields, as the user has to specify a building and a floor first
    activeSelectField.disabled = true;
    activeSelectField = $("#roomSelect")[0];
    _resetSelectOptions(activeSelectField);
    activeSelectField.disabled = true;
    activeSelectField = $("#buildingSelect")[0];
    _resetSelectOptions(activeSelectField);

    //Afterwards append the current data
    for(var i = 0; i < buildingList.length; i++){
      var newOption = document.createElement("option");
      newOption.value = buildingList[i];
      if (typeof newOption.textContent === "undefined"){
            newOption.innerText = buildingList[i];
        }
        else{
            newOption.textContent = buildingList[i];
        }
      activeSelectField.appendChild(newOption);
    }
    _checkForQRCode();
  }

  //Return the index of the highest value of an given array
  function _getMaxIndex(array){
    var maxValue = array[0],
        maxIndex = 0;

    for (var i = 1, len = array.length; i < len; i++){
      if (array[i] > maxValue){
        maxIndex = i;
        maxValue = array[i];
      }
    }
    return maxIndex;
  }

  //Delete the redundant items of an array
  function _uniqArray(array) {
    var seen = {};
    return array.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
  }

  return {
    init: init,
  };
  
})();
