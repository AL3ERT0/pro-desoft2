import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarSolicitudesComponent } from './asignar-solicitudes';
import { provideNetworkStubs } from '../../core/testing/test-doubles';

describe('AsignarSolicitudesComponent', () => {
  let component: AsignarSolicitudesComponent;
  let fixture: ComponentFixture<AsignarSolicitudesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarSolicitudesComponent],
      providers: [provideRouter([]), provideNetworkStubs()],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
