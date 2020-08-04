import { Component, OnInit } from '@angular/core';
import { EasyTrackFeatureService } from '../easy-track-feature.service';
import { Observable, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-authenticate-user',
  templateUrl: './authenticate-user.component.html',
  styleUrls: ['./authenticate-user.component.less']
})
export class AuthenticateUserComponent implements OnInit {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private featureService: EasyTrackFeatureService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      client: [],
      secret: []
    });
  }

  logIn(): void {
    if (this.form.invalid) {
      return;
    }
    const self = this;
    this.featureService.generateToken(this.form.get('client').value, this.form.get('secret').value, true)
      .subscribe(() => {
        location.reload();
      }, error => {
        this.handleError(error, self.form)
      });
  }

  private handleError(error: HttpErrorResponse, form: FormGroup) {
    this.form.reset();
    this.form.get('secret').setErrors({
      incorrectDetails: true
    });
    this.form.get('secret').markAsTouched();
    this.form.get('secret').markAsDirty();
  }
}
