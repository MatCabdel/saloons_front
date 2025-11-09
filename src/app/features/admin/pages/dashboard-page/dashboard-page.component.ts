import { Component } from '@angular/core';
import { DashboardNavComponent } from "../../components/dashboard-nav/dashboard-nav.component";
import { StatisticsPageComponent } from "../statistics-page/statistics-page.component";
import { UsersListPageComponent } from "../users-list-page/users-list-page.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DashboardNavComponent, StatisticsPageComponent, UsersListPageComponent, RouterModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  selectedPage: string = 'statistics';
  onMenuSelect(page: string): void {
    this.selectedPage = page;
  }
}
