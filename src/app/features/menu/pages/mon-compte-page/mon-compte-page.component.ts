import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-mon-compte-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mon-compte-page.component.html',
  styleUrls: ['./mon-compte-page.component.scss'],
})
export class MonComptePageComponent {}
