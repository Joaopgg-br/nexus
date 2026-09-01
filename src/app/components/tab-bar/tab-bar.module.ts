import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { TabBarComponent } from './tab-bar.component';

@NgModule({
  declarations: [TabBarComponent],
  imports: [CommonModule, RouterModule, IonicModule],
  exports: [TabBarComponent],
  
})
export class TabBarModule {}