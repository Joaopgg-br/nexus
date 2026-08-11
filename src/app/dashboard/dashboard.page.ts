import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements AfterViewInit {

  @ViewChild('coursesScroll') coursesScroll!: ElementRef;

  termoBusca: string = '';

  constructor(private router: Router) {}

  ngAfterViewInit() {
    const el = this.coursesScroll?.nativeElement;
    if (!el) return;

    // Drag com mouse (desktop)
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    el.addEventListener('mousedown', (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => isDown = false);
    el.addEventListener('mouseup', () => isDown = false);
    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX);
    });
  }

  irHome() { this.router.navigate(['/dashboard']); }

  abrirCursos() {
    this.router.navigate(['/courses'], {
      queryParams: { busca: this.termoBusca || '' }
    });
  }

  abrirPerfil() { this.router.navigate(['/profile']); }
}