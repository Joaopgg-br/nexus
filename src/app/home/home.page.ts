    import { Component, OnInit } from '@angular/core';
    import { FormBuilder,FormGroup,Validators } from '@angular/forms';
    import { Router } from '@angular/router';


    type AuthMode='login'|'register';

    type LoginStep='email'|'password';



    @Component({

    selector:'app-home',
    templateUrl:'./home.page.html',
    styleUrls:['./home.page.scss'],
    standalone:false

    })


    export class HomePage implements OnInit{


    mode:AuthMode='login';

    loginStep:LoginStep='email';


    loginForm!:FormGroup;

    registerForm!:FormGroup;


    isLoading=false;



    constructor(
    private fb:FormBuilder,
    private router:Router
    ){}



    ngOnInit(){


    this.loginForm=this.fb.group({

    email:['',[Validators.required,Validators.email]],

    password:['',[Validators.required,Validators.minLength(6)]]

    });



    this.registerForm=this.fb.group({

    name:['',[Validators.required]],

    email:['',[Validators.required,Validators.email]],

    password:['',[Validators.required,Validators.minLength(6)]]

    });


    }



    setMode(mode:AuthMode){

    this.mode=mode;

    this.loginStep='email';

    this.loginForm.reset();

    this.registerForm.reset();

    }




    onLoginNext(){


    let email=this.loginForm.get('email');


    if(email?.valid){

    this.loginStep='password';

    }

    else{

    email?.markAsTouched();

    }


    }





    onLoginSubmit(){


    if(this.loginForm.valid){


    this.isLoading=true;



    setTimeout(()=>{


    this.isLoading=false;


    this.router.navigate(['/dashboard']);


    },1000);



    }



    }



    onRegisterSubmit(){


    if(this.registerForm.valid){


    this.isLoading=true;


    setTimeout(()=>{


    this.isLoading=false;


    this.router.navigate(['/dashboard']);


    },1000);


    }



    }




    hasError(
    form:FormGroup,
    field:string,
    error:string
    ){


    let control=form.get(field);


    return !!(
    control?.hasError(error)
    &&
    control.touched
    );


    }



    }