import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TabBarModule } from '../components/tab-bar/tab-bar.module';
import { CursosExternosComponent } from '../components/cursos-externos/cursos-externos.component';
import { Curso } from '../services/curso';
import { MoodleService } from '../services/moodle.service';
import { SupabaseService } from '../services/supabase.service';

@Component({ selector: 'app-library', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, TabBarModule, CursosExternosComponent],
  templateUrl: './library.page.html', styleUrls: ['./library.page.scss'] })
export class LibraryPage {
  busca = '';
  constructor(public readonly curso: Curso, public readonly moodle: MoodleService, private readonly supabase: SupabaseService) {}
  ionViewWillEnter(): void { void this.moodle.executar('status'); }
  get mostrarNexus(): boolean { return `${this.curso.nome} ${this.curso.categoria} nexus`.toLocaleLowerCase('pt-BR').includes(this.busca.trim().toLocaleLowerCase('pt-BR')); }
  async registrarAcesso(): Promise<void> {
    try { await this.supabase.registrarAtividade({ tipo: 'curso_acessado', titulo: 'Curso acessado', descricao: this.curso.nome, cursoId: this.curso.id }); } catch { /* A abertura do curso permanece disponível se somente o registro de acesso falhar. */ }
  }
}
