import { strongPasswordValidator } from './password-strengh';

describe('strongPasswordValidator', () => {
  const validator = strongPasswordValidator();

  function makeControl(value: any) {
    return { value } as any;
  }

  it('should return null for a strong password', () => {
    const control = makeControl('Abcdefgh');
    expect(validator(control)).toBeNull();
  });

  it('should return error for password without uppercase', () => {
    const control = makeControl('abcdefgh');
    expect(validator(control)).toEqual({ strongPassword: true });
  });

  it('should return error for short password', () => {
    const control = makeControl('Abc');
    expect(validator(control)).toEqual({ strongPassword: true });
  });

  it('should return null if value is empty', () => {
    const control = makeControl('');
    expect(validator(control)).toBeNull();
  });
});