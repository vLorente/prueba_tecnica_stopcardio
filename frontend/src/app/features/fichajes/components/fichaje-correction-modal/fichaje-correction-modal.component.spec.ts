import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FichajeCorrectionModalComponent } from './fichaje-correction-modal.component';
import type { Fichaje } from '@core/models/fichaje.model';

describe('FichajeCorrectionModalComponent', () => {
  let component: FichajeCorrectionModalComponent;
  let fixture: ComponentFixture<FichajeCorrectionModalComponent>;

  const mockFichaje: Fichaje = {
    id: 1,
    userId: 1,
    userEmail: 'test@example.com',
    userFullName: 'Test User',
    checkIn: new Date(2025, 9, 16, 8, 0, 0),
    checkOut: new Date(2025, 9, 16, 17, 0, 0),
    hoursWorked: 9.0,
    status: 'valid',
    notes: null,
    correctionReason: null,
    correctionRequestedAt: null,
    proposedCheckIn: null,
    proposedCheckOut: null,
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
    createdAt: new Date(2025, 9, 16, 8, 0, 0),
    updatedAt: new Date(2025, 9, 16, 17, 0, 0)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FichajeCorrectionModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FichajeCorrectionModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fichaje', mockFichaje);
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with fichaje data when opened', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const formValue = component.correctionForm.value;
    expect(formValue.checkInDate).toBeDefined();
    expect(formValue.checkInTime).toBeDefined();
    expect(formValue.checkOutDate).toBeDefined();
    expect(formValue.checkOutTime).toBeDefined();
  });

  it('should show modal when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(overlay.classList.contains('active')).toBe(true);
  });

  it('should hide modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('should emit close event when close button is clicked', () => {
    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.close-button');
    closeButton.click();

    expect(closeEmitted).toBe(true);
  });

  it('should emit close event when overlay is clicked', () => {
    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();

    expect(closeEmitted).toBe(true);
  });

  it('should not emit close when modal container is clicked', () => {
    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.modal-container');
    const event = new Event('click');
    container.dispatchEvent(event);

    expect(closeEmitted).toBe(false);
  });

  it('should validate required fields', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.correctionForm.patchValue({
      checkInDate: '',
      checkInTime: '',
      correctionReason: ''
    });

    expect(component.correctionForm.valid).toBe(false);
    expect(component.canSubmit()).toBe(false);
  });

  it('should validate correction reason min length', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.correctionForm.patchValue({
      checkInDate: '2025-10-16',
      checkInTime: '08:30',
      correctionReason: 'short'
    });

    expect(component.correctionForm.controls.correctionReason.errors?.['minlength']).toBeTruthy();
    expect(component.canSubmit()).toBe(false);
  });

  it('should validate correction reason max length', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const longReason = 'a'.repeat(1001);
    component.correctionForm.patchValue({
      checkInDate: '2025-10-16',
      checkInTime: '08:30',
      correctionReason: longReason
    });

    expect(component.correctionForm.controls.correctionReason.errors?.['maxlength']).toBeTruthy();
    expect(component.canSubmit()).toBe(false);
  });

  it('should validate future check-in date', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowDate = `${year}-${month}-${day}`;

    component.correctionForm.patchValue({
      checkInDate: tomorrowDate,
      checkInTime: '08:00',
      checkOutDate: '',
      checkOutTime: '',
      correctionReason: 'Test reason that is long enough'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true); // Form should be valid
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('La fecha de entrada no puede ser futura');
  });

  it('should validate check-in date older than 30 days', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 32);
    const year = oldDate.getFullYear();
    const month = String(oldDate.getMonth() + 1).padStart(2, '0');
    const day = String(oldDate.getDate()).padStart(2, '0');
    const oldDateStr = `${year}-${month}-${day}`;

    component.correctionForm.patchValue({
      checkInDate: oldDateStr,
      checkInTime: '08:00',
      checkOutDate: '',
      checkOutTime: '',
      correctionReason: 'Test reason that is long enough'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Solo se pueden corregir fichajes de los últimos 30 días');
  });

  it('should validate check-out after check-in', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    component.correctionForm.patchValue({
      checkInDate: todayStr,
      checkInTime: '17:00',
      checkOutDate: todayStr,
      checkOutTime: '08:00',
      correctionReason: 'Test reason that is long enough'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('La fecha de salida debe ser posterior a la de entrada');
  });

  it('should validate that values are different from original', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    // Set same values as original fichaje (within tolerance)
    component.correctionForm.patchValue({
      checkInDate: '2025-10-16',
      checkInTime: '08:00',
      checkOutDate: '2025-10-16',
      checkOutTime: '17:00',
      correctionReason: 'Test reason that is long enough'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true);
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Debe modificar al menos la fecha de entrada o salida');
  });

  it('should emit submit event with valid data', () => {
    let submitData: any;
    component.submit.subscribe((data) => {
      submitData = data;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    component.correctionForm.patchValue({
      checkInDate: todayStr,
      checkInTime: '08:30',
      checkOutDate: todayStr,
      checkOutTime: '17:30',
      correctionReason: 'Olvidé fichar a la hora correcta'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true);
    component.onSubmit();
    fixture.detectChanges();

    expect(submitData).toBeDefined();
    expect(submitData.checkIn).toBeInstanceOf(Date);
    expect(submitData.checkOut).toBeInstanceOf(Date);
    expect(submitData.correctionReason).toBe('Olvidé fichar a la hora correcta');
    expect(component.isSubmitting()).toBe(true);
  });

  it('should handle fichaje without check-out', () => {
    const fichajeWithoutCheckOut = {
      ...mockFichaje,
      checkOut: null,
      hoursWorked: null
    };

    fixture.componentRef.setInput('fichaje', fichajeWithoutCheckOut);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const formValue = component.correctionForm.value;
    expect(formValue.checkOutDate).toBe('');
    expect(formValue.checkOutTime).toBe('');
  });

  it('should reset form on close', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.correctionForm.patchValue({
      correctionReason: 'Test reason'
    });
    component.errorMessage.set('Test error');
    component.isSubmitting.set(true);

    component.onClose();

    expect(component.errorMessage()).toBeNull();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should set error message when setError is called', () => {
    component.setError('Test error message');
    expect(component.errorMessage()).toBe('Test error message');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should reset submitting state', () => {
    component.isSubmitting.set(true);
    component.resetSubmitting();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should disable submit button while submitting', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    component.correctionForm.patchValue({
      checkInDate: todayStr,
      checkInTime: '08:30',
      checkOutDate: '',
      checkOutTime: '',
      correctionReason: 'Valid reason that is long enough'
    });

    fixture.detectChanges();

    expect(component.correctionForm.valid).toBe(true);
    expect(component.canSubmit()).toBe(true);

    component.isSubmitting.set(true);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);
  });

  it('should show character counter', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const reason = 'Test reason';
    component.correctionForm.patchValue({
      correctionReason: reason
    });
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('.char-counter');
    expect(counter.textContent.trim()).toContain(`${reason.length} / 1000`);
  });
});
