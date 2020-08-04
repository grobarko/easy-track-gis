import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';


@Component({
  selector: 'app-add-points-dialog',
  templateUrl: './add-points-dialog.component.html',
  styleUrls: ['./add-points-dialog.component.less']
})
export class AddPointsDialogComponent implements OnInit {

  utmZones: string[] = Array(60).fill(1).map((x, i) => (i + 1) + "");
  filteredUtmZones: Observable<string[]>;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddPointsDialogComponent>) {  }

  ngOnInit() : void {
    this.form = this.fb.group({
      name: [],
      description: [],
      fileName: [{value: '', disabled: true}],
      fileContent: [],
      utmZone: []
    });

    this.filteredUtmZones = this.form.get("utmZone").valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  onFileSelected() : void {
    const inputNode: any = document.querySelector('#file');
  
    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();
      const file = inputNode.files[0];

      reader.onload = (e: any) => {
        this.form.patchValue({ 
          fileName: file.name,
          fileContent: e.target.result
        });
      };
  
      reader.readAsText(file);
    }
  }

  save() : void {
    this.dialogRef.close(this.form.value);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.utmZones.filter(zone => zone.toLowerCase().includes(filterValue));
  }

}
