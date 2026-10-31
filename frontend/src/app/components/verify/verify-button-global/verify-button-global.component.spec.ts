import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { VerifyButtonGlobalComponent } from './verify-button-global.component';
import { VerifierService } from '../../../services/verifier/verifier.service';
import { TreeService } from '../../../services/tree/tree.service';
import { NetworkJobService } from '../../../services/tree/network/network-job.service';
import { ProjectService } from '../../../services/project/project.service';
import { FUNCTIONAL_VERIFIER_ID, Verifier } from '../../../types/Verifier';

const functional: Verifier = {
  id: FUNCTIONAL_VERIFIER_ID,
  label: 'Functional correctness',
  enabled: true,
  toggleable: false,
  settings: [],
  variables: [],
};

const mock = (overrides: Partial<Verifier> = {}): Verifier => ({
  id: 'mock',
  label: 'Mock',
  enabled: true,
  settings: [],
  variables: [],
  ...overrides,
});

/** Mirrors the parts of {@link VerifierService} the button reads. */
class VerifierServiceStub {
  readonly verifiers = signal<Verifier[]>([functional]);
  readonly verifiersValid = signal(true);
  private readonly _functionalOnly = signal(false);
  readonly functionalOnly = this._functionalOnly.asReadonly();
  readonly invalidVerifierSettings: Verifier[] = [];

  setFunctionalOnly(functionalOnly: boolean): void {
    this._functionalOnly.set(functionalOnly);
  }

  get enabledNonFunctionalVerifierIds(): string[] {
    return this.verifiers()
      .filter((verifier) => verifier.enabled && verifier.id !== FUNCTIONAL_VERIFIER_ID)
      .map((verifier) => verifier.id);
  }
}

describe('VerifyButtonGlobalComponent', () => {
  let component: VerifyButtonGlobalComponent;
  let fixture: ComponentFixture<VerifyButtonGlobalComponent>;
  let verifierService: VerifierServiceStub;
  let networkJobService: jasmine.SpyObj<NetworkJobService>;

  const splitButton = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.verify-splitbutton');
  const plainButton = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.verify-plain-button');
  const splitButtonLabel = (): string =>
    splitButton()!.querySelector('.p-splitbutton-button')!.textContent!.trim();
  const checkedOptionId = (): string | undefined =>
    component.verifyOptions().find((option) => option.icon === 'pi pi-check')?.id;

  const showCatalog = (verifiers: Verifier[]): void => {
    verifierService.verifiers.set(verifiers);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    verifierService = new VerifierServiceStub();
    networkJobService = jasmine.createSpyObj('NetworkJobService', ['verify']);
    const treeService = jasmine.createSpyObj('TreeService', ['finalizeStatements', 'beginRun'], {
      rootFormula: {},
      urn: 'urn',
    });

    await TestBed.configureTestingModule({
      imports: [VerifyButtonGlobalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        DialogService,
        ConfirmationService,
        MessageService,
        { provide: VerifierService, useValue: verifierService },
        { provide: TreeService, useValue: treeService },
        { provide: NetworkJobService, useValue: networkJobService },
        { provide: ProjectService, useValue: { shouldCreateProject: false, projectId: 'project' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyButtonGlobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows a plain "Verify" button and no split button when the Catalog holds only the Functional Verifier', () => {
    expect(splitButton()).toBeNull();
    expect(plainButton()).not.toBeNull();
    expect(plainButton()!.textContent!.trim()).toBe('Verify');
  });

  it('shows the split button labelled "Verify (2/2)" when one other Verifier is enabled', () => {
    showCatalog([functional, mock()]);

    expect(plainButton()).toBeNull();
    expect(splitButton()).not.toBeNull();
    expect(splitButtonLabel()).toBe('Verify (2/2)');
  });

  it('shows the plain button when every other Verifier is disabled or locked off', () => {
    showCatalog([
      functional,
      mock({ id: 'disabled', enabled: false }),
      mock({ id: 'locked', enabled: false, toggleable: false }),
    ]);

    expect(splitButton()).toBeNull();
    expect(plainButton()!.textContent!.trim()).toBe('Verify');
  });

  it('keeps the selected mode while the dropdown is hidden and shows it again when it returns', () => {
    showCatalog([functional, mock()]);
    component.verifyOptions().find((option) => option.id === 'functional')!.command!({});
    fixture.detectChanges();

    showCatalog([functional, mock({ enabled: false })]);
    expect(splitButton()).toBeNull();
    expect(plainButton()!.textContent!.trim()).toBe('Verify');
    expect(verifierService.functionalOnly()).toBeTrue();

    showCatalog([functional, mock()]);
    expect(splitButtonLabel()).toBe('Verify functional');
    expect(checkedOptionId()).toBe('functional');
  });

  it('verifies with the stored mode when the plain button is clicked', () => {
    verifierService.setFunctionalOnly(true);
    fixture.detectChanges();

    plainButton()!.querySelector('button')!.click();

    expect(networkJobService.verify).toHaveBeenCalledWith({} as never, 'project', 'urn', true);
  });
});
