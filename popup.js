'use strict';
const maxTimestamp = 64060560000 // 4000-01-01 00:00:00
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const defaultContentKey = "defaultContent";
const errorInvalidNumberKey = "errorInvalidNumber";


function initI18n() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((elem) => {
    const msg = elem.getAttribute('data-i18n');
    const text = chrome.i18n.getMessage(msg);
    elem.textContent = text; // Set textContent for other elements
  });
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach((elem) => {
    const msg = elem.getAttribute('data-i18n-placeholder');
    const text = chrome.i18n.getMessage(msg);
    elem.placeholder = text; // Set placeholder specifically for input elements
  });
}



function convertTimestamp() {
  const input = document.getElementById('timestampInput').value;
  var datetimeOutput = document.getElementById('datetimeOutput');

  if (input == "") {
    datetimeOutput.innerText = chrome.i18n.getMessage(defaultContentKey);
    return;
  }
  if (isNaN(input)) {
    document.getElementById('timestampType').innerText = "";
    var timeStampParsed = tryParseDatetime(input) // check if datetime, convert to timestamp(ms)
    if (timeStampParsed > 0) {
      datetimeOutput.innerText = timeStampParsed + " ms"
      return
    }
    datetimeOutput.innerText = chrome.i18n.getMessage(errorInvalidNumberKey);
    return;
  }


  var timestampN = Number(input)
  var timestampType = ""
  if (timestampN >= maxTimestamp * 1e6) {
    timestampN = timestampN / 1000000
    timestampType = "ns"
  } else if (timestampN >= maxTimestamp * 1e3) {
    timestampN = timestampN / 1000
    timestampType = "us"
  } else if (timestampN >= maxTimestamp) {
    timestampN = timestampN
    timestampType = "ms"
  } else {
    timestampN = timestampN * 1000
    timestampType = "s"
  }
  var date = new Date(timestampN);
  const formattedDate = date.toLocaleString('default', { timeZone: userTimezone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  datetimeOutput.innerText = formattedDate;
  document.getElementById('timestampType').innerText = timestampType;

}

function tryParseDatetime(input) {
  input = input.trim();

  // Convert the timestamp string to a timestamp
  const timestamp = new Date(input).getTime();
  if (isNaN(timestamp)) {
    return -1; // Return -1 if the timestamp is invalid
  }

  return timestamp; // Return the timestamp
}

function getCurrentTimestamp() {
  // Update page with local time immediately
  const now = new Date();
  const localTimestamp = now.getTime();
  document.getElementById('timestampInput').value = localTimestamp;
  convertTimestamp(); // Update display immediately to avoid waiting for network request

  // Asynchronously fetch current time from the network
  fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
    .then(response => response.json())
    .then(data => {
      const networkTimestamp = new Date(data.datetime).getTime();
      const diff = Math.abs(networkTimestamp - localTimestamp);

      // If the difference between local time and network time is more than 10 second, update with network time
      if (diff > 1e4) {
        document.getElementById('timestampInput').value = networkTimestamp;
        convertTimestamp(); // Update display again
      }
    })
    .catch(error => {
      console.error('Failed to fetch network time:', error);
      // No additional action needed when network request fails, as local time has already been updated
    });
}

document.addEventListener('DOMContentLoaded', initI18n);

document.getElementById('getCurrentTimestamp').addEventListener('click', getCurrentTimestamp);

document.getElementById('timestampInput').addEventListener('input', convertTimestamp);








document.getElementById('settingsButton').addEventListener('click', function () {
  document.getElementById('settingsOverlay').style.display = 'block';
});

document.getElementById('closeSettings').addEventListener('click', function () {
  document.getElementById('settingsOverlay').style.display = 'none';
});

// Additional logic to handle saving settings goes here
