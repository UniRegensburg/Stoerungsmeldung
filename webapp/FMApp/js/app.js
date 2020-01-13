/*----------------------------
Externe Quelle:
https://framework7.io
----------------------------*/

//The app.js determines whether the used device is an iOS or an android device
//and adjusts the appearance of the app accordingly
//Furthermore it initializes the Framework7, its mainview and specific page callbacks 
var isAndroid = Framework7.prototype.device.android;
var isIos = true;

Template7.global = {
    android: isAndroid,
    ios: isIos
};

var $$ = Dom7;

if (isAndroid) {
    // Change class of the navbar
    $$(".pages.navbar-through").removeClass("navbar-through").addClass("navbar-fixed");
    // And move navbar into page
    $$(".view .navbar").prependTo(".view .page");
}

// Init App
var FMApp = new Framework7({
    // Enable Material theme for Android device only
    material: isAndroid ? true : false,
    // Enable Template7 pages
    template7Pages: true,
    // Enable fastClicks and disable the 300ms delay for links and form elements in browsers
    fastClicks: false,
    // The default modal dialog title
    modalTitle: "Facility Management App",
    // Enable ability to close modal by clicking outside of modal
    modalCloseByOutside: true,
    // Hide navbar on scroll down
    hideNavbarOnPageScroll: true,
    // Do not show navbar immediately on scroll up
    showBarsOnPageScrollTop: false,
    // Do not show navbar immediately when page end is reached
    showBarsOnPageScrollEnd: false,
    // Hide and show indicator during ajax requests
    onAjaxStart: function (xhr) {
        FMApp.showIndicator();
    },
    onAjaxComplete: function (xhr) {
        FMApp.hideIndicator();
    }
});

//Initiate a global object containing all globally needed variables
myApp = {
    //All available pages of the FMApp
    indexURL: "index.html",
    loginUrl: "login.html",
    estimateURL: "estimation.html",
    pictureURL: "picture.html",
    helpURL: "help.html",
    appreciationURL: "appreciation.html",
    offlineURL: "offline.html",
    //Variables containing links to needed csv files
    localSpecialistGroupCsv: "csv/fachgruppenSchluesselwoerter.csv",
    localBuildingCsv: "csv/raumliste.csv",
    //Variable containing the server Url
    urSrvURL: 'http://oa.mi.ur.de/~gog59212/FMApp/server/php/',
    //In testmode the server doesnt send the malfunction report
    testMode: true,
    //If updateGrpOnChar is true the specialist group in the normal malfunction 
    //formular is checked for automatic group detection each time a character of
    //the malfunction description changes
    //If updateGrpOnChar is false the specialist group is checked each time the 
    //malfunction description changes(when the formular field is left)
    updateGrpOnChar: true,
}
 
//Init mainView
var mainView = FMApp.addView(".view-main", {
    dynamicNavbar: true
});

//Init callbacks for specific pages and page events
_initPageCallbacks();

function _initPageCallbacks(){
  FMApp.onPageBeforeInit("disturbance", function (page) {
    //Initiate the disturbanceController before the disturbance page is initialized
    DisturbanceController.init();
    DataController.init();
  });

  FMApp.onPageBeforeAnimation("index", function (page) {
    //Set the user"s NDS-Account when the index page is loaded and reday to animate
    LoginController.setNDSAccount();
  });

  FMApp.onPageInit("picture", function (page) {
    //Initiate the datacontroller when the picture page was initialized
    DataController.init();
  });

  FMApp.onPageInit("login", function (page) {
    //Initiate the loginController when the login page was initialized
    LoginController.init();
  });

  FMApp.onPageInit("index", function (page) {
    //Trigger a pageInit event for the index page when it was initialized
  }).trigger();

}





