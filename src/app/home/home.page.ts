import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

type AuthMode = 'login' | 'register';

type LoginStep = 'email' | 'password';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  mode: AuthMode = 'login';

  loginStep: LoginStep = 'email';

  loginForm!: FormGroup;

  registerForm!: FormGroup;

  isLoading = false;

  errorMessage = '';


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabase: SupabaseService
  ) {}


  ngOnInit() {

    // =========================
    // FORMULÁRIO DE LOGIN
    // =========================

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]

    });


    // =========================
    // FORMULÁRIO DE REGISTRO
    // =========================

    this.registerForm = this.fb.group({

      name: [
        '',
        [
          Validators.required
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]

    });

  }


  // =========================
  // TROCAR LOGIN / REGISTRO
  // =========================

  setMode(mode: AuthMode) {

    this.mode = mode;

    this.loginStep = 'email';

    this.errorMessage = '';

    this.loginForm.reset();

    this.registerForm.reset();

  }


  // =========================
  // PRÓXIMO NO LOGIN
  // =========================

  onLoginNext() {

    const email =
      this.loginForm.get('email');


    if (email?.valid) {

      this.errorMessage = '';

      this.loginStep = 'password';

    } else {

      email?.markAsTouched();

    }

  }


  // =========================
  // LOGIN SUPABASE
  // =========================

  async onLoginSubmit() {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }


    this.isLoading = true;

    this.errorMessage = '';


    const email =
      this.loginForm.get('email')?.value;

    const password =
      this.loginForm.get('password')?.value;


    try {

      const { data, error } =
        await this.supabase.login(
          email,
          password
        );


      if (error) {

        console.error(
          'Erro no login:',
          error
        );

        this.errorMessage =
          this.traduzirErro(error.message);

        return;

      }


      console.log(
        'Login realizado com sucesso:',
        data.user
      );


      // Usuário autenticado
      this.router.navigate([
        '/dashboard'
      ]);

    }

    catch (error) {

      console.error(
        'Erro inesperado:',
        error
      );

      this.errorMessage =
        'Não foi possível realizar o login.';

    }

    finally {

      this.isLoading = false;

    }

  }


  // =========================
  // CADASTRO SUPABASE
  // =========================

  async onRegisterSubmit() {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }


    this.isLoading = true;

    this.errorMessage = '';


    const name =
      this.registerForm.get('name')?.value;

    const email =
      this.registerForm.get('email')?.value;

    const password =
      this.registerForm.get('password')?.value;


    try {

      const { data, error } =
        await this.supabase.cadastrar(
          email,
          password
        );


      if (error) {

        console.error(
          'Erro no cadastro:',
          error
        );

        this.errorMessage =
          this.traduzirErro(error.message);

        return;

      }


      console.log(
        'Cadastro realizado:',
        data.user
      );


      /*
       * Dependendo da configuração do Supabase,
       * o usuário pode precisar confirmar o e-mail.
       */

      if (data.session) {

        this.router.navigate([
          '/dashboard'
        ]);

      } else {

        this.errorMessage =
          'Cadastro realizado! Verifique seu e-mail para confirmar a conta.';

        this.mode = 'login';

        this.loginStep = 'email';

      }

    }

    catch (error) {

      console.error(
        'Erro inesperado:',
        error
      );

      this.errorMessage =
        'Não foi possível criar a conta.';

    }

    finally {

      this.isLoading = false;

    }

  }


  // =========================
  // TRADUZIR ERROS
  // =========================

  traduzirErro(
    erro: string
  ): string {

    if (
      erro.includes(
        'Invalid login credentials'
      )
    ) {

      return 'E-mail ou senha incorretos.';

    }


    if (
      erro.includes(
        'User already registered'
      )
    ) {

      return 'Este e-mail já está cadastrado.';

    }


    if (
      erro.includes(
        'Email not confirmed'
      )
    ) {

      return 'Confirme seu e-mail antes de entrar.';

    }


    if (
      erro.includes(
        'Password should be at least'
      )
    ) {

      return 'A senha precisa ter pelo menos 6 caracteres.';

    }


    return erro;

  }


  // =========================
  // ERROS DO FORMULÁRIO
  // =========================

  hasError(
    form: FormGroup,
    field: string,
    error: string
  ) {

    const control =
      form.get(field);


    return !!(
      control?.hasError(error) &&
      control.touched
    );

  }

}