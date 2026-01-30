/**
 * PropTypes definitions for Bill Folder Tracker component
 */

import PropTypes from "prop-types";

export const BillFolderTrackerPropTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export const FileObjectPropTypes = {
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  extension: PropTypes.string,
  size: PropTypes.number.isRequired,
  createdDate: PropTypes.string,
  modifiedDate: PropTypes.string.isRequired,
  folder: PropTypes.string,
  folderPath: PropTypes.string,
};

export const TrackingDataPropTypes = {
  sentMonth: PropTypes.string,
  billMonth: PropTypes.string,
  sentAt: PropTypes.string,
  gstSubmittedPath: PropTypes.string,
};

export const ConfigurationPropTypes = {
  folderPath: PropTypes.string.isRequired,
  selectedSubfolders: PropTypes.arrayOf(PropTypes.string),
  ignoredSubfolders: PropTypes.arrayOf(PropTypes.string),
  ignoredFiles: PropTypes.arrayOf(PropTypes.string),
  gstSubmittedFolderPath: PropTypes.string,
  settings: PropTypes.object,
  reminders: PropTypes.arrayOf(PropTypes.object),
  tags: PropTypes.object,
  configuredAt: PropTypes.string,
};

export const SettingsPropTypes = {
  theme: PropTypes.oneOf(["light", "dark"]),
  defaultSentMonth: PropTypes.oneOf(["current", "bill"]),
  autoExpandFolders: PropTypes.bool,
  showFileSize: PropTypes.bool,
  showModifiedDate: PropTypes.bool,
  showBillMonth: PropTypes.bool,
  showSentMonth: PropTypes.bool,
  notifications: PropTypes.bool,
  reminderDays: PropTypes.number,
  autoSyncGst: PropTypes.bool,
  syncInterval: PropTypes.number,
};
