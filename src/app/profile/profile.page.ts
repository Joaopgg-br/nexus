import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage {

  email: string = '';
  senha: string = '';
  fotoPerfil: string = 'assets/perfil.png';

  constructor(private router: Router) {}

  alterarFoto() {
    // depois pluga aqui um input file ou câmera (Capacitor Camera plugin)
    console.log('Alterar foto de perfil');
  }

  salvarPerfil() {
    console.log('Salvando perfil:', { email: this.email, senha: this.senha });
    // aqui entra a chamada pro seu backend
  }

  irHome() { this.router.navigate(['/dashboard']); }
  abrirCursos() { this.router.navigate(['/courses']); }
  abrirPerfil() { this.router.navigate(['/profile']); }
}
