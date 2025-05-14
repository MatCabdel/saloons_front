import { Component, inject, Input, OnInit } from '@angular/core';
import { Saloon } from '../../models/saloonModel';
import { User } from 'src/app/features/user/models/user';
import { Observable } from 'rxjs';
import { SaloonApiService } from '../../services/saloon-api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-saloon-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saloon-card.component.html',
  styleUrl: './saloon-card.component.scss',
})
export class SaloonCardComponent implements OnInit {
  @Input() saloon!: Saloon;

  usersInSaloon$!: Observable<User[]>;

  private _saloonApi = inject(SaloonApiService)

  ngOnInit(): void {
    this.usersInSaloon$ = this._saloonApi.getUsersInSaloon(this.saloon.id.toString());
  }
}
