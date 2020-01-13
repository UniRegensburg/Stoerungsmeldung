//The settingsController is responsible for the settings panel
//It changes the app's language and sets the default language at start
//Furthermore it starts the help page
var SettingsController = (function() {

      //Variable containing the language select form field
  var myLangSelect = document.getElementById("languageSelect");

  //Initiate the settingsController
  function init(){
    _setupUIListeners();
  }

  //Setup the UI element listener
  function _setupUIListeners(){
    //Add change listener to the language select form field
    myLangSelect.addEventListener("change", changeLanguage, false);
  }

  //Change the app"s language, remove the temporarily saved roomcode and refresh the current page
  //Save the currently used language
  function changeLanguage(){
    document.documentElement.lang = myLangSelect.options[myLangSelect.selectedIndex].value;
    sessionStorage.removeItem("roomCode");
    localStorage.setItem("lang", document.documentElement.lang);
    mainView.router.load(reload = true);
  }

  //Set the app"s default laguage in the settings panel
  function setDefaultLanguage(){
    if(document.documentElement.lang == "de"){
      myLangSelect.selectedIndex = 1;
    }
  }

  return {
    init: init,
    changeLanguage: changeLanguage,
    setDefaultLanguage: setDefaultLanguage
  };
  
})();
