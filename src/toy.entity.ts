import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'
import { CatToyEntity } from './cat-toy.entity'


@Entity()
export class ToyEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    name: string

    @Column()
    color: string


    @OneToMany(() => CatToyEntity, (catToy) => catToy.toy_cat)
    @JoinColumn()
    toy_cat?: CatToyEntity[]

}
