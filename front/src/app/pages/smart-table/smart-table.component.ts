import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';

@Component({
  selector: 'app-smart-table',
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.scss'],
})
export class SmartTableComponent implements OnInit {

  // Paramètres des boutons du tableau
  private _setting: any = {
    mode: 'inline',
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: null,
  };

  // Init les intitulés de colonne
  @Input() public columns: any;
  // Charge les datas
  @Input() public data: [];
  // Init le tableau en data
  private _source: LocalDataSource = new LocalDataSource();

  @Output() public create: EventEmitter<any> = new EventEmitter<any>();
  @Output() public edit: EventEmitter<any> = new EventEmitter<any>();
  @Output() public delete: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
    if (this.columns) {
      this._setting.columns = this.columns;
    }

    if (this.data && this.data.length > 0) {
      this._source.load(this.data).then();
    }
  }

  public onCreate(event) {
    console.log('*create', event);
    // event.confirm.resolve();
    this.create.emit(event);
  }


  public onEdit(event) {
    console.log('*edit', event);
    // event.confirm.resolve();
    this.edit.emit(event);
  }

  public onDelete(event) {
    console.log('*delete', event);
    if (window.confirm('Are you sure you want to delete?')) {
      this.delete.emit(event);
      // event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }

  /**
   * Alimente le tableau avec les datas
   * @return LocalDataSource
   */
  getSource(): LocalDataSource {
    return this._source;
  }

  getSetting() {
    return this._setting;
  }
}