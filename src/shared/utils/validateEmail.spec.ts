import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  describe('valid email addresses', () => {
    it('should return true for standard email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user@domain.org')).toBe(true);
      expect(validateEmail('admin@site.net')).toBe(true);
    });

    it('should return true for emails with subdomains', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
      expect(validateEmail('test@subdomain.domain.co.uk')).toBe(true);
      expect(validateEmail('admin@deep.sub.domain.org')).toBe(true);
    });

    it('should return true for emails with numbers in domain', () => {
      expect(validateEmail('user@domain123.com')).toBe(true);
      expect(validateEmail('test@123domain.org')).toBe(true);
      expect(validateEmail('admin@domain-123.net')).toBe(true);
    });

    it('should return true for emails with hyphens in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBe(true);
      expect(validateEmail('test@sub-domain.example.org')).toBe(true);
      expect(validateEmail('admin@multi-word-domain.net')).toBe(true);
    });

    it('should return true for emails with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('test.user.123@example.net')).toBe(true);
    });

    it('should return true for emails with numbers in local part', () => {
      expect(validateEmail('user123@example.com')).toBe(true);
      expect(validateEmail('123user@domain.org')).toBe(true);
      expect(validateEmail('test456user@example.net')).toBe(true);
    });

    it('should return true for emails with special characters in local part', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user_name@domain.org')).toBe(true);
      expect(validateEmail('user-name@example.net')).toBe(true);
    });

    it('should return true for emails with quoted local part', () => {
      expect(validateEmail('"user name"@example.com')).toBe(true);
      expect(validateEmail('"test.user"@domain.org')).toBe(true);
      expect(validateEmail('"special chars!"@example.net')).toBe(true);
    });

    it('should return true for international domain extensions', () => {
      expect(validateEmail('user@example.co.uk')).toBe(true);
      expect(validateEmail('test@domain.com.au')).toBe(true);
      expect(validateEmail('admin@site.gov.ca')).toBe(true);
    });

    it('should return true for single character local part', () => {
      expect(validateEmail('a@example.com')).toBe(true);
      expect(validateEmail('x@domain.org')).toBe(true);
    });

    it('should return true for long valid emails', () => {
      const longLocalPart = 'a'.repeat(64);
      expect(validateEmail(`${longLocalPart}@example.com`)).toBe(true);
      expect(validateEmail('user@very-long-domain-name-that-is-still-valid.com')).toBe(true);
    });
  });

  describe('invalid email addresses', () => {
    it('should return false for empty or null input', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(' ')).toBe(false);
    });

    it('should return false for emails missing @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
      expect(validateEmail('test.domain.org')).toBe(false);
      expect(validateEmail('adminsample.net')).toBe(false);
    });

    it('should return false for emails with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
      expect(validateEmail('test@domain@example.org')).toBe(false);
      expect(validateEmail('admin@site@domain.net')).toBe(false);
    });

    it('should return false for emails missing local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('@domain.org')).toBe(false);
      expect(validateEmail('@.com')).toBe(false);
    });

    it('should return false for emails missing domain', () => {
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('test@.')).toBe(false);
      expect(validateEmail('admin@.com')).toBe(false);
    });

    it('should return false for emails with invalid domain format', () => {
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('test@.domain.com')).toBe(false);
      expect(validateEmail('admin@domain.')).toBe(false);
      expect(validateEmail('user@domain..com')).toBe(false);
    });

    it('should return false for emails with spaces', () => {
      expect(validateEmail('user name@example.com')).toBe(false);
      expect(validateEmail('user@example .com')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('user@ example.com')).toBe(false);
    });

    it('should return false for emails with invalid special characters', () => {
      expect(validateEmail('user<>@example.com')).toBe(false);
      expect(validateEmail('user()@example.com')).toBe(false);
      expect(validateEmail('user[]@example.com')).toBe(false);
      expect(validateEmail('user\\@example.com')).toBe(false);
      expect(validateEmail('user,@example.com')).toBe(false);
      expect(validateEmail('user;@example.com')).toBe(false);
      expect(validateEmail('user:@example.com')).toBe(false);
    });

    it('should return false for emails starting or ending with dots', () => {
      expect(validateEmail('.user@example.com')).toBe(false);
      expect(validateEmail('user.@example.com')).toBe(false);
      expect(validateEmail('us..er@example.com')).toBe(false);
    });

    it('should return false for invalid IP addresses', () => {
      expect(validateEmail('user@[256.1.1.1]')).toBe(false);
      expect(validateEmail('user@[192.168.1]')).toBe(false);
      expect(validateEmail('user@[192.168.1.1.1]')).toBe(false);
      expect(validateEmail('user@[abc.def.ghi.jkl]')).toBe(false);
    });

    it('should return false for IP addresses and malformed brackets', () => {
      expect(validateEmail('user@[192.168.1.1]')).toBe(false);
      expect(validateEmail('test@[10.0.0.1]')).toBe(false);
      expect(validateEmail('admin@[255.255.255.255]')).toBe(false);
      expect(validateEmail('user@[256.1.1.1]')).toBe(false);
      expect(validateEmail('user@[192.168.1]')).toBe(false);
      expect(validateEmail('user@[192.168.1.1.1]')).toBe(false);
      expect(validateEmail('user@[abc.def.ghi.jkl]')).toBe(false);
    });

    it('should return false for domains with invalid characters', () => {
      expect(validateEmail('user@domain$.com')).toBe(false);
      expect(validateEmail('user@domain#.com')).toBe(false);
      expect(validateEmail('user@domain%.com')).toBe(false);
      expect(validateEmail('user@domain&.com')).toBe(false);
    });

    it('should return false for incomplete domain extensions', () => {
      expect(validateEmail('user@domain.c')).toBe(false);
      expect(validateEmail('user@domain.1')).toBe(false);
    });

    it('should return false for domains starting or ending with hyphens', () => {
      expect(validateEmail('user@-domain.com')).toBe(false);
      expect(validateEmail('user@domain-.com')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined input gracefully', () => {
      expect(() => validateEmail(undefined as unknown as string)).not.toThrow();
      expect(validateEmail(undefined as unknown as string)).toBe(false);
    });

    it('should handle null input gracefully', () => {
      expect(() => validateEmail(null as unknown as string)).not.toThrow();
      expect(validateEmail(null as unknown as string)).toBe(false);
    });

    it('should handle non-string input gracefully', () => {
      expect(validateEmail(123 as unknown as string)).toBe(false);
      expect(validateEmail({} as unknown as string)).toBe(false);
      expect(validateEmail([] as unknown as string)).toBe(false);
      expect(validateEmail(true as unknown as string)).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateEmail('USER@EXAMPLE.COM')).toBe(true);
      expect(validateEmail('User@Example.Com')).toBe(true);
      expect(validateEmail('user@EXAMPLE.com')).toBe(true);
    });

    it('should handle emails with mixed case and special characters', () => {
      expect(validateEmail('User.Name+Tag@Example-Domain.Co.UK')).toBe(true);
      expect(validateEmail('TEST123@sub-domain.EXAMPLE.ORG')).toBe(true);
    });
  });

  describe('real-world email examples', () => {
    it('should validate common email providers', () => {
      expect(validateEmail('user@gmail.com')).toBe(true);
      expect(validateEmail('test@yahoo.com')).toBe(true);
      expect(validateEmail('admin@outlook.com')).toBe(true);
      expect(validateEmail('support@hotmail.com')).toBe(true);
      expect(validateEmail('contact@protonmail.com')).toBe(true);
    });

    it('should validate business email formats', () => {
      expect(validateEmail('john.doe@company.com')).toBe(true);
      expect(validateEmail('support@help.company.co.uk')).toBe(true);
      expect(validateEmail('sales@international-business.org')).toBe(true);
      expect(validateEmail('noreply@automated-system.net')).toBe(true);
    });

    it('should validate academic email formats', () => {
      expect(validateEmail('student@university.edu')).toBe(true);
      expect(validateEmail('professor@college.ac.uk')).toBe(true);
      expect(validateEmail('research@institute.edu.au')).toBe(true);
    });
  });
});
