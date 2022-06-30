import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatToyEntity } from './cat-toy.entity';
import { CatEntity } from './cat.entity';
import { ToyEntity } from './toy.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [__dirname + '/**/*.entity.{js,ts}'],
    synchronize: true,
  }),
  TypeOrmModule.forFeature([ToyEntity,CatToyEntity,CatEntity])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
