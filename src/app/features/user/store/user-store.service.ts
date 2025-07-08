import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserDTO } from '../models/userDTO';

@Injectable({
  providedIn: 'root',
})
export class UserStoreService {
  private _userConnected$ = new BehaviorSubject<UserDTO>(
    JSON.parse(localStorage.getItem('user') || 'null') || {
      id: 0,
      email: '',
      password: '',
      role: '',
      token: '',
      imgUrl: '',
      description: '',
      age: 0,
    }
  );

  token$ = new BehaviorSubject<string>('');

  getUserConnected$(): BehaviorSubject<UserDTO> {
    return this._userConnected$;
  }

  setUserConnected(user: UserDTO): void {
    this._userConnected$.next(user);
  }

  getUserId(): number {
    return this._userConnected$.value?.id ?? null;
  }
}
