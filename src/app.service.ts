import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatToyEntity } from './cat-toy.entity';
import { CatEntity } from './cat.entity';
import { PaginationParams } from './pagination-params.dto';
import { FilterOperator, paginate, Paginated } from './paginate';
import { ToyEntity } from './toy.entity';
import { Connection } from 'mysql2';
import { PaginateConfiguration } from './p';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(CatEntity) private cat: Repository<CatEntity>,
    @InjectRepository(CatToyEntity) private catToy: Repository<CatToyEntity>,
    @InjectRepository(ToyEntity) private toy: Repository<ToyEntity>,
    @InjectConnection() private readonly connection: Connection,
  ) { }
  public async findAll(query: PaginationParams): Promise<any> {
    return await this.services()
    // return await paginate(query, this.cat, {
    //   sortableColumns: ['id', 'name', 'color', 'age'],
    //   searchableColumns: ['name', 'color', 'age'],
    //   defaultSortBy: [['id', 'DESC']],
    //   filterableColumns: {
    //     age: [FilterOperator.GTE, FilterOperator.LTE],
    //     name: [FilterOperator.LIKE,FilterOperator.EQ]
    //   },
    //   relations:['cat_toy']
    // })
  }
  async services(){
    const a = {
      relations: {
        cat_entity: {
          primary_key: "",
          foregin_key: "id",
          select_col: ["name","color","age"],
          join: {
            cat_toy_entity: {
              primary_key: "cat_id",// on cat_entity.id = cat_toy_entity.cat_id
              foregin_key: "toy_id",
              select_col: [],
              join: {
                toy_entity: {
                  primary_key: "id", // on cat_toy_entity.toy_id = toy_entity.id
                  foregin_key: "",
                  select_col: ["name","color"],
                }
              }
            }
          }
        }
      }
    }
    const joinq= await this.manager(a);
    console.log(joinq);
    return this.connection.query(joinq);
  }
  async manager(config) {
    
    let joinQuery = "";
    let colSelect ="";
    const relation = config.relations;

    function internalJoin(entity,relationObj){
      if(!entity || !relationObj){
        return;
      }

      if(relationObj[entity].hasOwnProperty("select_col")){
        if(relationObj[entity].select_col.length>0){
          for (const col of relationObj[entity].select_col) {
            colSelect += `${entity}.${col} AS ${entity}_${col} ,`;
          }
        }
      }
      if(relationObj[entity].hasOwnProperty("primary_key")){

        if(relationObj[entity].primary_key.length>0){
          joinQuery+=`${entity}.${relationObj[entity].primary_key}`
        }
        
      }
      if(relationObj[entity].hasOwnProperty("join")){
        
        const nextKey = Object.keys(relationObj[entity].join)[0];
        joinQuery+= " LEFT JOIN "+ nextKey + " ON "+ entity+"."+relationObj[entity].foregin_key +" = ";
        const nextObj = relationObj[entity]['join']
        internalJoin(nextKey, nextObj)
      }else{

        return;
      }
    }
    
    for (const entity in relation) {

      internalJoin(entity,relation);
      if (Object.keys(relation)[Object.keys(relation).length-1] != entity){
        joinQuery+= " LEFT JOIN "+ entity + " ON "+ entity+"."+relation[entity].foregin_key +" = ";
      } 
    }
    colSelect = colSelect.slice(0, -1)
    return `SELECT ${colSelect} FROM ${Object.keys(relation)[0]} ${joinQuery}`;
    const query = `SELECT cat_entity.name as cat_name, cat_entity.color, cat_entity.age, toy_entity.name, toy_entity.color as toy_color from cat_entity LEFT JOIN cat_toy_entity ON cat_entity.id= cat_toy_entity.cat_id LEFT JOIN toy_entity ON cat_toy_entity.toy_id = toy_entity.id LIMIT 0, 2;`
    //return this.connection.query(query);
  }
  async create(cat: CatEntity, cat2: CatEntity, toy: ToyEntity, toy2: ToyEntity) {

    const cats = await this.cat.save(cat);
    const cats2 = await this.cat.save(cat2);
    const toys = await this.toy.save(toy);
    const toys2 = await this.toy.save(toy2);

    let cattoy = new CatToyEntity()
    cattoy.cat_id = cats.id;
    cattoy.toy_id = toy.id;
    await this.catToy.save(cattoy)

    cattoy = new CatToyEntity()
    cattoy.cat_id = cats2.id;
    cattoy.toy_id = toy2.id;
    return await this.catToy.save(cattoy)

  }
}
/*

SELECT COUNT(cat_entity.id) from cat_entity LEFT JOIN cat_toy_entity ON cat_entity.id= cat_toy_entity.cat_id  LIMIT 0, 2;
``   ljkjjjjhghjgffgghuhihjyuhkjhjhhh
*/