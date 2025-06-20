import {
  passwordMismatchMessage,
  passwordDoesNotMeetRequirements,
  emailDoesNotMeetRequirements,
} from '../services/user/constants/user.messages';

export const invalidPasswordMessage = 'Password does not match. Please try again.';
export const invalidEmailMessage = 'The provided email address is invalid. Please try again.';
export const unableToFindUser = 'Unable to find user. Please try again.';
export const missingFieldsMessage = 'Please provide all required fields.';
export const unexpectedError = 'An unexpected error occurred.';
export const unableToCreateTokenMessage = 'Unable to create a new token.';
export const badRequestMessage = 'Bad request, please try again.';
export const badRequestMessages = [
  invalidPasswordMessage,
  invalidEmailMessage,
  unableToFindUser,
  passwordMismatchMessage,
  missingFieldsMessage,
  passwordDoesNotMeetRequirements,
  emailDoesNotMeetRequirements,
  badRequestMessage,
];
