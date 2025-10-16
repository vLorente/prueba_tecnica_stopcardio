import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RrhhDashboardComponent } from './rrhh-dashboard.component';
import { DashboardCardComponent } from '@shared/components/dashboard-card/dashboard-card.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('RrhhDashboardComponent', () => {
  let component: RrhhDashboardComponent;
  let fixture: ComponentFixture<RrhhDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhDashboardComponent, DashboardCardComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RrhhDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.title');
    expect(title?.textContent).toBe('Administración RRHH');
  });

  it('should display 2 feature cards', () => {
    expect(component.features.length).toBe(2);
  });

  it('should have Aprobación de Vacaciones feature', () => {
    const aprobacionesFeature = component.features.find(f => f.title === 'Aprobación de Vacaciones');
    expect(aprobacionesFeature).toBeDefined();
    expect(aprobacionesFeature?.route).toBe('/rrhh/aprobaciones');
    expect(aprobacionesFeature?.icon).toBe('📋');
    expect(aprobacionesFeature?.color).toBe('#667eea');
  });

  it('should have Gestión de Usuarios feature', () => {
    const usuariosFeature = component.features.find(f => f.title === 'Gestión de Usuarios');
    expect(usuariosFeature).toBeDefined();
    expect(usuariosFeature?.route).toBe('/rrhh/usuarios');
    expect(usuariosFeature?.icon).toBe('👥');
    expect(usuariosFeature?.color).toBe('#48bb78');
  });

  it('should render dashboard cards in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-dashboard-card');
    expect(cards.length).toBe(2);
  });
});
