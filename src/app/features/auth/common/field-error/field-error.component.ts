import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field-error.component.html',
  styleUrl: './field-error.component.scss'
})
export class FieldErrorComponent {

  @Input() control!: AbstractControl | null;
  @Input() submitted = false;
  @Input() label = ''; 

}
