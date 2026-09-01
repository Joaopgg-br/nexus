import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
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
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly supabase: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    this.criarFormularios();

    const { data } = await this.supabase.sessaoAtual();

    if (data.session) {
      await this.router.navigate(
        ['/dashboard'],
        { replaceUrl: true }
      );
    }
  }

  private criarFormularios(): void {
    this.loginForm = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.email]
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: [
        '',
        [Validators.required, Validators.email]
      ],
      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ]
    });
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.loginStep = 'email';
    this.errorMessage = '';
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onLoginNext(): void {
    const email = this.loginForm.get('email');

    if (email?.valid) {
      this.errorMessage = '';
      this.loginStep = 'password';
      return;
    }

    email?.markAsTouched();
  }

  async onLoginSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } =
      this.loginForm.getRawValue();

    try {
      const { error } = await this.supabase.login(
        email,
        password
      );

      if (error) {
        this.errorMessage =
          this.traduzirErro(error.message);
        return;
      }

      await this.router.navigate(
        ['/dashboard'],
        { replaceUrl: true }
      );
    } catch {
      this.errorMessage =
        'Não foi possível realizar o login.';
    } finally {
      this.isLoading = false;
    }
  }

  async onRegisterSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { name, email, password } =
      this.registerForm.getRawValue();

    try {
      const { data, error } =
        await this.supabase.cadastrar(
          email,
          password,
          name
        );

      if (error) {
        this.errorMessage =
          this.traduzirErro(error.message);
        return;
      }

      if (data.session) {
        await this.router.navigate(
          ['/dashboard'],
          { replaceUrl: true }
        );
        return;
      }

      this.errorMessage =
        'Cadastro realizado! Verifique seu e-mail para confirmar a conta.';
      this.mode = 'login';
      this.loginStep = 'email';
    } catch {
      this.errorMessage =
        'Não foi possível criar a conta.';
    } finally {
      this.isLoading = false;
    }
  }

  traduzirErro(erro: string): string {
    if (erro.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }

    if (erro.includes('User already registered')) {
      return 'Este e-mail já está cadastrado.';
    }

    if (erro.includes('Email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar.';
    }

    if (erro.includes('Password should be at least')) {
      return 'A senha precisa ter pelo menos 6 caracteres.';
    }

    return erro;
  }

  hasError(
    form: FormGroup,
    field: string,
    error: string
  ): boolean {
    const control = form.get(field);

    return !!(
      control?.hasError(error) &&
      control.touched
    );
  }
}
