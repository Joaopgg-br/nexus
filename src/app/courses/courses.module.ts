import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CoursesPageRoutingModule } from './courses-routing.module';
import { CoursesPage } from './courses.page';
import { TabBarModule } from '../components/tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoursesPageRoutingModule,
    TabBarModule
  ],
  declarations: [CoursesPage]
})
export class CoursesPageModule {}
