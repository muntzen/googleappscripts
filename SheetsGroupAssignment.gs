/**
 * NOTE: You must be a Super Admin in the Google Domain to run this script, and you must enable 
 *  the AdminDirectory API to make this script work. See the documentation here:
 *  https://developers.google.com/apps-script/advanced/admin-sdk-directory
 *
 * This Apps Script makes it easier to manage Google Group membership in a Google Domain with a spreadsheet
 * Currently this is setup to look for two sheets, one defined by the "peopleSheetName" global with data 
 * that looks like this:
 * | Name | email | type | role | ... whatever else in these cols ....
 * | Name | email | type | role | ... whatever else in these cols ....
 * ...
 *
 * And a sheet with the Groups listed by types/roles that looks like this....
 * | email | type or role |
 * | email | type or role |
 * ...
 *
 * In the sheet with the Group email aliases if the "type or role" column is empty it will add that email
 * to every email address. Otherwise, if the type or role column appears in either the type or role column
 * of the corresponding sheet, the person will be added to the group identified with the email in the first
 * column.
 * 
 */

var peopleSheetName = "Eric Test";
var settingsSheetName = "Aliases Test";

/**
 * Make sure all of the people are added to the right Google Groups, thus getting them added to the email aliases
 */
function addToGroups() {
  var settingsSheet = SpreadsheetApp.getActive().getSheetByName(settingsSheetName);
  var settingsData = settingsSheet.getDataRange().getValues();
  var allStaff = [];
  var typesToEmails = [];
  
  for(var i = 0; i < settingsData.length; i++) {
    var groupEmail = settingsData[i][0].trim();
    var typeVals = settingsData[i][1].split(',');
    
    // if empty types, put it into the allStaff array
    if (typeVals.length == 0 || (typeVals.length == 1 && typeVals[0].trim() == "")) {
      allStaff[allStaff.length] = groupEmail;
    } else { // otherwise, add it to the array by the type
      for(var j = 0; j < typeVals.length; j++) {
        var type = typeVals[j].trim();
        if (!typesToEmails[type]) {
          typesToEmails[type] = new Array();
        }
        typesToEmails[type][typesToEmails[type].length] = groupEmail;
      }
    }
  }
  
  // now iterate through the people and by their types add them to the proper aliases
  var peopleSheet = SpreadsheetApp.getActive().getSheetByName(peopleSheetName);
  var peopleData = peopleSheet.getDataRange().getValues();
  for (var i = 0; i < peopleData.length; i++) {
    var userEmail = peopleData[i][1];
    var member = {
      email: userEmail,
      role: 'MEMBER'
    };
    
    for(var j = 0; j < allStaff.length; j++) {
      addMemberToGroup(member, allStaff[j]);
    }
    
    var memberTypes = [peopleData[i][2], peopleData[i][3]];
    for(var j = 0; j < memberTypes.length; j++) {
      var memberType = memberTypes[j];
      var typeEmails = typesToEmails[memberType];
      if (!typeEmails) { // no guarantee a specific type has any aliases associated with it
        continue;
      }
      for(var k = 0; k < typeEmails.length; k++) {
        var groupEmail = typeEmails[k];
        addMemberToGroup(member, groupEmail);
      }
    }
  }
}

/**
 * Adds a member record to a specific group
 */
function addMemberToGroup(member, groupEmail) {
  try {
    member = AdminDirectory.Members.insert(member, groupEmail);
    Logger.log('User %s added as a member of group %s.', member['email'], groupEmail); 
  } catch(error) {
    Logger.log(error);
  }
}
