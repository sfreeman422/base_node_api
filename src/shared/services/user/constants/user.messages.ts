export const passwordDoesNotMeetRequirements = `Password does not meet requirements. Please check that the following is true:
 It contains at least 8 characters.
 It contains at least one digit.
 It contains at least one upper case alphabet.
 It contains at least one lower case alphabet.
 It contains at least one special character which includes !@#$%&*()-+=^.
 It doesn’t contain any white space.`;
export const emailDoesNotMeetRequirements = `Email does not meet requirements. Please ensure your email follows the email@site.tld format.`;
export const unableToValidateUser = 'Unable to validate user. Please try again.';
export const userAlreadyExists = 'This user already exists.';
export const passwordMismatchMessage = 'Passwords do not match!';
export const missingOldPasswordMessage =
  'Missing old password in the request. Old password is required in order to update to new password.';
export const unableToHashPassword = 'Unable to hash password. Please try again.';
export const missingNewPasswordMessage =
  'Missing new password in the request. New password is required in order to update your password.';
export const genericPasswordUpdateFailureMessage = 'Unable to update password.';
export const unableToUpdatePasswordAtThisEndpointMessage =
  'Password cannot be changed via this endpoint. Please use the /password endpoint.';
