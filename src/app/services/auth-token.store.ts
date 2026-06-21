import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  private readonly _token = signal<string | null>(null);
  private readonly _tokenType = signal<string>('Bearer');

  readonly token = this._token.asReadonly();

  set(token: string, type: string): void {
    this._token.set(token);
    this._tokenType.set(type);
  }

  clear(): void {
    this._token.set(null);
  }

  authorizationHeader(): string | null {
    const token = this._token();
    return token ? `${this._tokenType()} ${token}` : null;
  }
}
