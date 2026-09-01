import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false
})
export class SplashPage implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    await new Promise(resolve =>
      setTimeout(resolve, 1200)
    );

    const { data } = await this.supabase.sessaoAtual();
    const destino =
      data.session ? '/dashboard' : '/home';

    await this.router.navigateByUrl(
      destino,
      { replaceUrl: true }
    );
  }
}
