import { Component, OnInit } from '@angular/core';

import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  email: string = '';

  senha: string = '';

  fotoPerfil: string = 'assets/perfil.png';

  constructor(
    private supabase: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {

    const { data, error } =
      await this.supabase.usuarioAtual();

    if (error) {
      console.error(
        'Não foi possível carregar o usuário:',
        error
      );
      return;
    }

    this.email = data.user?.email ?? '';

  }

  alterarFoto(): void {

    console.log(
      'A seleção de uma nova foto ainda precisa ser configurada.'
    );

  }

  salvarPerfil(): void {

    console.log(
      'Dados do perfil prontos para serem salvos.'
    );

  }

}
