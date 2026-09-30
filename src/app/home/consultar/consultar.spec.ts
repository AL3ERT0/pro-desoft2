import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultarComponent } from './consultar';
import { provideNetworkStubs } from '../../core/testing/test-doubles';

describe('ConsultarComponent', () => {
  let component: ConsultarComponent;
  let fixture: ComponentFixture<ConsultarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarComponent],
      providers: [provideRouter([]), provideNetworkStubs()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
