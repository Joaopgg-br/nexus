import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: false
})
export class SplashPage implements OnInit, OnDestroy {
  leaving = false;
  private destination = '/home';
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  constructor(
    private readonly router: Router,
    private readonly supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    // Resolve the session during the animation, without delaying the splash.
    void this.supabase.sessaoAtual().then(({ data, error }) => {
      if (!this.destroyed && !this.leaving && !error && data.session) {
        this.destination = '/dashboard';
      }
    }).catch(() => {
      // Login remains available when the saved session cannot be restored.
    });

    // 2.3 seconds for the entrance, then 300 ms for the exit fade.
    this.timer = setTimeout(() => {
      this.leaving = true;
      this.timer = setTimeout(() => {
        void this.router.navigateByUrl(this.destination, { replaceUrl: true });
      }, 300);
    }, 2300);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.timer);
  }
}
