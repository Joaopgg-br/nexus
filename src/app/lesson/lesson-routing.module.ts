import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LessonPage } from './lesson.page';

const routes: Routes = [
  {
    path: ':aulaIndex',
    component: LessonPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LessonPageRoutingModule {}