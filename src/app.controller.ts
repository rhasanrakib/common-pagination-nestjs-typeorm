import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { faker } from '@faker-js/faker';
import { CatEntity } from './cat.entity';
import { CatToyEntity } from './cat-toy.entity';
import { PaginationParams } from './pagination-params.dto';
import { Pagination } from './decorator';
import { ToyEntity } from './toy.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async getHello(@Query(new Pagination())query: PaginationParams) {
    return await this.appService.findAll(query);
    //return await this.appService.manager();
  }
  @Post()
  async create() {
    return await this.appService.create(this.cat(),this.cat(),this.toy(),this.toy())
  }
  toy(): ToyEntity {
    return {
      name: faker.name.firstName(),
      color:faker.color.human()
    }
  }
  cat(): CatEntity {
    return {
      name: faker.name.firstName(),
      age: parseInt(faker.random.numeric(2)),
      color: faker.color.human(),
    }
  }
}
