import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployVaultModal } from './deploy-vault-modal';

describe('DeployVaultModal', () => {
  let component: DeployVaultModal;
  let fixture: ComponentFixture<DeployVaultModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployVaultModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeployVaultModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
