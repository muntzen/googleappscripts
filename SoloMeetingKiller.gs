/**
 *
 * A litle script that'll examine your calendar entries and see if there are any where you're the only
 * attendee. If you are, it'll email you to let you know you might want to delete it. Configurable 
 * with global horrible things at the moment, while I'm hackering.
 *
 */



/**
 * Global horrible things
 */
var timeAhead = 3600;// an hour in advance
var calendar = CalendarApp.getDefaultCalendar();

/**
 * Main entry point
 */
function nukeSoloEvents() {
  var startTime = new Date();
  var endTime = new Date((new Date()).getTime() + (timeAhead*1000));
  var events = calendar.getEvents(startTime, endTime);
  if (events.length > 0) {
    for (var i = 0; i < events.length; i++) {
      if (onlyYouAttending(events[i])) {
        notifyOfEmpty(events[i]);
      }
    }
  }
}

/**
 * Checks to see if the meeting had non-you attendees. If there are any, yet there are no attendees who've said yes, 
 * it's probably a dead meeting
 */
function onlyYouAttending(event) {
  var othersInvited = 0;
  var guestList = event.getGuestList(true);
  for (var i = 0; i < guestList.length; i++) {
    if (guestList[i].getEmail() == Session.getActiveUser().getEmail()) {
      continue;
    }
    othersInvited++;
    if (guestList[i].getGuestStatus() == CalendarApp.GuestStatus.YES) {
      return false;
    }
  }
  return othersInvited > 0;
}

/**
 * Prompts the user to delete a given event and does it if the user says they want it done
 */
function notifyOfEmpty(event) {
  // thanks to stackoverflow user here: http://stackoverflow.com/questions/10553846/get-link-url-to-an-calendar-event-in-google-apps-script
  var splitEventId = event.getId().split('@');
  var eventURL = "https://calendar.google.com/calendar/event?eid=" + Utilities.base64Encode(splitEventId[0] + " " + event.getOriginalCalendarId());
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "Meeting potentially empty", "Hey, your meeting '" + event.getTitle() + "' might be empty. You can view it and cancel it here: "+ eventURL);
}
