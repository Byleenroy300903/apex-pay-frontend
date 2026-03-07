import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalBot } from './terminal-bot';

describe('TerminalBot', () => {
  let component: TerminalBot;
  let fixture: ComponentFixture<TerminalBot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalBot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminalBot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
