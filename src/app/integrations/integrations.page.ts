import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TabBarModule } from '../components/tab-bar/tab-bar.module';
import { CursosExternosComponent } from '../components/cursos-externos/cursos-externos.component';
import { MoodleService } from '../services/moodle.service';

@Component({ selector: 'app-integrations', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, TabBarModule, CursosExternosComponent],
  templateUrl: './integrations.page.html', styleUrls: ['./integrations.page.scss'] })
export class IntegrationsPage {
  token = '';
  confirmarDesconexao = false;
  constructor(public readonly moodle: MoodleService) {}
  ionViewWillEnter(): void { this.token = ''; this.confirmarDesconexao = false; void this.moodle.executar('status'); }
  ionViewWillLeave(): void { this.token = ''; this.confirmarDesconexao = false; }
  async conectar(): Promise<void> {
    const token = this.token.trim(); this.token = '';
    await this.moodle.executar('connect', token);
  }
  async desconectar(): Promise<void> {
    await this.moodle.executar('disconnect'); this.confirmarDesconexao = false;
  }
}
