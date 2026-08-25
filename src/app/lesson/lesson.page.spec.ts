import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonPage } from './lesson.page';

describe('LessonPage', () => {
  let component: LessonPage;
  let fixture: ComponentFixture<LessonPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
