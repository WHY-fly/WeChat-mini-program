const { emergencyContacts, autoCallContactKey } = require("../config/emergency");

const CONTACT_STORAGE_KEY = "wenchuan-emergency-contacts";
const PRIMARY_STORAGE_KEY = "wenchuan-emergency-primary";

function cloneContact(contact) {
  return {
    key: contact.key,
    label: contact.label,
    phone: contact.phone,
    description: contact.description
  };
}

function getDefaultContacts() {
  return emergencyContacts.map(cloneContact);
}

function getStoredContacts() {
  try {
    const storedContacts = wx.getStorageSync(CONTACT_STORAGE_KEY);
    return Array.isArray(storedContacts) ? storedContacts : [];
  } catch (error) {
    return [];
  }
}

function getStoredPrimaryKey() {
  try {
    return wx.getStorageSync(PRIMARY_STORAGE_KEY) || autoCallContactKey;
  } catch (error) {
    return autoCallContactKey;
  }
}

function resolvePrimaryKey(contacts, preferredKey) {
  const editableContacts = contacts.filter((contact) => contact.key !== "emergency120");

  if (!editableContacts.length) {
    return autoCallContactKey;
  }

  if (editableContacts.some((contact) => contact.key === preferredKey)) {
    return preferredKey;
  }

  if (editableContacts.some((contact) => contact.key === autoCallContactKey)) {
    return autoCallContactKey;
  }

  return editableContacts[0].key;
}

function loadEmergencyState() {
  const defaultContacts = getDefaultContacts();
  const storedMap = {};

  getStoredContacts().forEach((contact) => {
    if (contact && contact.key) {
      storedMap[contact.key] = contact;
    }
  });

  const contacts = defaultContacts.map((contact) => ({
    ...contact,
    ...(storedMap[contact.key] || {})
  }));

  const primaryKey = resolvePrimaryKey(contacts, getStoredPrimaryKey());

  return {
    contacts: contacts.map((contact) => ({
      ...contact,
      isPrimary: contact.key === primaryKey
    })),
    primaryKey
  };
}

function saveEmergencyState(contacts, primaryKey) {
  const plainContacts = contacts.map(cloneContact);
  const nextPrimaryKey = resolvePrimaryKey(plainContacts, primaryKey);

  wx.setStorageSync(CONTACT_STORAGE_KEY, plainContacts);
  wx.setStorageSync(PRIMARY_STORAGE_KEY, nextPrimaryKey);

  return {
    contacts: plainContacts.map((contact) => ({
      ...contact,
      isPrimary: contact.key === nextPrimaryKey
    })),
    primaryKey: nextPrimaryKey
  };
}

function saveContactSettings(contactKey, contactFields, isPrimary) {
  const currentState = loadEmergencyState();
  const contacts = currentState.contacts.map((contact) => {
    if (contact.key !== contactKey) {
      return cloneContact(contact);
    }

    return {
      ...cloneContact(contact),
      ...contactFields
    };
  });

  let nextPrimaryKey = currentState.primaryKey;

  if (contactKey !== "emergency120") {
    if (isPrimary) {
      nextPrimaryKey = contactKey;
    } else if (currentState.primaryKey === contactKey) {
      nextPrimaryKey = resolvePrimaryKey(
        contacts,
        contacts.find((contact) => contact.key !== contactKey && contact.key !== "emergency120")?.key
      );
    }
  }

  return saveEmergencyState(contacts, nextPrimaryKey);
}

module.exports = {
  loadEmergencyState,
  saveContactSettings
};
