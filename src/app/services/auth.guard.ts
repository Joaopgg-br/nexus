import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const { data, error } =
      await this.supabase.sessaoAtual();

    if (!error && data.session) {
      return true;
    }

    return this.router.createUrlTree(['/home']);
  }
}
