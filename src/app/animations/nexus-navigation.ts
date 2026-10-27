import { Animation, createAnimation } from '@ionic/angular';

/** Short entrance on every Ionic navigation, including cached pages. */
export function nexusNavigation(_baseEl: HTMLElement, opts?: { enteringEl?: HTMLElement }): Animation {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animation = createAnimation().duration(reducedMotion ? 0 : 260).easing('cubic-bezier(0.22, 1, 0.36, 1)');
  if (opts?.enteringEl) {
    animation.addAnimation(createAnimation().addElement(opts.enteringEl).fill('both').beforeRemoveClass('ion-page-invisible')
      .fromTo('opacity', '0', '1')
      .fromTo('transform', reducedMotion ? 'none' : 'translateY(12px)', 'none'));
  }
  return animation;
}
