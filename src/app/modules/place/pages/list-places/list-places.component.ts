import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-list-places',
  templateUrl: './list-places.component.html',
  styleUrl: './list-places.component.scss'
})
export class ListPlacesComponent implements OnInit {
  isMapView = false; 
  places: any[] = [];

  constructor(private http: HttpClient) {}

  toggleView(event: any) {
    this.isMapView = event.target.checked;
    console.log("Vue actuelle :", this.isMapView ? "Carte" : "Liste");
  }

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/places').subscribe(data => {
      this.places = data; 
    });
  }
}
