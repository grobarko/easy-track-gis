import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AddPointsDialogComponent } from './add-points-dialog/add-points-dialog.component';
import { Subject } from 'rxjs'
import { NewPoints } from './add-points-dialog/new-points.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  addPointsSubject: Subject<NewPoints> = new Subject<NewPoints>();
  queryChangedSubject: Subject<string> = new Subject<string>();
  followMeChangedSubject: Subject<boolean> = new Subject<boolean>();

  query: string;
  followMe: boolean = false;

  constructor(private dialog: MatDialog) {}
  
  openAddPointsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "add-points-dialog";
    const dialogRef = this.dialog.open(AddPointsDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      (data: NewPoints) => {
        data && this.addPointsSubject.next(data);
      }
    );  
  }

  onQueryChanged(query) {
    console.log("Search: " + query);
    this.queryChangedSubject.next(query);
  }

  onFollowMeChanged(follow) {
    console.log("Follow me: " + follow);
    this.followMeChangedSubject.next(follow);
  }

}
