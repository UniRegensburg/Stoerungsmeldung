/*------------------------
Externe Quelle:
http://www.nonobtrusive.com/2011/11/29/programatically-fire-crossbrowser-click-event-with-javascript/
------------------------*/

//The dataController handles the user file uploads
//It sends the chosen attachement files via Ajax-Request to the php server and shows an error/success alert
var DataController = (function() {

      //Variable containing a file input UI element 
  var myInput,

      //Variable containing a button UI element 
      activeButton,   

      //Variable containing the disturbance id for the current disturbance report
      disturbanceId = 1,

      //Array containing the selected files which the user wants to upload
      filesToUpload = [];

  //Initiate the dataController and set the UI element listeners
  function init() {
    myInput = $(".attachement-input")[0];
    //Prevent the attachement upload form field from reloading the webapp after submit
    $("#fileinfo").submit(function(e) {
      e.preventDefault();
    });
    //Set click listener for the add-attachement buttons
    $(".add-attachement")[0].addEventListener("click", _triggerClick, false);
    $(".add-attachement")[1].addEventListener("click", _triggerClick, false);
    //Set change listener for the attachement input field
    $(".attachement-input")[0].addEventListener("change", _attachementChosen, false);
  }

  //Returns whether the user has chosen files to upload
  function uploadsAvailable(){
    if(filesToUpload.length > 0){
      return true;
    }else{
      return false;
    }
  }

  //Add a file chosen from the user to the array of files to upload
  //and add the item to the list in the webapp
  function _attachementChosen(){
    try{
      //Add the chosen image file to the files array
      filesToUpload.push(myInput.files[0]);
      UtilityController.measureStep("File to upload selected", 9);
      _addListItem();
    }catch(err){
      console.log("Error: " + err);
    }
  }

  //Add a list item containing the name of the added image file
  //to the files list in the picture upload element of the disturbance page  
  function _addListItem(){
    //Add a new li element containing the file name and an icon to the ul
    $("#disturbance-file-upload ul").append('<li class="file-list-element"><div><span>' + filesToUpload[filesToUpload.length - 1].name
      + '</span><i class="icon icon-form-delete"></i></div></li>');
    //Add a click listener to each li element of the ul
    $(".icon-form-delete").each(function(){
      var listIcon = this;
      listIcon.addEventListener("click", _deleteUploadFile, false);
    });  
  }

  //Delete the chosen file from the list of files to upload
  function _deleteUploadFile(event){
    //Get the index of the clicked file in the array of file to upload
    var fileIndex = _getFileIndex(event.target.parentNode.childNodes[0].innerHTML);
    //Delete the file from the array
    filesToUpload.splice(fileIndex, 1);
    //Delete the file from the list of files to be uploaded in the app 
    event.target.parentNode.parentNode.remove();
  }

  //Return the index of the file to be deleted in the upload files array
  //Returns the index of the first appearance if multiple files share the same name
  function _getFileIndex(fileName){
    for(var i = 0, j = filesToUpload.length; i < j; i++){
      if(filesToUpload[i].name == fileName){
        return i;
      }
    }
  }

  //Trigger a click event on the add-attachement input element
  function _triggerClick() {
    _fireClick(myInput);
  }

  //Trigger a click event on the add-attachement input element
  function _fireClick(node){
    if (document.createEvent) {
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, false);
        node.dispatchEvent(evt);    
    } else if (document.createEventObject) {
        node.fireEvent("onclick") ; 
    } else if (typeof node.onclick == "function") {
        node.onclick(); 
    }
  }

  //Show an error message if the file upload failed
  function _fileUploadFailure(fileName){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Die Datei " + fileName + " konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.");
    }else{
      FMApp.alert("The file " + fileName + " was not uploaded successfully. Please try again.");
    }
  }

  //Show an error message if the file size is too big
  function _fileSizeError(fileName){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Die Datei " + fileName + " überschreitet die maximal zulässige Dateigröße von 5 MB. Die Datei konnte nicht hochgeladen werden");
    }else{
      FMApp.alert("The file " + fileName + " is bigger than the allowed file size of 5 MB. The file could not be uploaded");
    }
  }

  //Show an error message if the file type is not supported
  function _fileTypeError(fileName){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Das Format der Datei " + fileName + " wird leider nicht unterstützt. Erlaubte Dateiformate sind Jpg, Jpeg und Png. Die Datei konnte nicht hochgeladen werden");
    }else{
      FMApp.alert("The type of the file " + fileName + " is not supported. Jpg, Jpeg and Png files are allowed. The file could not be uploaded");
    }
  }

  //Show an success message if the file upload was successfull
  function _fileUploadSuccess(fileName){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Die Datei " + fileName + " wurde erfolgreich hochgeladen.");
    }else{
      FMApp.alert("The file " + fileName + " was successfully uploaded.");
    }
  }

  //Try to upload the chosen disturbance attachement via Ajax to the php server 
  //if the user has an internet connection attach the current disturbance id 
  //to the Url to help the server rename the file appropriately
  //Redirect to the offline fallback page otherwise
  //Show an error/success alert
  function uploadAttachement(){
    if(UtilityController.checkOnlineStatus() == "true"){  
      disturbanceId = sessionStorage.getItem("webId");

      for(var i = 0, j = filesToUpload.length; i < j; i++){
        var fd = new FormData();
        fd.append("fileToUpload", filesToUpload[i]);
        $.ajax({
          url : myApp.urSrvURL + 'upload.php?distId=' + disturbanceId,
          type : 'POST',
          data : fd,
          processData: false,  // tell jQuery not to process the data
          contentType: false,  // tell jQuery not to set contentType
          error: function(jxhr, status, error) {
            if (jxhr.status == 408)
              _showTimeoutErrorMessage();
          },
          success : function(data) {
            result = JSON.parse(data);
            //CHeck whether the success value of the returned json object is 
            //true or false and show the according message
            if(result[0] == "true"){
              _fileUploadSuccess(result[1]);
            }else if(result[0] == "size"){
              _fileSizeError(result[1]);
            }else if(result[0] == "type"){
              _fileTypeError(result[1]);
            }else{
              _fileUploadFailure(result[1]);
            }
          }
        });
      }
    }else{
      mainView.loadPage(myApp.offlineURL);
    }
  }

  //Show an error message if the server sends a timeout error
  function _showTimeoutErrorMessage(){
    if(document.documentElement.lang == "de"){
      FMApp.alert("Der Server benötigt zu lange um zu antworten. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.");
    }else{
      FMApp.alert("The server is taking to long to respond. Please try again later.");
    }
  }

  return {
    init: init,
    uploadAttachement: uploadAttachement,
    uploadsAvailable: uploadsAvailable
  };
  
})();
