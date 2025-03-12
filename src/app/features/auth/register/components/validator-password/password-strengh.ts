import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const PASSWORD_MIN_LENGTH = 8;

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const hasUppercase = /[A-Z]/.test(control.value);
    const isLongEnough = control.value.length >= PASSWORD_MIN_LENGTH;

    if (!hasUppercase || !isLongEnough) {
      return { strongPassword: true };
    }

    return null;
  };
}
