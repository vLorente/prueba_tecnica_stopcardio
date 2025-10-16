import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CorrectionDetailModalComponent } from './correction-detail-modal.component';
import type { Fichaje } from '@core/models/fichaje.model';

describe('CorrectionDetailModalComponent', () => {
  let component: CorrectionDetailModalComponent;
  let fixture: ComponentFixture<CorrectionDetailModalComponent>;

  const mockFichaje: Fichaje = {
    id: 1,
    userId: 2,
    userEmail: 'user@example.com',
    userFullName: 'Test User',
    checkIn: new Date(2025, 9, 16, 8, 0, 0),
    checkOut: new Date(2025, 9, 16, 17, 0, 0),
    hoursWorked: 9.0,
    status: 'pending_correction',
    notes: null,
    correctionReason: 'Olvidé fichar a la hora correcta',
    correctionRequestedAt: new Date(2025, 9, 16, 18, 0, 0),
    proposedCheckIn: new Date(2025, 9, 16, 8, 30, 0),
    proposedCheckOut: new Date(2025, 9, 16, 17, 30, 0),
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
    createdAt: new Date(2025, 9, 16, 8, 0, 0),
    updatedAt: new Date(2025, 9, 16, 18, 0, 0)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorrectionDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CorrectionDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fichaje', mockFichaje);
    fixture.componentRef.setInput('isOpen', true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when onClose is called', () => {
    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    component.onClose();

    expect(closeEmitted).toBe(true);
  });

  it('should format date correctly', () => {
    const date = new Date(2025, 9, 16, 14, 30, 0);
    const formatted = component.formatDate(date);

    expect(formatted).toContain('16');
    expect(formatted).toContain('10');
    expect(formatted).toContain('2025');
    expect(formatted).toContain('14:30');
  });

  it('should return N/A for null date', () => {
    const formatted = component.formatDate(null);
    expect(formatted).toBe('N/A');
  });

  it('should calculate hours correctly', () => {
    const checkIn = new Date(2025, 9, 16, 8, 0, 0);
    const checkOut = new Date(2025, 9, 16, 17, 0, 0);

    const hours = component.calculateHours(checkIn, checkOut);
    expect(hours).toBe('9.00h');
  });

  it('should return "Incompleto" for incomplete fichaje', () => {
    const checkIn = new Date(2025, 9, 16, 8, 0, 0);

    const hours = component.calculateHours(checkIn, null);
    expect(hours).toBe('Incompleto');
  });

  it('should return correct status label for pending_correction', () => {
    const label = component.getStatusLabel('pending_correction');
    expect(label).toBe('Pendiente');
  });

  it('should return correct status label for corrected', () => {
    const label = component.getStatusLabel('corrected');
    expect(label).toBe('Aprobada');
  });

  it('should return correct status label for rejected', () => {
    const label = component.getStatusLabel('rejected');
    expect(label).toBe('Rechazada');
  });

  it('should return correct status label for valid', () => {
    const label = component.getStatusLabel('valid');
    expect(label).toBe('Válido');
  });

  it('should display modal when isOpen is true', () => {
    fixture.detectChanges();

    const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalOverlay).toBeTruthy();
  });

  it('should not display modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });

  it('should display fichaje information', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test User');
    expect(compiled.textContent).toContain('user@example.com');
    expect(compiled.textContent).toContain('Olvidé fichar a la hora correcta');
  });

  it('should display approval notes when present', () => {
    const fichajeWithNotes: Fichaje = {
      ...mockFichaje,
      status: 'corrected',
      approvalNotes: 'Aprobado correctamente',
      approvedAt: new Date(2025, 9, 17, 10, 0, 0)
    };

    fixture.componentRef.setInput('fichaje', fichajeWithNotes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Aprobado correctamente');
    expect(compiled.textContent).toContain('Comentarios de Aprobación');
  });

  it('should not display approval notes section when not present', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Comentarios de Aprobación');
    expect(compiled.textContent).not.toContain('Motivo de Rechazo');
  });
});
