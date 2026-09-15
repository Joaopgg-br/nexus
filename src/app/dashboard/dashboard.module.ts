import { CursosExternosComponent } from '../components/cursos-externos/cursos-externos.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';
import { TabBarModule } from '../components/tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    TabBarModule,
    CursosExternosComponent
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}