import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NbAuthModule, NbPasswordAuthStrategy } from '@nebular/auth';

import { CustomersComponent } from './customers.component';
import { NbDialogRef, NbDialogService, NbThemeModule, NbToastrModule } from '@nebular/theme';
import { ReactiveFormsModule } from '@angular/forms';

describe('CustomersComponent', () => {
  let component: CustomersComponent;
  let fixture: ComponentFixture<CustomersComponent>;

  beforeEach(async () => {
    const dialMock = jasmine.createSpy();
    const dialMockRef = jasmine.createSpy();
    await TestBed.configureTestingModule({
      declarations: [ CustomersComponent ],
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NbAuthModule.forRoot({
          strategies: [
            NbPasswordAuthStrategy.setup({
              name: 'email',
            }),
          ],
        }),
        RouterTestingModule.withRoutes([]),
        NbThemeModule.forRoot(),
        NbToastrModule.forRoot(),
      ],
      providers: [
        {provide: NbDialogService, useClass: dialMock},
        {provide: NbDialogRef, useClass: dialMockRef},
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
