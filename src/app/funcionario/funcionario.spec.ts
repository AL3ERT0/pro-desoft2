import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuncionarioComponent } from './funcionario';
import { provideNetworkStubs } from '../core/testing/test-doubles';

describe('FuncionarioComponent', () => {

  let component: FuncionarioComponent;
  let fixture: ComponentFixture<FuncionarioComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [FuncionarioComponent],
      providers: [provideRouter([]), provideNetworkStubs()],
    }).compileComponents();

    fixture = TestBed.createComponent(FuncionarioComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
