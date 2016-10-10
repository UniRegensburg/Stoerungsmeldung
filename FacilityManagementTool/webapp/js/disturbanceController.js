//The disturbanceController determines and checks the necessary disturbance data and finally sends the disturbance
//The user can enter local information according the disturbance, assign a sepcialist group and enter a brief description
//Optionally the user can choose to send an email with an attachement to provide further information according the disturbance, which leads the user to an extra screen
//To assist the user to enter the necessary disturbance information, the disturbanceController fetches suitable local and specialist group information from a csv and a json file
var DisturbanceController = (function() {

      //Links to data and html files
  var buildingCsvUrl = "https://appsso.uni-regensburg.de/Einrichtungen/TZ/famos/stoerung/raumliste.csv",      
      pictureURL = "picture.html",
      serverURL = "http://192.168.178.43:8080/",
      appreciationURL = "appreciation.html",
      localCSV = "csv/raumliste.csv",
      localHostCSV = "http://192.168.178.43/FMApp/csv/raumliste.csv",
      specGrpJSON = "csv/fachgruppen.json",
      offlineURL = "offline.html",
      srvPhpURL = 'http://oa.mi.ur.de/~gog59212/FMApp/server/php/',

      //Variable for the building data, containing the available buildings and the according name
      buildingGrpMap = {},
      
      //Variables containing the building, floor and room data
      building = [],
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

      //Variables containing the currently active building, floor and room
      activeBuilding = "",
      activeFloor = "",
      activeRoom = "",

      //Variable containing all rows of the csv file containing the building, floor and room data
      csvDataRows,
      //Variable containing a single row of the csv file containing the building, floor and room data
      rowCells,

      //Regular expressions used to validate user content(disturbance description)
      descRegex = /^[A-Za-z0-9_,;. +-]{1,76}$/,
      tokenRegex = /\S+/g,

      //Variabel containing the set of responsible special groups for a specific building
      responsibleSpecialGroups,
      //Variable containing the responsible special group for a specific building
      respSpecialGroup,
      
      //Variable containing the number of disturbances sent online

      //Contains the different special groups data for the different building in json format
      jsonData,

      //Variable containing an error message which is shown when the user
      //hasnt completely filled in all necessary fields of a disturbance
      errMsg = "Following fields are missing: \n",
      //Variable containing boolean value, whether the user made a mistake
      //filling in the necessary distubance data
      err = false,

      //Variables containing all the information needed to submit a valid disturbance report
      userNDS = "abc12345",
      placeholderWebId = 1,
      userName = "Max Mustermann",
      userPhone = "1234",
      //Variable containing the current date
      //Format: dd.mm.yyyy hh:mm
      currDate = "01.01.1991 01:01",
      description = "Disturbance description here",
      roomCode = "BY.C.12345",
      specGrp = "Specialist group here",

      //Variable containing the match rating of each specialist group according to the description text
      matchRatings = [0, 0, 0, 0, 0, 0];

        //secret
      //Arrays for automatic word detection for specialists 
      var specialistKeywords = [["kabel","lampe","licht","cable","lamp","light"],
                                ["heiß","heizung","heating","heat"],
                                ["toilette","sanitär","waschbecken","toilet","sanitary","sink"],
                                ["kalt","kälte","cold"],
                                ["tür","fenster","rahmen","door","window","frame"],
                                ["internet","telefon","telephon","telephone"]];   

  //Initiate the disturbanceController when the disturbance.html is iniatiated
  function init(){
    _setupUIListener();
    _fetchBuildingData();
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
    //Add change listener to the description textarea
    $(".desc-text")[0].addEventListener("change", _descChanged, false);
    $(".desc-text")[1].addEventListener("change", _descChanged, false);
  }

  function _descChanged(){
    //Check whether a specialist group keyword was found in dex description text
    var keywordFound = false;  

    //Save the correct description text (according to the app language) into an array of lowercase tokens
    if(document.documentElement.lang == "de"){
      description = $(".desc-text")[1].value.toLowerCase().match(tokenRegex);
      activeSelectField = $(".groupSelect")[1];
    }else{
      description = $(".desc-text")[0].value.toLowerCase().match(tokenRegex);
      activeSelectField = $(".groupSelect")[0];
    }

    //Iterate over the description text tokens
    //Check every token whether it matches any specialist keyword
    for(var i = 0, descLen = description.length; i < descLen; i ++){
      //Iterate over the matchRatings/specialistGroup array
      for(var j = 0, matchLen = matchRatings.length; j < matchLen; j++){
        //Iterate over the keywords of each specialist group
        for(var k = 0, keywordLen = specialistKeywords.length; k < keywordLen; k++){
          //Check whether the current token equals the current keyword
          //If they equal increase the according specialist group matchRating and set the keywordFound Variable true 
          if(description[i] == specialistKeywords[j][k]){
            keywordFound = true;
            matchRatings[j]++;
            console.log(matchRatings + description[i] + specialistKeywords[j][k]);
          }
        }
      }
    }

    //If a keyword was found set the specialist group accordingly
    //and reset the keywordFound Variable and the matchRatings array  
    if(keywordFound != false){
      activeSelectField.selectedIndex = (_getMaxIndex(matchRatings) + 1);
      keywordFound = false;
      matchRatings.fill(0);
    }
  }

  // Returns the index of the highest value of an given array
  function _getMaxIndex(array) {
    var maxValue = array[0],
        maxIndex = 0;

    for (var i = 1, len = array.length; i < len; i++) {
        if (array[i] > maxValue) {
            maxIndex = i;
            maxValue = array[i];
        }
    }
    return maxIndex;
  }
    
  //Fetch the building, room and floor data file
  //Currently from a csv file
  function _fetchBuildingData(){
    $.ajax({
      url: localCSV,
      dataType: "text",
    }).done(_handleCSVData);
  }

  //Check whether the user provided a roomcode by starting
  //the app per QR code
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
        console.log("Rauminfo: " + activeBuilding + activeFloor + activeRoom);
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

  //Save the csv file data
  //Format: Altes Finanzamt, ALFI*Altes Finanzamt, ALFI*_0  EG*001 Lesesaal slow.*BY.R.L.2700.2700.0.01*0000000000004O1E..
  //Extract the building data
  //Format: ["Altes Finanzamt, ALFI", "Bibliothek, Tiefgarage Ost, TGAO", ..]
  //Save the general and the exact building data together in a map
  //Format: {Altes Finanzamt, ALFI: "Altes Finanzamt, ALFI", Bibliothek, Tiefgarage Ost, TGAO: "Bibliothek, Tiefgarage Ost, TGAO", ..}
  function _handleCSVData(data) {
    csvDataRows = data.split(/\r?\n|\r/);
    for (var i = 0, j = csvDataRows.length; i < j; i++) {
      rowCells = csvDataRows[i];
      if(rowCells !== ""){
        building.push(rowCells.split("*")[1]);
        buildingGrpMap[rowCells.split("*")[1]] = rowCells.split("*")[0];
      }
    }
    _appendBuildingData(_uniqArray(building));
  }

  //React to user specialist group selections and log it
  function _specialistGroupChanged(){
    console.log("LOG: Specialist group chosen");
    UtilityController.measureStep("Specialist group chosen", 5);
  }

  //React to user building selections
  //Extract the according special groups and the floor data
  function _buildingChanged(){
    console.log("LOG: Building chosen");
    UtilityController.measureStep("Building chosen", 2);

    $("#floorSelect")[0].disabled = false;
    activeSelectField = $("#buildingSelect")[0];

    _extractFloorData(activeSelectField.options[activeSelectField.selectedIndex].value);
  }

  //React to user floor selections
  //Save the building and floor data and extract the according room data 
  function _floorChanged(){
    console.log("LOG: Floor chosen");
    UtilityController.measureStep("Floor chosen", 3);

    activeSelectField = $("#buildingSelect")[0];
    activeBuilding = activeSelectField.options[activeSelectField.selectedIndex].value;
    activeSelectField = $("#floorSelect")[0];
    activeFloor = activeSelectField.options[activeSelectField.selectedIndex].value;

    _extractRoomData(activeBuilding, activeFloor);
  }

  //React to user room selections
  //Fetch the building, floor and room data and extract the roomCode
  function _roomChanged(){
    console.log("LOG: Room chosen");
    UtilityController.measureStep("Room chosen", 4);

    activeSelectField = $("#buildingSelect")[0];
    activeBuilding = activeSelectField.options[activeSelectField.selectedIndex].value;

    activeSelectField = $("#floorSelect")[0];
    activeFloor = activeSelectField.options[activeSelectField.selectedIndex].value;

    activeSelectField = $("#roomSelect")[0];
    activeRoom = activeSelectField.options[activeSelectField.selectedIndex].value;
  }

  //Check whether the user provided all the necessary disturbance information
  //If yes: save the provided information, extract the special group and submit the disturbance 
  //Else show error alert
  function _checkDisturbanceData(){
    err = false;   
    console.log();
    if(document.documentElement.lang == "de"){
      errMsg = "Folgende Felder fehlen oder sind mit ungültigem Inhalt gefühlt: \n";
      activeSelectField = $(".groupSelect")[1];
      activeTextField = $(".desc-text")[1];
      if($("#roomSelect")[0].selectedIndex === 0){
        errMsg += "- Raum\n";
        err = true;
      }
      if(activeSelectField.selectedIndex === 0){
        errMsg += "- Fachgruppe\n";
        err = true;
      }
      if(_validateDescription(activeTextField.value)){
        errMsg += "- Beschreibung\n";
        err = true;
      }
      //Save the disturbance data(specialGroup, description)
      sessionStorage.setItem("specialGroup", activeSelectField.options[activeSelectField.selectedIndex].value);
      sessionStorage.setItem("description", activeTextField.value);
    }else{
      errMsg = "Following fields are missing or filled with invalid content: \n";
      activeSelectField = $(".groupSelect")[0];
      activeTextField = $(".desc-text")[0];
      if($("#roomSelect")[0].selectedIndex === 0){
        errMsg += "- Room\n";
        err = true;
      }
      if(activeSelectField.selectedIndex === 0){
        errMsg += "- Specialist group\n";
        err = true;
      }
      if(_validateDescription(activeTextField.value)){
        errMsg += "- Description\n";
        err = true;
      }
      //Save the disturbance data(specialGroup, description)
      sessionStorage.setItem("specialGroup", activeSelectField.options[activeSelectField.selectedIndex].value);
      sessionStorage.setItem("description", activeTextField.value);
    }
    if(err === false){
      UtilityController.measureStep("Disturbance reported");
      //TODO:löschen _extractSpecialGroup();
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

  //Fetch the web id for the currently created disturbance report
  function _fetchWebId(){
    if(UtilityController.checkOnlineStatus() == "true"){
      $.ajax({
        url: srvPhpURL + "distIdCount.php",
        success: function(data) {
          placeholderWebId = $.parseJSON(data);
          console.log(placeholderWebId);
          sessionStorage.setItem("webId", placeholderWebId);
          _submitDisturbance();
        }
      });
    }else{
      mainView.router.loadPage(offlineURL);
    }
  }

  //Submit the disturbance with all the necessary data
  //TODO: disturbance String und alert rausschmeißen
  function _submitDisturbance(){
    activeCheckBox = document.getElementById("picCheckbox");
    disturbance = "";

    //Gather all the data needed for the disturbance report
    userNDS = localStorage.getItem("ndsAccount");
    userName = localStorage.getItem("userName");
    userPhone = localStorage.getItem("userPhone");
    //Variable containing the current date
    //Format: dd.mm.yyyy hh:mm
    currDate = _getCurrDate();
    //Mark the disturbance descritpion with a preceeding '<A> - ', if the user added an attachement to the report
    if(activeCheckBox.checked === true){
      description = "<A> - " + sessionStorage.getItem("description");
    }else{
      description = sessionStorage.getItem("description");
    }
    specGrp = sessionStorage.getItem("specialGroup");

    //Check whether the user has internet connection
    //If yes: submit the disturbance report
    //If no: Show the fallback offline page
    if(UtilityController.checkOnlineStatus() == "true"){
      $.ajax({
        url: srvPhpURL + "submitDist.php",
        type: "POST",
        dataType: 'json',
        data: ({"userNDS": userNDS, "userName": userName, 
                "userPhone": userPhone, "description": description,
                "building": activeBuilding, "floor": activeFloor, 
                "room": activeRoom, "specialGroup": specGrp}),
        success: function(data) {
          result = data;
          //CHeck whether the success value of the json object is true or false
          console.log("STÖRUNGSMELDUNG:" + result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7]);
        }
      });
      //Send the log data to the webserver
      UtilityController.sendLog();
      //If the user wants to send an aditional picture of the disturbance
      //move on to picture.html
      if(activeCheckBox.checked === true){
        mainView.router.loadPage(pictureURL);
      }else{
        mainView.router.loadPage(appreciationURL);
      }
    }else{
      mainView.router.loadPage(offlineURL);
    }
  }

  //Validate the disturbance description
  //Allowed figures: a-Z,;.+-
  function _validateDescription(description){
    if(descRegex.test(description)){
      console.log("validation correct");
      return false;
    }
    console.log("validation wrong");
    return true;
  }

  //Get the current date and time and return it as string
  //Format: dd.mm.yyyy hh:mm
  function _getCurrDate(){
    var today = new Date(),
        dd = today.getDate(),
        mm = today.getMonth()+1, //January is 0!
        yyyy = today.getFullYear();
        hh = today.getHours();
        minmin = today.getMinutes();

    if(dd<10) {
        dd="0"+dd
    } 

    if(mm<10) {
        mm="0"+mm
    } 

    today = dd + "." + mm + "." + yyyy + " " + hh + ":" + minmin;
    return today;
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
