import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardCardComponent } from './dashboard-card.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('DashboardCardComponent', () => {
  let component: DashboardCardComponent;
  let fixture: ComponentFixture<DashboardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('title', 'Test Card');
    fixture.componentRef.setInput('description', 'Test description');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render title and description', () => {
    fixture.componentRef.setInput('title', 'My Card');
    fixture.componentRef.setInput('description', 'Card description');
    fixture.componentRef.setInput('icon', '📋');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toBe('My Card');
    expect(compiled.querySelector('p')?.textContent).toBe('Card description');
  });

  it('should render icon', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🏖️');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-icon')?.textContent).toBe('🏖️');
  });

  it('should render as link when route is provided and not disabled', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', '/test-route');
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a.action-card');
    expect(link).toBeTruthy();
    // Verify the routerLink directive is present
    const routerLink = link?.getAttribute('ng-reflect-router-link') || link?.getAttribute('href');
    expect(routerLink).toBeTruthy();
  });

  it('should render as div when disabled', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', '/test-route');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const div = compiled.querySelector('div.action-card.disabled');
    expect(div).toBeTruthy();
    expect(compiled.querySelector('a.action-card')).toBeFalsy();
  });

  it('should render as div when route is null', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('div.action-card')).toBeTruthy();
    expect(compiled.querySelector('a.action-card')).toBeFalsy();
  });

  it('should apply custom color to icon', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('color', '#ff0000');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('.card-icon') as HTMLElement;
    expect(icon.style.color).toBe('rgb(255, 0, 0)');
  });

  it('should apply custom class', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('customClass', 'card-hr');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.action-card');
    expect(card?.classList.contains('card-hr')).toBe(true);
  });

  it('should show arrow by default', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', '/test');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.arrow')).toBeTruthy();
  });

  it('should hide arrow when showArrow is false', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', '/test');
    fixture.componentRef.setInput('showArrow', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.arrow')).toBeFalsy();
  });

  it('should render custom action text', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('route', '/test');
    fixture.componentRef.setInput('actionText', 'Ver más');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.action-text')?.textContent).toBe('Ver más');
  });

  it('should show "Próximamente" for disabled cards', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('description', 'Test');
    fixture.componentRef.setInput('icon', '🎯');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.action-text')?.textContent).toBe('Próximamente');
  });
});
