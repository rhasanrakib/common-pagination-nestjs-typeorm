import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatToyEntity } from './cat-toy.entity';
import { CatEntity } from './cat.entity';
import { PaginationParams } from './pagination-params.dto';
import { FilterOperator, paginate, Paginated } from './paginate';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(CatEntity)private cat: Repository<CatEntity>,
    @InjectRepository(CatToyEntity)private toy: Repository<CatToyEntity>,
  ) {}
  public async findAll(query: PaginationParams): Promise<Paginated<CatEntity>> {

    return await paginate(query, this.cat, {
      sortableColumns: ['id', 'name', 'color', 'age'],
      searchableColumns: ['name', 'color', 'age'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        age: [FilterOperator.GTE, FilterOperator.LTE],
        name: [FilterOperator.LIKE,FilterOperator.EQ]
      },
      relations:["toys"]
    })
  }

  async create(cat:CatEntity,toy:CatToyEntity, toy2:CatToyEntity){

      const cats = await this.cat.save(cat);
      const toys = await this.toy.save(toy);
      const toys2 = await this.toy.save(toy2);
      cats.toys=[toys,toys2];
      await this.cat.save(cats);
  }
}
