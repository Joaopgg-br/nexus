import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [


{
path:'',
redirectTo:'splash',
pathMatch:'full'
},



{
path:'splash',
loadChildren:()=>import('./splash/splash.module')
.then(m=>m.SplashPageModule)

},



{
path:'home',
loadChildren:()=>import('./home/home.module')
.then(m=>m.HomePageModule)

},



{
path:'dashboard',
loadChildren:()=>import('./dashboard/dashboard.module')
.then(m=>m.DashboardPageModule)

},



{
path:'courses',
loadChildren:()=>import('./courses/courses.module')
.then(m=>m.CoursesPageModule)

},



{
path:'profile',
loadChildren:()=>import('./profile/profile.module')
.then(m=>m.ProfilePageModule)

}



];


@NgModule({

imports:[
RouterModule.forRoot(routes)
],

exports:[
RouterModule
]

})


export class AppRoutingModule {}