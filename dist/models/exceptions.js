"use strict";
/************************************************************************
 * Custom exceptions file.
 * Allows for custom exception messages that are specific
 * to the application.
 ***********************************************************************/

/************************************************************************
 * Provides PersistenceServiceNotEnabled error information when thrown.
 * Message|string: The specific error message is set at the location of the error.
 ************************************************************************/
export function PersistenceServiceNotEnabled(message = "") {
  this.message = message;
  this.name = "PersistenceServiceNotEnabled";
}

// The custom exception must be attached to the Error prototype object
// in order to be recognized by the runtime
PersistenceServiceNotEnabled.prototpe = Error.prototype;

/************************************************************************
 * Provides DataServiceUnavailable error information when thrown.
 * Message|string: The specific error message is set at the location of the error.
 ************************************************************************/
export function DataServiceUnavailable(message = "") {
  this.name = "DataServiceUnavailable";
  this.message = message;
}

// The custom exception must be attached to the Error prototype object
// in order to be recognized by the runtime
DataServiceUnavailable.prototype = Error.prototype;
