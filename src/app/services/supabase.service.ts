import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async login(email: string, senha: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password: senha
    });
  }

  async cadastrar(email: string, senha: string) {
    return await this.supabase.auth.signUp({
      email,
      password: senha
    });
  }

  async logout() {
    return await this.supabase.auth.signOut();
  }

  async usuarioAtual() {
    return await this.supabase.auth.getUser();
  }
}