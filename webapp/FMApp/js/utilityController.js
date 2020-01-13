//The utilityController loggs the time that the user needs to reach the key steps of the disturbance report
//Steps: nds login, user info login, disturbance estimation, building-, floor-, room entered,
//specialist group chosen, disturbance submitted
//Furthermore it sends the log data via ajax-request to the php server and checks for an active internet connection
var UtilityController = (function() {

      //Variable containing the start/end time of the logging process
  var start = 0,
      end = 0,

      //Variable containing the current logging step
      currentAction = [],

      //Variable containing all measured user actions
      userActions = [],

      //Variable containing the first saved timestamp of an log array
      timestamp = "";

      //Variable showing whether the user has an internet connection or not
      status = navigator.onLine;

  //Initiate the UtilityController and start logging
  function init(){
    start = new Date().getTime();
    _initLog();
  }

  //Create a new variable containing the log data
  //and set the header row for the log file
  function _initLog(){
    //Push the log header to an array
    currentAction.push("Timestamp");
    currentAction.push("User Action");
    currentAction.push("Time needed in s");
    //Push the single action log to an array containing all action logs
    userActions[0] = currentAction;
    //Reset the sinle action array
    currentAction = [];
  }

  //Measure the current step and log it
  function measureStep(stepName, stepNumber){
    end = new Date().getTime();
    //Push the log data(timestamp, stepname, time needed) to an array
    currentAction.push(new Date(Math.floor(Date.now())));
    currentAction.push(stepName);
    if(userActions[stepNumber+1] != undefined){
    	currentAction.push((end - start)/1000 + userActions[stepNumber+1][2]);    	
    }else{
    	currentAction.push((end - start)/1000);
    }
    //Push the single action log to an array containing all action logs
    userActions[stepNumber + 1] = currentAction;
    //Reset the sinle action array
    currentAction = [];
    //Save a new start time
    start = new Date().getTime();
  }

  //Send the log data array to the webserver
  function sendLog(malfunctionId){
    timestamp = userActions[1][0];
    userActions = JSON.stringify(userActions);
    $.ajax({
      url: myApp.urSrvURL + "log.php",
      type: "POST",
      data: ({"logData": userActions, "timestamp": timestamp, "malfunctionId": malfunctionId})
    });
  }

  //Check whether the user has an active internet connection
  function checkOnlineStatus(){
    status = navigator.onLine;
    return status;
  }

  return {
    init: init,
    measureStep: measureStep,
    sendLog: sendLog,
    checkOnlineStatus: checkOnlineStatus
  };
  
})();
