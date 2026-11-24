import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { MatrimonioPageRoutingModule } from './matrimonio-routing.module';

import { MatrimonioPage } from './matrimonio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MatrimonioPageRoutingModule
  ],
  declarations: [MatrimonioPage]
})
export class MatrimonioPageModule {}
