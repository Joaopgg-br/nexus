import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadChildren: () =>
      import('./splash/splash.module').then(
        m => m.SplashPageModule
      )
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(
        m => m.HomePageModule
      )
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(
        m => m.DashboardPageModule
      )
  },
  {
    path: 'courses',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./courses/courses.module').then(
        m => m.CoursesPageModule
      )
  },
  {
    path: 'quiz',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./quiz/quiz.module').then(
        m => m.QuizPageModule
      )
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./profile/profile.module').then(
        m => m.ProfilePageModule
      )
  },
  {
    path: 'lesson',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./lesson/lesson.module').then(
        m => m.LessonPageModule
      )
  },
  {
    path: 'activities',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./activities/activities.module').then(
        m => m.ActivitiesPageModule
      )
  },
  {
    path: '**',
    redirectTo: 'splash'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
